function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function equalLengthBuffers(buffers) {
  const length = buffers.reduce((max, buffer) => Math.max(max, buffer?.length || 0), 0);
  return { length, buffers: buffers.map((buffer) => buffer || new Float32Array(length)) };
}

export function panGains(pan = 0) {
  const normalized = clamp(Number(pan) || 0, -1, 1);
  const angle = (normalized + 1) * Math.PI / 4;
  return { left: Math.cos(angle), right: Math.sin(angle) };
}

export function mixTracks(tracks = [], { masterGain = 1, master = null, headroom = 0.98 } = {}) {
  const safeMaster = master || { gain: masterGain, pan: 0, limiter: 1, bypass: false };
  const active = tracks.filter((track) => !track?.muted && track?.buffer instanceof Float32Array);
  const soloTracks = active.filter((track) => track?.solo);
  const selected = soloTracks.length ? soloTracks : active;
  const { length, buffers } = equalLengthBuffers(selected.map((track) => track.buffer));
  const left = new Float32Array(length);
  const right = new Float32Array(length);

  selected.forEach((track, index) => {
    const gains = panGains(track.pan);
    const gain = clamp(Number(track.gain ?? track.volume ?? 1) || 0, 0, 4);
    const buffer = buffers[index];
    for (let sample = 0; sample < length; sample += 1) {
      const value = buffer[sample] * gain * (safeMaster.bypass ? 1 : Number(safeMaster.gain ?? masterGain ?? 0));
      left[sample] += value * gains.left;
      right[sample] += value * gains.right;
    }
  });

  if (!safeMaster.bypass) {
    const masterGains = panGains(clamp(Number(safeMaster.pan) || 0, -1, 1));
    for (let sample = 0; sample < length; sample += 1) {
      const mid = (left[sample] + right[sample]) * 0.5;
      const side = (left[sample] - right[sample]) * 0.5;
      left[sample] = (mid + side) * masterGains.left;
      right[sample] = (mid - side) * masterGains.right;
    }
  }
  let peak = 0;
  for (let sample = 0; sample < length; sample += 1) {
    peak = Math.max(peak, Math.abs(left[sample]), Math.abs(right[sample]));
  }
  const safeHeadroom = clamp(Number(headroom) || 0.98, 0.05, 1);
  const limiter = safeMaster.bypass ? 1 : clamp(Number(safeMaster.limiter) || 1, 0.1, 1);
  const target = Math.min(safeHeadroom, limiter);
  const scale = peak > target ? target / peak : 1;
  for (let sample = 0; sample < length; sample += 1) {
    left[sample] *= scale;
    right[sample] *= scale;
  }

  return {
    left,
    right,
    peakBeforeHeadroom: peak,
    peakAfterHeadroom: peak * scale,
    scale,
    trackCount: selected.length,
  };
}

export function mixMonoToStereo(buffer, options = {}) {
  return mixTracks([{ buffer, gain: 1, pan: 0 }], options);
}
