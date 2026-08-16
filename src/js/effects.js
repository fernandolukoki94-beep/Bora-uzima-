function writeAscii(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
}

export function audioBufferToWav(audioBuffer) {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const frameCount = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export function getPeak(audioBuffer) {
  let peak = 0;
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const samples = audioBuffer.getChannelData(channel);
    for (let index = 0; index < samples.length; index += 1) peak = Math.max(peak, Math.abs(samples[index]));
  }
  return peak;
}

export function calculateSafeGain(audioBuffer, requestedGain = 1.4125, headroom = 0.98) {
  const peak = getPeak(audioBuffer);
  const safeGain = peak > 0 ? Math.min(requestedGain, headroom / peak) : requestedGain;
  return { peak, requestedGain, appliedGain: safeGain, limited: safeGain < requestedGain };
}

export function normalizeSamples(samples, targetPeak = 0.95) {
  const peak = samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
  const gain = peak > 0 ? Math.min(1 / peak, targetPeak / peak) : 1;
  return Float32Array.from(samples, (sample) => Math.max(-1, Math.min(1, sample * gain)));
}

export function compressSamples(samples, { threshold = 0.6, ratio = 4, makeup = 1 } = {}) {
  const safeThreshold = Math.max(0.01, Math.min(1, threshold));
  const safeRatio = Math.max(1, ratio);
  return Float32Array.from(samples, (sample) => {
    const sign = sample < 0 ? -1 : 1;
    const magnitude = Math.abs(sample);
    const compressed = magnitude <= safeThreshold
      ? magnitude
      : safeThreshold + (magnitude - safeThreshold) / safeRatio;
    return Math.max(-1, Math.min(1, sign * compressed * Math.max(0, makeup)));
  });
}

export function noiseGateSamples(samples, { threshold = 0.025, floor = 0 } = {}) {
  const safeThreshold = Math.max(0, Math.min(1, threshold));
  const safeFloor = Math.max(0, Math.min(1, floor));
  return Float32Array.from(samples, (sample) => Math.abs(sample) < safeThreshold ? safeFloor : sample);
}

function withDecodedAudio(blob, renderGraph) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const OfflineContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AudioContextClass || !OfflineContextClass) throw new Error("Web Audio API indisponível");
  return (async () => {
    const audioContext = new AudioContextClass();
    try {
      const decoded = await audioContext.decodeAudioData(await blob.arrayBuffer());
      const offline = new OfflineContextClass(decoded.numberOfChannels, decoded.length, decoded.sampleRate);
      const source = offline.createBufferSource();
      source.buffer = decoded;
      renderGraph({ offline, source, decoded });
      source.start(0);
      return audioBufferToWav(await offline.startRendering());
    } finally {
      await audioContext.close();
    }
  })();
}

export function applyGain(blob, gain = 1.4125) {
  return withDecodedAudio(blob, ({ offline, source }) => {
    const gainNode = offline.createGain();
    const limiter = offline.createDynamicsCompressor();
    // Apply the requested gain so quiet vocal takes become audibly louder.
    // The limiter protects the rendered WAV instead of silently cancelling the gain.
    gainNode.gain.value = Math.max(0.05, Math.min(4, Number(gain) || 1));
    limiter.threshold.value = -1;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;
    source.connect(gainNode).connect(limiter).connect(offline.destination);
  });
}

export function applyNormalize(blob, targetPeak = 0.95) {
  return withDecodedAudio(blob, ({ offline, source, decoded }) => {
    const gainNode = offline.createGain();
    const peak = getPeak(decoded);
    gainNode.gain.value = peak > 0 ? Math.min(1, targetPeak / peak) : 1;
    source.connect(gainNode).connect(offline.destination);
  });
}

export function applyCompressor(blob, { threshold = -18, ratio = 4, attack = 0.003, release = 0.25 } = {}) {
  return withDecodedAudio(blob, ({ offline, source }) => {
    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = threshold;
    compressor.ratio.value = ratio;
    compressor.attack.value = attack;
    compressor.release.value = release;
    source.connect(compressor).connect(offline.destination);
  });
}

export function applyFade(blob, fadeSeconds = 0.12) {
  return withDecodedAudio(blob, ({ offline, source, decoded }) => {
    const gainNode = offline.createGain();
    const duration = decoded.duration;
    const fade = Math.min(fadeSeconds, Math.max(0.01, duration / 2));
    gainNode.gain.setValueAtTime(0, 0);
    gainNode.gain.linearRampToValueAtTime(1, fade);
    gainNode.gain.setValueAtTime(1, Math.max(fade, duration - fade));
    gainNode.gain.linearRampToValueAtTime(0, duration);
    source.connect(gainNode).connect(offline.destination);
  });
}

/**
 * Vocal enhancement local: removes low rumble, adds controlled presence and compression.
 * This is a deterministic local effect, not AI vocal repair or mastering.
 */
export function applyVocalEnhancement(blob, { presenceDb = 2.5, outputGain = 1.05 } = {}) {
  return withDecodedAudio(blob, ({ offline, source }) => {
    const highPass = offline.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 80;
    highPass.Q.value = 0.707;

    const presence = offline.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 2600;
    presence.Q.value = 0.8;
    presence.gain.value = Math.max(-6, Math.min(6, presenceDb));

    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.008;
    compressor.release.value = 0.18;

    const output = offline.createGain();
    output.gain.value = Math.max(0.5, Math.min(1.2, outputGain));
    source.connect(highPass).connect(presence).connect(compressor).connect(output).connect(offline.destination);
  });
}
