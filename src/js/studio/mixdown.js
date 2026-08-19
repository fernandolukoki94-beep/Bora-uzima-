import { audioBufferToWav } from "../effects.js";
import { isInstrumentClip, renderInstrumentClip } from "./instrument-renderer.js";
import { evaluateAutomationLane, normalizeTrackAutomation } from "./automation.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function panGains(pan = 0) {
  const angle = (clamp(pan, -1, 1) + 1) * Math.PI / 4;
  return { left: Math.cos(angle), right: Math.sin(angle) };
}

const MODULAR_FX_TYPES = ["compressor", "limiter", "eq", "chorus", "flanger", "saturation", "de-esser", "gate"];

export function normalizeTrackEffects(effects = []) {
  return (Array.isArray(effects) ? effects : []).map((effect) => ({
    type: MODULAR_FX_TYPES.includes(effect?.type) ? effect.type : "compressor",
    intensity: clamp(effect?.intensity ?? 0.5, 0, 1),
    bypass: Boolean(effect?.bypass),
  }));
}

function makeSaturationCurve(intensity) {
  const curve = new Float32Array(1024);
  const amount = 1 + intensity * 8;
  for (let index = 0; index < curve.length; index += 1) {
    const x = (index * 2) / (curve.length - 1) - 1;
    curve[index] = Math.tanh(amount * x) / Math.tanh(amount);
  }
  return curve;
}

function scheduleAutomationParam(param, lane, startTime, duration, fallback, mapValue = (value) => value) {
  if (!param || !lane?.points?.length) return;
  const endTime = startTime + Math.max(0, duration);
  const points = lane.points.filter((point) => point.time >= startTime && point.time <= endTime);
  const initial = evaluateAutomationLane(lane, startTime, fallback);
  param.setValueAtTime(mapValue(initial), startTime);
  points.forEach((point) => {
    const at = Math.max(startTime, Math.min(endTime, point.time));
    param.linearRampToValueAtTime(mapValue(point.value), at);
  });
}

function connectTrackEffects(context, track, input, destination, { startTime = 0, duration = 0 } = {}) {
  const automation = normalizeTrackAutomation(track?.automation);
  const fxLanes = automation.enabled ? automation.lanes.filter((lane) => lane.target === "fx") : [];
  const effectLane = (index) => fxLanes.find((lane) => lane.fxIndex === index);

  let current = input;
  normalizeTrackEffects(track?.effects).forEach((effect, effectIndex) => {
    if (effect.bypass || effect.intensity <= 0) return;
    const intensity = effect.intensity;
    const lane = effectLane(effectIndex);
    if (effect.type === "compressor" || effect.type === "gate" || effect.type === "de-esser") {
      if (effect.type === "de-esser") {
        const filter = context.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 4200;
        current.connect(filter);
        current = filter;
      }
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = effect.type === "gate" ? -48 + intensity * 18 : -30 + intensity * 12;
      compressor.ratio.value = effect.type === "gate" ? 12 + intensity * 8 : 1.5 + intensity * 8;
      compressor.attack.value = effect.type === "de-esser" ? 0.001 : 0.003;
      compressor.release.value = 0.08 + intensity * 0.2;
      if (lane) {
        scheduleAutomationParam(compressor.threshold, lane, startTime, duration, intensity, (value) => effect.type === "gate" ? -48 + value * 18 : -30 + value * 12);
        scheduleAutomationParam(compressor.ratio, lane, startTime, duration, intensity, (value) => effect.type === "gate" ? 12 + value * 8 : 1.5 + value * 8);
        scheduleAutomationParam(compressor.release, lane, startTime, duration, intensity, (value) => 0.08 + value * 0.2);
      }
      current.connect(compressor);
      current = compressor;
      return;
    }
    if (effect.type === "limiter") {
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -2 - intensity * 10;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.08;
      if (lane) scheduleAutomationParam(limiter.threshold, lane, startTime, duration, intensity, (value) => -2 - value * 10);
      current.connect(limiter);
      current = limiter;
      return;
    }
    if (effect.type === "eq") {
      const eq = context.createBiquadFilter();
      eq.type = "peaking";
      eq.frequency.value = 1800;
      eq.Q.value = 0.8;
      eq.gain.value = -3 + intensity * 6;
      if (lane) scheduleAutomationParam(eq.gain, lane, startTime, duration, intensity, (value) => -3 + value * 6);
      current.connect(eq);
      current = eq;
      return;
    }
    if (effect.type === "saturation") {
      const saturator = context.createWaveShaper();
      saturator.curve = makeSaturationCurve(intensity);
      saturator.oversample = "2x";
      current.connect(saturator);
      current = saturator;
      return;
    }
    if (effect.type === "chorus" || effect.type === "flanger") {
      const delay = context.createDelay(0.05);
      delay.delayTime.value = effect.type === "chorus" ? 0.018 : 0.004;
      const wet = context.createGain();
      wet.gain.value = 0.15 + intensity * 0.35;
      if (lane) scheduleAutomationParam(wet.gain, lane, startTime, duration, intensity, (value) => 0.15 + value * 0.35);
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      lfo.frequency.value = effect.type === "chorus" ? 0.8 : 0.25;
      lfoGain.gain.value = effect.type === "chorus" ? 0.004 * intensity : 0.0015 * intensity;
      lfo.connect(lfoGain).connect(delay.delayTime);
      current.connect(delay).connect(wet);
      const dry = context.createGain();
      dry.gain.value = 1 - intensity * 0.25;
      current.connect(dry);
      const merger = context.createGain();
      dry.connect(merger);
      wet.connect(merger);
      lfo.start(0);
      current = merger;
    }
  });
  current.connect(destination);
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
  const trackMetrics = {};

  tracks.forEach((track) => {
    if (track.muted || (soloActive && !track.solo)) return;
    const trackGain = clamp(track.volume ?? track.gain ?? 1, 0, 2);
    const pan = panGains(track.pan);
    let trackPeak = 0;
    let trackSumSquares = 0;
    let trackFrames = 0;
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
        trackPeak = Math.max(trackPeak, Math.abs(value));
        trackSumSquares += value ** 2;
        trackFrames += 1;
        left[start + frame] += value * pan.left;
        right[start + frame] += value * pan.right;
      }
    });
    const trackRms = trackFrames ? Math.sqrt(trackSumSquares / trackFrames) : 0;
    trackMetrics[track.id] = { peak: trackPeak, rms: trackRms, peakDb: trackPeak > 0 ? 20 * Math.log10(trackPeak) : -Infinity, rmsDb: trackRms > 0 ? 20 * Math.log10(trackRms) : -Infinity, frames: trackFrames, stage: "pre-fx" };
  });

  const mastering = applyMastering(left, right, { ceiling: clamp(headroom, 0.5, 0.98) });
  const loudness = calculateLoudnessMetrics(left, right, sampleRate);
  return { left, right, sampleRate, clipCount, trackMetrics, peakBeforeHeadroom: mastering.peakBefore, peakAfterHeadroom: mastering.peakAfter, scale: mastering.scale, loudnessDb: mastering.loudnessDb, ...loudness, mastering };
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
      const trackAutomation = normalizeTrackAutomation(track.automation);
    const volumeLane = trackAutomation.enabled ? trackAutomation.lanes.find((lane) => lane.target === "volume") : null;
    const panLane = trackAutomation.enabled ? trackAutomation.lanes.find((lane) => lane.target === "pan") : null;
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
        const automatedVolume = volumeLane ? evaluateAutomationLane(volumeLane, start, trackGain) : trackGain;
        const automatedPan = panLane ? evaluateAutomationLane(panLane, start, Number(track.pan) || 0) : Number(track.pan) || 0;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(automatedVolume * clipGain, start + fadeIn);
        gain.gain.setValueAtTime(trackGain * clipGain, start + Math.max(fadeIn, duration - fadeOut));
        gain.gain.linearRampToValueAtTime(0, start + duration);
        if (volumeLane) scheduleAutomationParam(gain.gain, volumeLane, start, duration, trackGain, (value) => value * clipGain);
        const stereo = offline.createStereoPanner ? offline.createStereoPanner() : null;
        const effectInput = source.connect(gain);
        if (stereo) {
          stereo.pan.value = clamp(automatedPan, -1, 1);
          if (panLane) scheduleAutomationParam(stereo.pan, panLane, start, duration, Number(track.pan) || 0, (value) => clamp(value, -1, 1));
          connectTrackEffects(offline, track, effectInput, stereo, { startTime: start, duration });
          stereo.connect(offline.destination);
        } else {
          connectTrackEffects(offline, track, effectInput, offline.destination, { startTime: start, duration });
        }
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
