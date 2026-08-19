const FILTER_TYPES = ["lowpass", "highpass", "bandpass"];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createSamplerState(input = {}) {
  const duration = clamp(Number(input.duration) || 1, 0.01, 600);
  const start = clamp(Number(input.start) || 0, 0, duration);
  const end = clamp(Number(input.end) || duration, start, duration);
  return {
    sourceId: input.sourceId || null,
    duration,
    start,
    end,
    pitch: clamp(Number(input.pitch) || 0, -24, 24),
    reverse: Boolean(input.reverse),
    loop: Boolean(input.loop),
    loopStart: clamp(Number(input.loopStart) || start, start, end),
    loopEnd: clamp(Number(input.loopEnd) || end, start, end),
    attack: clamp(Number(input.attack) || 0.01, 0, 10),
    decay: clamp(Number(input.decay) || 0.1, 0, 10),
    sustain: clamp(Number(input.sustain) || 0.8, 0, 1),
    release: clamp(Number(input.release) || 0.2, 0, 10),
    filterType: FILTER_TYPES.includes(input.filterType) ? input.filterType : "lowpass",
    filterFrequency: clamp(Number(input.filterFrequency) || 12000, 20, 20000),
    filterQ: clamp(Number(input.filterQ) || 0.7, 0.1, 20),
  };
}

export function samplerRegion(state) {
  const current = createSamplerState(state);
  return { start: current.start, end: current.end, duration: Math.max(0.01, current.end - current.start) };
}

export function samplerPlaybackPlan(state, note = {}) {
  const current = createSamplerState(state);
  const velocity = clamp(Number(note.velocity) || 1, 0, 1);
  const transpose = clamp(Number(note.pitch) || 0, -48, 48);
  return {
    ...samplerRegion(current),
    playbackRate: 2 ** ((current.pitch + transpose) / 12),
    reverse: current.reverse,
    loop: current.loop,
    loopStart: current.loopStart,
    loopEnd: current.loopEnd,
    envelope: { attack: current.attack, decay: current.decay, sustain: current.sustain * velocity, release: current.release },
    filter: { type: current.filterType, frequency: current.filterFrequency, Q: current.filterQ },
  };
}

export function updateSamplerState(state, patch = {}) {
  return createSamplerState({ ...state, ...patch });
}

export async function playSamplerVoice(context, audioBuffer, state, note = {}) {
  if (!context || !audioBuffer) throw new Error("Sampler requer AudioContext e AudioBuffer.");
  if (context.state === "suspended") await context.resume();
  const current = createSamplerState({ ...state, duration: audioBuffer.duration });
  const plan = samplerPlaybackPlan(current, note);
  const sampleRate = audioBuffer.sampleRate;
  const frameStart = Math.floor(plan.start * sampleRate);
  const frameEnd = Math.min(audioBuffer.length, Math.ceil(plan.end * sampleRate));
  const sourceBuffer = context.createBuffer(audioBuffer.numberOfChannels, Math.max(1, frameEnd - frameStart), sampleRate);
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel).slice(frameStart, frameEnd);
    if (plan.reverse) data.reverse();
    sourceBuffer.copyToChannel(data, channel);
  }
  const source = context.createBufferSource();
  source.buffer = sourceBuffer;
  source.playbackRate.value = plan.playbackRate;
  source.loop = plan.loop;
  source.loopStart = Math.max(0, plan.loopStart - plan.start);
  source.loopEnd = Math.max(source.loopStart + 0.01, plan.loopEnd - plan.start);
  const filter = context.createBiquadFilter();
  filter.type = plan.filter.type;
  filter.frequency.value = plan.filter.frequency;
  filter.Q.value = plan.filter.Q;
  const gain = context.createGain();
  const startAt = context.currentTime + 0.01;
  const duration = Math.max(0.05, plan.duration / plan.playbackRate);
  const attackEnd = startAt + Math.min(duration, plan.envelope.attack);
  const decayEnd = Math.min(startAt + duration, attackEnd + plan.envelope.decay);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(1, attackEnd);
  gain.gain.linearRampToValueAtTime(plan.envelope.sustain, decayEnd);
  gain.gain.setValueAtTime(plan.envelope.sustain, Math.max(decayEnd, startAt + duration - plan.envelope.release));
  gain.gain.linearRampToValueAtTime(0.0001, startAt + duration + plan.envelope.release);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(startAt);
  source.stop(startAt + duration + plan.envelope.release + 0.03);
  return { source, duration: duration + plan.envelope.release, plan };
}

export async function renderSamplerVoice(audioBuffer, state, note = {}) {
  if (!audioBuffer || typeof OfflineAudioContext === "undefined") throw new Error("Sampler requer OfflineAudioContext.");
  const current = createSamplerState({ ...state, duration: audioBuffer.duration });
  const plan = samplerPlaybackPlan(current, note);
  const sampleRate = audioBuffer.sampleRate;
  const frameStart = Math.floor(plan.start * sampleRate);
  const frameEnd = Math.min(audioBuffer.length, Math.ceil(plan.end * sampleRate));
  const sourceBuffer = new AudioBuffer({ length: Math.max(1, frameEnd - frameStart), numberOfChannels: audioBuffer.numberOfChannels, sampleRate });
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel).slice(frameStart, frameEnd);
    if (plan.reverse) data.reverse();
    sourceBuffer.copyToChannel(data, channel);
  }
  const outputSeconds = Math.max(0.05, plan.duration / plan.playbackRate + plan.envelope.release);
  const context = new OfflineAudioContext(sourceBuffer.numberOfChannels, Math.ceil(outputSeconds * sampleRate), sampleRate);
  const source = context.createBufferSource();
  source.buffer = sourceBuffer;
  source.playbackRate.value = plan.playbackRate;
  source.loop = plan.loop;
  source.loopStart = Math.max(0, plan.loopStart - plan.start);
  source.loopEnd = Math.max(source.loopStart + 0.01, plan.loopEnd - plan.start);
  const filter = context.createBiquadFilter();
  filter.type = plan.filter.type;
  filter.frequency.value = plan.filter.frequency;
  filter.Q.value = plan.filter.Q;
  const gain = context.createGain();
  const now = 0;
  const attackEnd = Math.min(outputSeconds, plan.envelope.attack);
  const decayEnd = Math.min(outputSeconds, attackEnd + plan.envelope.decay);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(1, attackEnd);
  gain.gain.linearRampToValueAtTime(plan.envelope.sustain, decayEnd);
  gain.gain.setValueAtTime(plan.envelope.sustain, Math.max(decayEnd, outputSeconds - plan.envelope.release));
  gain.gain.linearRampToValueAtTime(0, outputSeconds);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(0);
  source.stop(outputSeconds);
  return context.startRendering();
}

export { FILTER_TYPES };
