const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function asSamples(input) {
  if (!input) return new Float32Array();
  if (input instanceof Float32Array) return input;
  return Float32Array.from(input);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function dbFromLinear(value) {
  return 20 * Math.log10(Math.max(1e-8, value));
}

function frameRms(samples, start, size) {
  let sum = 0;
  const end = Math.min(samples.length, start + size);
  for (let index = start; index < end; index += 1) sum += samples[index] ** 2;
  return Math.sqrt(sum / Math.max(1, end - start));
}

function estimateBpm(samples, sampleRate) {
  const frameSize = 1024;
  const hop = 512;
  if (samples.length < sampleRate * 0.5) return { bpm: 100, confidence: 0 };
  const energies = [];
  for (let start = 0; start < samples.length - frameSize; start += hop) energies.push(frameRms(samples, start, frameSize));
  const onsets = energies.map((energy, index) => Math.max(0, energy - (energies[index - 1] || energy)));
  let best = { bpm: 100, score: 0 };
  let total = 0;
  for (let bpm = 60; bpm <= 180; bpm += 1) {
    const lag = Math.max(1, Math.round((60 * sampleRate) / (bpm * hop)));
    let score = 0;
    for (let index = lag; index < onsets.length; index += 1) score += onsets[index] * onsets[index - lag];
    total += score;
    if (score > best.score) best = { bpm, score };
  }
  return { bpm: best.bpm, confidence: total > 0 ? clamp(best.score / total * 120, 0, 1) : 0 };
}

function estimatePitch(samples, sampleRate) {
  const windowSize = Math.min(samples.length, 8192);
  const minLag = Math.max(2, Math.floor(sampleRate / 1000));
  const maxLag = Math.min(Math.floor(sampleRate / 70), windowSize - 2);
  if (maxLag <= minLag) return { key: "C", frequency: 0, confidence: 0 };
  let best = { lag: 0, correlation: 0 };
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let dot = 0;
    let energyA = 0;
    let energyB = 0;
    for (let index = 0; index < windowSize - lag; index += 1) {
      const a = samples[index];
      const b = samples[index + lag];
      dot += a * b;
      energyA += a * a;
      energyB += b * b;
    }
    const correlation = dot / Math.sqrt(Math.max(1e-12, energyA * energyB));
    if (correlation > best.correlation) best = { lag, correlation };
  }
  if (!best.lag || best.correlation < 0.1) return { key: "C", frequency: 0, confidence: 0 };
  const autocorrelationFrequency = sampleRate / best.lag;
  let crossings = 0;
  for (let index = 1; index < windowSize; index += 1) {
    if ((samples[index - 1] < 0 && samples[index] >= 0) || (samples[index - 1] >= 0 && samples[index] < 0)) crossings += 1;
  }
  const zeroCrossingFrequency = crossings / 2 / (windowSize / sampleRate);
  const frequency = zeroCrossingFrequency >= 70 && zeroCrossingFrequency <= 1000
    ? zeroCrossingFrequency
    : autocorrelationFrequency;
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  return { key: NOTE_NAMES[((midi % 12) + 12) % 12], frequency, confidence: clamp(best.correlation, 0, 1) };
}

export function analyzeAudioSamples(input, sampleRate = 44100) {
  const samples = asSamples(input);
  if (!samples.length || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return { version: "local-analysis-v1", hasAudio: false, duration: 0, bpm: 100, key: "C", confidence: 0, vocal: { rmsDb: -60, peakDb: -60, zeroCrossingRate: 0, dynamicRangeDb: 0 } };
  }
  let sum = 0;
  let peak = 0;
  let crossings = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const value = samples[index];
    sum += value * value;
    peak = Math.max(peak, Math.abs(value));
    if (index > 0 && ((samples[index - 1] < 0 && value >= 0) || (samples[index - 1] >= 0 && value < 0))) crossings += 1;
  }
  const rms = Math.sqrt(sum / samples.length);
  const rmsDb = dbFromLinear(rms);
  const peakDb = dbFromLinear(peak);
  const bpmResult = estimateBpm(samples, sampleRate);
  const pitchResult = estimatePitch(samples, sampleRate);
  const zeroCrossingRate = crossings / samples.length;
  const dynamicRangeDb = Math.max(0, peakDb - rmsDb);
  const confidence = clamp((bpmResult.confidence + pitchResult.confidence) / 2, 0, 1);
  return {
    version: "local-analysis-v1",
    hasAudio: rms > 0.0005,
    duration: samples.length / sampleRate,
    bpm: bpmResult.bpm,
    bpmConfidence: bpmResult.confidence,
    key: pitchResult.key,
    keyFrequency: pitchResult.frequency,
    keyConfidence: pitchResult.confidence,
    confidence,
    vocal: { rmsDb, peakDb, zeroCrossingRate, dynamicRangeDb, presence: rmsDb > -42 && zeroCrossingRate > 0.01 },
  };
}

export async function analyzeAudioDataUrl(dataUrl) {
  if (!dataUrl || typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  const context = new AudioContextClass();
  try {
    const response = await fetch(dataUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    return analyzeAudioSamples(audioBuffer.getChannelData(0), audioBuffer.sampleRate);
  } finally {
    await context.close().catch(() => {});
  }
}

export const ANALYSIS_LIMITS = Object.freeze({ minBpm: 60, maxBpm: 180, minPitchHz: 70, maxPitchHz: 1000, localOnly: true });
