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
  return withDecodedAudio(blob, ({ offline, source, decoded }) => {
    const gainNode = offline.createGain();
    const { appliedGain } = calculateSafeGain(decoded, gain);
    gainNode.gain.value = appliedGain;
    source.connect(gainNode).connect(offline.destination);
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
