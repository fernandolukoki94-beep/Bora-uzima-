import test from "node:test";
import assert from "node:assert/strict";
import { estimateMasterMeter, estimateTrackMeter, linearToMeterDb, meterDbToPercent } from "../src/js/studio/mixer-meters.js";

test("mixer meters: maps silence to the floor and zero percent", () => {
  assert.equal(linearToMeterDb(0), -60);
  assert.equal(meterDbToPercent(-60), 0);
  assert.equal(estimateTrackMeter({ id: "empty", clips: [], volume: 1 }).state, "idle");
});

test("mixer meters: reports a local estimate for a track with clips", () => {
  const meter = estimateTrackMeter({ id: "vocal", clips: [{ gain: 1 }], volume: 1 });
  assert.equal(meter.state, "signal");
  assert.equal(meter.source, "local-estimate");
  assert.ok(meter.peakPercent > 0);
  assert.ok(meter.peakDb < 0);
});

test("mixer meters: honours mute and solo decisions", () => {
  assert.equal(estimateTrackMeter({ clips: [{ gain: 1 }], volume: 1, muted: true }).state, "muted");
  assert.equal(estimateTrackMeter({ clips: [{ gain: 1 }], volume: 1 }, { soloActive: true }).state, "muted");
  assert.equal(estimateTrackMeter({ clips: [{ gain: 1 }], volume: 1, solo: true }, { soloActive: true }).state, "signal");
});

test("mixer meters: marks channel and master clipping", () => {
  const channel = estimateTrackMeter({ clips: [{ gain: 8 }], volume: 1 });
  assert.equal(channel.clipped, true);
  const master = estimateMasterMeter({ tracks: [{ clips: [{ gain: 8 }], volume: 1 }], master: { gain: 4, limiter: 1 } });
  assert.equal(master.clipped, true);
  assert.equal(master.state, "clip");
});
