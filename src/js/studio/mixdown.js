import { audioBufferToWav } from "../effects.js";
import { isInstrumentClip, renderInstrumentClip } from "./instrument-renderer.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function panGains(pan = 0) {
  const angle = (clamp(pan, -1, 1) + 1) * Math.PI / 4;
  return { left: Math.cos(angle), right: Math.sin(angle) };
}

function lufsFromMeanSquare(meanSquare) {
  return meanSquare > 0 ? 10 * Math.log10(meanSquare) : -Infinity;
}

function meanSquareRange(left, right, start, end) {
  let sum = 0;
  let frames = 0;
  for (let index = start; index < end; index += 1) {
    sum += ((left[index] ** 2) + (right[index] ** 2)) / 2;
    frames += 1;
  }
  return frames ? sum / frames : 0;
}

export function calculateIntegratedLufs(left = new Float32Array(), right = left, { gateDb = -70 } = {}) {
  const length = Math.min(left.length, right.length);
  const lufs = lufsFromMeanSquare(meanSquareRange(left, right, 0, length));
  return lufs < Number(gateDb) ? -Infinity : lufs;
}

export function calculateShortTermLufs(left = new Float32Array(), right = left, sampleRate = 44100, { windowSeconds = 3, gateDb = -70 } = {}) {
  const length = Math.min(left.length, right.length);
  const windowFrames = Math.max(1, Math.min(length || 1, Math.floor(Number(sampleRate) * Number(windowSeconds || 3))));
  const start = Math.max(0, length - windowFrames);
  const lufs = lufsFromMeanSquare(meanSquareRange(left, right, start, length));
  return lufs < Number(gateDb) ? -Infinity : lufs;
}

export function calculateLoudnessMetrics(left = new Float32Array(), right = left, sampleRate = 44100, options = {}) {
  return {
    integratedLufs: calculateIntegratedLufs(left, right, options),
    shortTermLufs: calculateShortTermLufs(left, right, sampleRate, options),
  };
}

export function applyMastering(left, right, { threshold = 0.72, ratio = 2.8, ceiling = 0.89 } = {}) {
  const safeThreshold = clamp(threshold, 0.25, 0.95);
  const safeRatio = Math.max(1, Number(ratio) || 1);
  const safeCeiling = clamp(ceiling, 0.5, 0.98);
  let peakBefore = 0;
  for (let index = 0; index < left.length; index += 1) {
    const process = (sample) => {
      const absolute = Math.abs(sample);
      peakBefore = Math.max(peakBefore, absolute);
      if (absolute <= safeThreshold) return sample;
      const compressed = safeThreshold + (absolute - safeThreshold) / safeRatio;
      return Math.sign(sample) * compressed;
    };
    left[index] = process(left[index]);
    right[index] = process(right[index]);
  }
  let compressedPeak = 0;
  for (let index = 0; index < left.length; index += 1) compressedPeak = Math.max(compressedPeak, Math.abs(left[index]), Math.abs(right[index]));
  const scale = compressedPeak > safeCeiling ? safeCeiling / compressedPeak : 1;
  let sumSquares = 0;
  for (let index = 0; index < left.length; index += 1) {
    left[index] *= scale;
    right[index] *= scale;
    sumSquares += (left[index] ** 2 + right[index] ** 2) / 2;
  }
  const peakAfter = compressedPeak * scale;
  const rms = left.length ? Math.sqrt(sumSquares / left.length) : 0;
  const loudnessDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  const loudness = calculateLoudnessMetrics(left, right);
  return { peakBefore, compressedPeak, scale, peakAfter, rms, loudnessDb, ...loudness };
}

export function calculateMixdownLength(project = {}, sampleRate = 44100) {
  const seconds = (project.tracks || []).reduce((total, track) => (
    (track.clips || []).reduce((trackTotal, clip) => Math.max(trackTotal, Number(clip.start || 0) + Number(clip.duration || 0)), total)
  ), 0);
  return Math.max(0, Math.ceil(seconds * sampleRate));
}

export function mixTimelineBuffers(project = {}, buffers = new Map(), { sampleRate = 44100, masterGain = 1, headroom = 0.98 } = {}) {
  const length = calculateMixdownLength(project, sampleRate);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const tracks = project.tracks || [];
  const soloActive = tracks.some((track) => track.solo);
  let clipCount = 0;

  tracks.forEach((track) => {
    if (track.muted || (soloActive && !track.solo)) return;
    const trackGain = clamp(track.volume ?? track.gain ?? 1, 0, 2);
    const pan = panGains(track.pan);
    (track.clips || []).forEach((clip) => {
      const source = buffers.get(clip.blobKey) || buffers.get(clip.id) || (isInstrumentClip(clip) ? renderInstrumentClip(clip, { sampleRate, tempo: project.tempo }) : null);
      if (!(source instanceof Float32Array)) return;
      clipCount += 1;
      const start = Math.max(0, Math.floor(Number(clip.start || 0) * sampleRate));
      const offset = Math.max(0, Math.floor(Number(clip.sourceOffset || 0) * sampleRate));
      const frames = Math.min(source.length - offset, Math.max(0, Math.ceil(Number(clip.duration || 0) * sampleRate)));
      const fadeInFrames = Math.floor(clamp(clip.fadeIn, 0, Number(clip.duration || 0)) * sampleRate);
      const fadeOutFrames = Math.floor(clamp(clip.fadeOut, 0, Number(clip.duration || 0)) * sampleRate);
      for (let frame = 0; frame < frames && start + frame < length; frame += 1) {
        let envelope = 1;
        if (fadeInFrames > 0) envelope = Math.min(envelope, frame / fadeInFrames);
        if (fadeOutFrames > 0) envelope = Math.min(envelope, (frames - frame) / fadeOutFrames);
        const value = source[offset + frame] * clamp(clip.gain, 0, 2) * trackGain * envelope * Number(masterGain || 0);
        left[start + frame] += value * pan.left;
        right[start + frame] += value * pan.right;
      }
    });
  });

  const mastering = applyMastering(left, right, { ceiling: clamp(headroom, 0.5, 0.98) });
  const loudness = calculateLoudnessMetrics(left, right, sampleRate);
  return { left, right, sampleRate, clipCount, peakBeforeHeadroom: mastering.peakBefore, peakAfterHeadroom: mastering.peakAfter, scale: mastering.scale, loudnessDb: mastering.loudnessDb, ...loudness, mastering };
}

export function createStereoAudioBuffer({ left, right, sampleRate = 44100 }) {
  return {
    numberOfChannels: 2,
    sampleRate,
    length: left.length,
    duration: left.length / sampleRate,
    getChannelData(channel) { return channel === 0 ? left : right; },
  };
}

export function mixdownBuffersToWav(project, buffers, options = {}) {
  const mixed = mixTimelineBuffers(project, buffers, options);
  return { ...mixed, wav: audioBufferToWav(createStereoAudioBuffer(mixed)) };
}

export async function renderTimelineToWav(project, blobByKey, options = {}) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const OfflineContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AudioContextClass || !OfflineContextClass) throw new Error("Web Audio API indisponível");
  const context = new AudioContextClass();
  try {
    const decoded = new Map();
    for (const [key, blob] of blobByKey.entries()) decoded.set(key, await context.decodeAudioData(await blob.arrayBuffer()));
    const sampleRate = options.sampleRate || decoded.values().next().value?.sampleRate || 44100;
    const length = calculateMixdownLength(project, sampleRate);
    if (!length) throw new Error("A timeline não tem áudio exportável");
    const offline = new OfflineContextClass(2, length, sampleRate);
    const soloActive = (project.tracks || []).some((track) => track.solo);
    (project.tracks || []).forEach((track) => {
      if (track.muted || (soloActive && !track.solo)) return;
      (track.clips || []).forEach((clip) => {
        let sourceBuffer = decoded.get(clip.blobKey) || decoded.get(clip.id);
        if (!sourceBuffer && isInstrumentClip(clip)) {
          const rendered = renderInstrumentClip(clip, { sampleRate, tempo: project.tempo });
          sourceBuffer = offline.createBuffer(1, rendered.length, sampleRate);
          sourceBuffer.copyToChannel(rendered, 0);
        }
        if (!sourceBuffer) return;
        const source = offline.createBufferSource();
        source.buffer = sourceBuffer;
        const gain = offline.createGain();
        const trackGain = clamp(track.volume ?? track.gain ?? 1, 0, 2);
        const clipGain = clamp(clip.gain, 0, 2);
        const duration = Math.min(Number(clip.duration || sourceBuffer.duration), sourceBuffer.duration - Number(clip.sourceOffset || 0));
        const start = Math.max(0, Number(clip.start || 0));
        const fadeIn = Math.min(Number(clip.fadeIn || 0), duration / 2);
        const fadeOut = Math.min(Number(clip.fadeOut || 0), duration / 2);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(trackGain * clipGain, start + fadeIn);
        gain.gain.setValueAtTime(trackGain * clipGain, start + Math.max(fadeIn, duration - fadeOut));
        gain.gain.linearRampToValueAtTime(0, start + duration);
        const stereo = offline.createStereoPanner ? offline.createStereoPanner() : null;
        if (stereo) { stereo.pan.value = clamp(track.pan, -1, 1); source.connect(gain).connect(stereo).connect(offline.destination); }
        else source.connect(gain).connect(offline.destination);
        source.start(start, Math.max(0, Number(clip.sourceOffset || 0)), duration);
      });
    });
    const rendered = await offline.startRendering();
    const left = new Float32Array(rendered.getChannelData(0));
    const right = new Float32Array(rendered.numberOfChannels > 1 ? rendered.getChannelData(1) : rendered.getChannelData(0));
    applyMastering(left, right, { ceiling: options.headroom || 0.89, ...(options.mastering || {}) });
    return audioBufferToWav(createStereoAudioBuffer({ left, right, sampleRate }));
  } finally {
    await context.close();
  }
}
