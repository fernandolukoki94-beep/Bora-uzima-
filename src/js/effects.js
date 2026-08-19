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

export function applyMasteringLocal(blob, { preset = "natural", intensity = 55, loudness = 70, dynamics = 50, stereo = 50, eq = 50 } = {}) {
  const profiles = {
    clean: { low: -0.8, presence: 1.2, air: 1.0, threshold: -19, ratio: 2.2, gain: 1.04 },
    loud: { low: 0.8, presence: 1.5, air: 1.2, threshold: -24, ratio: 5.5, gain: 1.18 },
    warm: { low: 2.0, presence: -0.4, air: -1.4, threshold: -20, ratio: 3.2, gain: 1.04 },
    bright: { low: -0.6, presence: 1.8, air: 2.8, threshold: -20, ratio: 3.2, gain: 1.06 },
    punch: { low: 1.4, presence: 1.4, air: 0.6, threshold: -22, ratio: 4.2, gain: 1.1 },
    cinematic: { low: 1.2, presence: 0.5, air: 1.8, threshold: -18, ratio: 2.6, gain: 1.03 },
    spatial: { low: 0.4, presence: 1.0, air: 2.2, threshold: -19, ratio: 2.8, gain: 1.05 },
    natural: { low: 0, presence: 0.4, air: 0.8, threshold: -18, ratio: 2.4, gain: 1.02 },
  };
  const profile = profiles[preset] || profiles.natural;
  const blend = Math.max(0, Math.min(1, Number(intensity) / 100 || 0));
  const loudBlend = Math.max(0, Math.min(1, Number(loudness) / 100 || 0));
  const dynamicBlend = Math.max(0, Math.min(1, Number(dynamics) / 100 || 0));
  const eqBlend = Math.max(0, Math.min(1, Number(eq) / 100 || 0));
  const stereoBlend = Math.max(0, Math.min(1, Number(stereo) / 100 || 0));
  return withDecodedAudio(blob, ({ offline, source }) => {
    const low = offline.createBiquadFilter();
    low.type = "lowshelf";
    low.frequency.value = 140;
    low.gain.value = profile.low * blend * eqBlend;
    const presence = offline.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 2600;
    presence.Q.value = 0.8;
    presence.gain.value = profile.presence * blend * eqBlend;
    const air = offline.createBiquadFilter();
    air.type = "highshelf";
    air.frequency.value = 7000;
    air.gain.value = profile.air * blend * eqBlend;
    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = profile.threshold - (dynamicBlend * 6);
    compressor.knee.value = 12;
    compressor.ratio.value = 1 + ((profile.ratio - 1) * dynamicBlend);
    compressor.attack.value = 0.008;
    compressor.release.value = 0.2;
    const gain = offline.createGain();
    gain.gain.value = 1 + ((profile.gain - 1) * blend) + (0.12 * loudBlend * blend);
    const limiter = offline.createDynamicsCompressor();
    limiter.threshold.value = -1.2;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.12;
    const stereo = offline.createStereoPanner ? offline.createStereoPanner() : null;
    if (stereo) stereo.pan.value = 0;
    source.connect(low).connect(presence).connect(air).connect(compressor).connect(gain);
    if (stereo) gain.connect(stereo).connect(limiter).connect(offline.destination);
    else gain.connect(limiter).connect(offline.destination);
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
export function applyVoiceCleanerLocal(blob, { noiseRemoval = true, dereverb = true, autoEq = true } = {}) {
  return withDecodedAudio(blob, ({ offline, source }) => {
    let current = source;
    if (noiseRemoval) {
      const highPass = offline.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value = 95;
      highPass.Q.value = 0.707;
      const gate = offline.createDynamicsCompressor();
      gate.threshold.value = -48;
      gate.knee.value = 8;
      gate.ratio.value = 8;
      gate.attack.value = 0.004;
      gate.release.value = 0.16;
      current.connect(highPass).connect(gate);
      current = gate;
    }
    if (dereverb) {
      const presenceControl = offline.createBiquadFilter();
      presenceControl.type = "highshelf";
      presenceControl.frequency.value = 5200;
      presenceControl.gain.value = -1.8;
      current.connect(presenceControl);
      current = presenceControl;
    }
    if (autoEq) {
      const body = offline.createBiquadFilter();
      body.type = "peaking";
      body.frequency.value = 2400;
      body.Q.value = 0.85;
      body.gain.value = 2.2;
      current.connect(body);
      current = body;
    }
    const output = offline.createGain();
    output.gain.value = 0.98;
    current.connect(output).connect(offline.destination);
  });
}

export function applyVoiceChangerLocal(blob, { character = "deep" } = {}) {
  const profiles = {
    deep: { detune: -480, filter: "lowpass", frequency: 3200, gain: 1.0 },
    bright: { detune: 420, filter: "highpass", frequency: 150, gain: 0.98 },
    robot: { detune: 0, filter: "bandpass", frequency: 1250, gain: 0.88 },
  };
  const profile = profiles[character] || profiles.deep;
  return withDecodedAudio(blob, ({ offline, source }) => {
    source.detune.value = profile.detune;
    const tone = offline.createBiquadFilter();
    tone.type = profile.filter;
    tone.frequency.value = profile.frequency;
    tone.Q.value = character === "robot" ? 5 : 0.707;
    const output = offline.createGain();
    output.gain.value = profile.gain;
    source.connect(tone).connect(output).connect(offline.destination);
  });
}

/**
 * Harmony vocal local: mantém a voz original e acrescenta duas vozes
 * transpostas de forma determinística. É uma variante reversível, não um
 * modelo generativo nem um substituto de arranjo profissional.
 */
export function normalizeHarmonyIntensity(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function harmonyParameters(intensity = 0.35) {
  const safeIntensity = normalizeHarmonyIntensity(intensity);
  return {
    intensity: safeIntensity,
    voices: 2,
    intervals: [4, 7],
    wetGain: Number((safeIntensity * 0.42).toFixed(3)),
    reversible: true,
  };
}

export function applyHarmonyLocal(blob, { intensity = 0.35 } = {}) {
  const parameters = harmonyParameters(intensity);
  return withDecodedAudio(blob, ({ offline, source, decoded }) => {
    const dry = offline.createGain();
    dry.gain.value = 1;
    source.connect(dry).connect(offline.destination);

    parameters.intervals.forEach((interval, index) => {
      const harmonySource = offline.createBufferSource();
      harmonySource.buffer = decoded;
      harmonySource.detune.value = interval * 100;
      const voiceGain = offline.createGain();
      voiceGain.gain.value = parameters.wetGain;
      const panner = offline.createStereoPanner ? offline.createStereoPanner() : null;
      if (panner) panner.pan.value = index === 0 ? -0.32 : 0.32;
      if (panner) harmonySource.connect(voiceGain).connect(panner).connect(offline.destination);
      else harmonySource.connect(voiceGain).connect(offline.destination);
      harmonySource.start(0);
    });
  });
}

/**
 * Voice Character local: perfis de timbre controláveis e reversíveis.
 * Não é clonagem nem geração vocal; combina filtros, saturação suave,
 * presença e compressão para alterar o carácter percebido da gravação.
 */
export const VOICE_CHARACTER_PROFILES = {
  natural: { presenceDb: 1.2, warmthDb: 0.8, airDb: 1.5, drive: 0.02, outputGain: 1 },
  intimate: { presenceDb: 2.8, warmthDb: 1.8, airDb: 0.4, drive: 0.035, outputGain: 0.98 },
  powerful: { presenceDb: 3.8, warmthDb: 0.2, airDb: 2.4, drive: 0.06, outputGain: 0.94 },
  radio: { presenceDb: 4.5, warmthDb: -0.8, airDb: 3.2, drive: 0.045, outputGain: 0.92 },
};

export function voiceCharacterParameters(character = "natural", intensity = 0.65) {
  const profile = VOICE_CHARACTER_PROFILES[character] || VOICE_CHARACTER_PROFILES.natural;
  const amount = Math.max(0, Math.min(1, Number(intensity) || 0));
  return {
    character: VOICE_CHARACTER_PROFILES[character] ? character : "natural",
    intensity: amount,
    presenceDb: Number((profile.presenceDb * amount).toFixed(3)),
    warmthDb: Number((profile.warmthDb * amount).toFixed(3)),
    airDb: Number((profile.airDb * amount).toFixed(3)),
    drive: Number((profile.drive * amount).toFixed(4)),
    outputGain: Number((1 + ((profile.outputGain - 1) * amount)).toFixed(4)),
    reversible: true,
  };
}

export function applyVoiceCharacterLocal(blob, { character = "natural", intensity = 0.65 } = {}) {
  const parameters = voiceCharacterParameters(character, intensity);
  return withDecodedAudio(blob, ({ offline, source }) => {
    const highPass = offline.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 75;
    highPass.Q.value = 0.707;

    const warmth = offline.createBiquadFilter();
    warmth.type = "peaking";
    warmth.frequency.value = 180;
    warmth.Q.value = 0.75;
    warmth.gain.value = parameters.warmthDb;

    const presence = offline.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 2800;
    presence.Q.value = 0.85;
    presence.gain.value = parameters.presenceDb;

    const air = offline.createBiquadFilter();
    air.type = "highshelf";
    air.frequency.value = 8500;
    air.gain.value = parameters.airDb;

    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 16;
    compressor.ratio.value = 2.4;
    compressor.attack.value = 0.012;
    compressor.release.value = 0.16;

    const output = offline.createGain();
    output.gain.value = parameters.outputGain;
    source.connect(highPass).connect(warmth).connect(presence).connect(air).connect(compressor).connect(output).connect(offline.destination);
  });
}

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


/**
 * Pitch correction assistida localmente. Não é Auto-Tune completo nem análise
 * melódica: aplica uma correcção de cents fornecida pelo Producer Plan, com
 * cadeia vocal suave e sempre em nova versão WAV.
 */
export function normalizePitchCorrectionCents(value) {
  return Math.max(-100, Math.min(100, Number(value) || 0));
}

export function applyPitchCorrectionAssist(blob, { detuneCents = 0, presenceDb = 1.5 } = {}) {
  return withDecodedAudio(blob, ({ offline, source }) => {
    const highPass = offline.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 75;
    highPass.Q.value = 0.707;

    const pitch = offline.createBiquadFilter();
    pitch.type = "peaking";
    pitch.frequency.value = 1800;
    pitch.Q.value = 0.9;
    pitch.gain.value = Math.max(-4, Math.min(4, presenceDb));

    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.16;

    const output = offline.createGain();
    output.gain.value = 1.02;
    source.detune.value = normalizePitchCorrectionCents(detuneCents);
    source.connect(highPass).connect(pitch).connect(compressor).connect(output).connect(offline.destination);
  });
}


/**
 * Auto-Tune local assistido: desloca a afinação da take por uma quantidade
 * determinística de cents proporcional à intensidade. Não faz detecção nota-a-nota;
 * cria uma nova variante reversível e mantém o Original intacto.
 */
export function normalizeAutoTuneIntensity(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function autoTuneParameters(intensity = 0.5) {
  const safeIntensity = normalizeAutoTuneIntensity(intensity);
  return { intensity: safeIntensity, correctionCents: Math.round(safeIntensity * 50), latencySafe: true };
}

export function applyAutoTuneLocal(blob, { intensity = 0.5, presenceDb = 1.5 } = {}) {
  const parameters = autoTuneParameters(intensity);
  return withDecodedAudio(blob, ({ offline, source }) => {
    const highPass = offline.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 75;
    highPass.Q.value = 0.707;

    const presence = offline.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 2200;
    presence.Q.value = 0.9;
    presence.gain.value = Math.max(-4, Math.min(4, Number(presenceDb) || 0));

    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 16;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.16;

    const output = offline.createGain();
    output.gain.value = 1.01;
    source.detune.value = parameters.correctionCents;
    source.connect(highPass).connect(presence).connect(compressor).connect(output).connect(offline.destination);
  });
}


const SCALE_INTERVALS = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function normalizeAutoTuneScale(root = "C", scale = "major") {
  const safeRoot = NOTE_NAMES.includes(root) ? root : "C";
  const safeScale = Object.hasOwn(SCALE_INTERVALS, scale) ? scale : "major";
  return { root: safeRoot, scale: safeScale, intervals: SCALE_INTERVALS[safeScale] };
}

export function detectPitchNotes(samples, sampleRate, { minFrequency = 70, maxFrequency = 900, frameSize = 2048, hopSize = 1024 } = {}) {
  const input = samples instanceof Float32Array ? samples : Float32Array.from(samples || []);
  const result = [];
  if (!sampleRate || input.length < frameSize) return result;
  for (let offset = 0; offset + frameSize <= input.length; offset += hopSize) {
    let energy = 0;
    for (let i = 0; i < frameSize; i += 1) energy += input[offset + i] ** 2;
    const rms = Math.sqrt(energy / frameSize);
    if (rms < 0.008) continue;
    const minLag = Math.max(2, Math.floor(sampleRate / maxFrequency));
    const maxLag = Math.min(frameSize - 2, Math.ceil(sampleRate / minFrequency));
    let bestLag = minLag; let best = -Infinity;
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      let correlation = 0;
      for (let i = 0; i < frameSize - lag; i += 1) correlation += input[offset + i] * input[offset + i + lag];
      if (correlation > best) { best = correlation; bestLag = lag; }
    }
    const frequency = sampleRate / bestLag;
    const midi = 69 + 12 * Math.log2(frequency / 440);
    const note = Math.round(midi);
    const confidence = Math.max(0, Math.min(1, best / (energy || 1)));
    result.push({ time: offset / sampleRate, frequency, midi, note, name: `${NOTE_NAMES[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`, confidence: Number(confidence.toFixed(3)) });
  }
  return result;
}

export function nearestScaleNote(midi, root = "C", scale = "major") {
  const config = normalizeAutoTuneScale(root, scale);
  const rootIndex = NOTE_NAMES.indexOf(config.root);
  const candidates = [];
  for (let note = Math.floor(midi) - 12; note <= Math.ceil(midi) + 12; note += 1) if (config.intervals.includes(((note - rootIndex) % 12 + 12) % 12)) candidates.push(note);
  return candidates.reduce((best, note) => Math.abs(note - midi) < Math.abs(best - midi) ? note : best, candidates[0] ?? Math.round(midi));
}

export function autoTuneCorrectionFromPitch(pitchNotes, root = "C", scale = "major") {
  const voiced = (pitchNotes || []).filter((item) => item && item.confidence >= 0.25 && Number.isFinite(item.midi));
  if (!voiced.length) return { cents: 0, confidence: 0, noteCount: 0 };
  const average = voiced.reduce((sum, item) => sum + item.midi, 0) / voiced.length;
  const target = nearestScaleNote(average, root, scale);
  return { cents: Math.max(-100, Math.min(100, Math.round((target - average) * 100))), confidence: Number((voiced.reduce((sum, item) => sum + item.confidence, 0) / voiced.length).toFixed(3)), noteCount: voiced.length, detectedMidi: Number(average.toFixed(2)), targetMidi: target };
}


export function normalizeSpatialIntensity(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function applyReverbLocal(blob, { intensity = 0.35 } = {}) {
  const safeIntensity = normalizeSpatialIntensity(intensity);
  return withDecodedAudio(blob, ({ offline, source, decoded }) => {
    const dry = offline.createGain();
    const wet = offline.createGain();
    const convolver = offline.createConvolver();
    const impulseLength = Math.max(1, Math.floor(decoded.sampleRate * 1.4));
    const impulse = offline.createBuffer(decoded.numberOfChannels, impulseLength, decoded.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length) ** 2;
    }
    convolver.buffer = impulse;
    dry.gain.value = 1;
    wet.gain.value = safeIntensity * 0.55;
    source.connect(dry).connect(offline.destination);
    source.connect(convolver).connect(wet).connect(offline.destination);
  });
}

export function applyDelayLocal(blob, { intensity = 0.3 } = {}) {
  const safeIntensity = normalizeSpatialIntensity(intensity);
  return withDecodedAudio(blob, ({ offline, source }) => {
    const dry = offline.createGain();
    const wet = offline.createGain();
    const delay = offline.createDelay(1.2);
    const feedback = offline.createGain();
    delay.delayTime.value = 0.18 + safeIntensity * 0.22;
    feedback.gain.value = safeIntensity * 0.42;
    dry.gain.value = 1;
    wet.gain.value = safeIntensity * 0.5;
    source.connect(dry).connect(offline.destination);
    source.connect(delay).connect(wet).connect(offline.destination);
    delay.connect(feedback).connect(delay);
  });
}

export function spatialEffectParameters(type, intensity = 0.3) {
  const safeIntensity = normalizeSpatialIntensity(intensity);
  return { type: type === "delay" ? "delay" : "reverb", intensity: safeIntensity, reversible: true };
}

export function normalizeFxIntensity(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function applySaturationLocal(blob, { intensity = 0.25 } = {}) {
  const safeIntensity = normalizeFxIntensity(intensity);
  return withDecodedAudio(blob, ({ offline, source }) => {
    const shaper = offline.createWaveShaper();
    const amount = 1 + safeIntensity * 18;
    const curve = new Float32Array(2048);
    for (let index = 0; index < curve.length; index += 1) {
      const x = (index / (curve.length - 1)) * 2 - 1;
      curve[index] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
    }
    shaper.curve = curve;
    shaper.oversample = "2x";
    source.connect(shaper).connect(offline.destination);
  });
}

export function applyChorusLocal(blob, { intensity = 0.25 } = {}) {
  const safeIntensity = normalizeFxIntensity(intensity);
  return withDecodedAudio(blob, ({ offline, source }) => {
    const dry = offline.createGain();
    const wet = offline.createGain();
    const delay = offline.createDelay(0.08);
    const lfo = offline.createOscillator();
    const depth = offline.createGain();
    delay.delayTime.value = 0.018;
    depth.gain.value = safeIntensity * 0.006;
    lfo.frequency.value = 0.35 + safeIntensity * 0.7;
    lfo.connect(depth).connect(delay.delayTime);
    dry.gain.value = 1 - safeIntensity * 0.25;
    wet.gain.value = safeIntensity * 0.55;
    source.connect(dry).connect(offline.destination);
    source.connect(delay).connect(wet).connect(offline.destination);
    lfo.start(0);
  });
}

export function applyFlangerLocal(blob, { intensity = 0.2 } = {}) {
  const safeIntensity = normalizeFxIntensity(intensity);
  return withDecodedAudio(blob, ({ offline, source }) => {
    const dry = offline.createGain();
    const wet = offline.createGain();
    const delay = offline.createDelay(0.03);
    const lfo = offline.createOscillator();
    const depth = offline.createGain();
    delay.delayTime.value = 0.004 + safeIntensity * 0.004;
    depth.gain.value = safeIntensity * 0.0025;
    lfo.frequency.value = 0.08 + safeIntensity * 0.4;
    lfo.connect(depth).connect(delay.delayTime);
    dry.gain.value = 1;
    wet.gain.value = safeIntensity * 0.5;
    source.connect(dry).connect(offline.destination);
    source.connect(delay).connect(wet).connect(offline.destination);
    lfo.start(0);
  });
}

export function applyDeEsserLocal(blob, { intensity = 0.35 } = {}) {
  const safeIntensity = normalizeFxIntensity(intensity);
  return withDecodedAudio(blob, ({ offline, source }) => {
    const filter = offline.createBiquadFilter();
    const compressor = offline.createDynamicsCompressor();
    filter.type = "highpass";
    filter.frequency.value = 4500;
    filter.Q.value = 0.7;
    compressor.threshold.value = -24 + safeIntensity * 12;
    compressor.knee.value = 12;
    compressor.ratio.value = 2 + safeIntensity * 8;
    compressor.attack.value = 0.001;
    compressor.release.value = 0.08;
    source.connect(filter).connect(compressor).connect(offline.destination);
  });
}

export function applyGateLocal(blob, { intensity = 0.3 } = {}) {
  const safeIntensity = normalizeFxIntensity(intensity);
  return withDecodedAudio(blob, ({ offline, source }) => {
    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = -50 + safeIntensity * 25;
    compressor.knee.value = 0;
    compressor.ratio.value = 20;
    compressor.attack.value = 0.002;
    compressor.release.value = 0.12;
    source.connect(compressor).connect(offline.destination);
  });
}

export const MODULAR_FX_TYPES = Object.freeze(["compressor", "limiter", "eq", "chorus", "flanger", "saturation", "de-esser", "gate"]);
