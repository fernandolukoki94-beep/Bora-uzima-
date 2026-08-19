const MIN_DB = -60;
const MAX_DB = 0;

export function linearToMeterDb(value) {
  const safe = Number(value);
  if (!Number.isFinite(safe) || safe <= 0.001) return MIN_DB;
  return Math.max(MIN_DB, Math.min(MAX_DB, 20 * Math.log10(safe)));
}

export function meterDbToPercent(db) {
  const safe = Number.isFinite(Number(db)) ? Number(db) : MIN_DB;
  return Math.max(0, Math.min(100, ((safe - MIN_DB) / (MAX_DB - MIN_DB)) * 100));
}

export function estimateTrackMeter(track = {}, options = {}) {
  const hasSignal = Array.isArray(track.clips) && track.clips.length > 0;
  const volume = Math.max(0, Number(track.volume ?? 1));
  const clipGain = Array.isArray(track.clips)
    ? track.clips.reduce((max, clip) => Math.max(max, Number(clip.gain ?? 1)), 0)
    : 0;
  const sourceLevel = hasSignal ? Math.max(0.08, Math.min(1, 0.22 + clipGain * 0.18)) : 0;
  const peakLinear = hasSignal ? sourceLevel * volume : 0;
  const peakDb = linearToMeterDb(peakLinear);
  const rmsDb = linearToMeterDb(peakLinear * 0.68);
  const clipped = peakLinear >= 1 || peakDb >= -0.1;
  const soloActive = Boolean(options.soloActive);
  const audible = !track.muted && (!soloActive || Boolean(track.solo));
  return {
    peakDb: audible ? peakDb : MIN_DB,
    rmsDb: audible ? rmsDb : MIN_DB,
    peakPercent: meterDbToPercent(audible ? peakDb : MIN_DB),
    rmsPercent: meterDbToPercent(audible ? rmsDb : MIN_DB),
    clipped: audible && clipped,
    state: !hasSignal ? "idle" : !audible ? "muted" : clipped ? "clip" : "signal",
    source: "local-estimate",
  };
}

export function estimateMasterMeter(project = {}) {
  const tracks = Array.isArray(project.tracks) ? project.tracks : [];
  const soloActive = tracks.some((track) => track.solo);
  const meters = tracks.map((track) => estimateTrackMeter(track, { soloActive }));
  const sumLinear = meters.reduce((sum, meter) => sum + (meter.peakDb <= MIN_DB ? 0 : 10 ** (meter.peakDb / 20)), 0);
  const masterGain = Math.max(0, Number(project.master?.gain ?? 1));
  const limiter = Math.max(0.1, Math.min(1, Number(project.master?.limiter ?? 1)));
  const peakLinear = Math.min(1.2, sumLinear * masterGain * limiter);
  const peakDb = linearToMeterDb(peakLinear);
  return {
    peakDb,
    peakPercent: meterDbToPercent(peakDb),
    clipped: peakLinear >= 1 || peakDb >= -0.1,
    state: peakLinear <= 0.001 ? "idle" : peakLinear >= 1 ? "clip" : "signal",
    source: "local-estimate",
  };
}

export const MIXER_METER_LIMITS = Object.freeze({ minDb: MIN_DB, maxDb: MAX_DB });
