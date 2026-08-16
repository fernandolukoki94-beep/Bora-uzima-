import test from "node:test";
import assert from "node:assert/strict";
import {
  TRANSPORT_STATES,
  advanceTransport,
  clampTransportPosition,
  createTransportState,
  getTimelineDuration,
  pauseTransport,
  setTransportPosition,
  startTransport,
  stopTransport,
} from "../src/js/studio/transport.js";

test("calculates timeline duration from clip ends", () => {
  const project = { tracks: [
    { clips: [{ start: 0, duration: 4 }, { start: 8, duration: 3 }] },
    { clips: [{ start: 2, duration: 12 }] },
  ] };
  assert.equal(getTimelineDuration(project), 14);
});

test("clamps positions to the transport duration", () => {
  assert.equal(clampTransportPosition(-2, 10), 0);
  assert.equal(clampTransportPosition(20, 10), 10);
  assert.equal(clampTransportPosition("3.5", 10), 3.5);
});

test("supports start, pause and stop without mutating state", () => {
  const initial = createTransportState(10);
  const playing = startTransport(setTransportPosition(initial, 4));
  const paused = pauseTransport(playing);
  const stopped = stopTransport(paused);
  assert.equal(initial.status, TRANSPORT_STATES.STOPPED);
  assert.equal(playing.status, TRANSPORT_STATES.PLAYING);
  assert.equal(playing.position, 4);
  assert.equal(paused.status, TRANSPORT_STATES.PAUSED);
  assert.equal(stopped.status, TRANSPORT_STATES.STOPPED);
  assert.equal(stopped.position, 0);
});

test("advances to the end and stops automatically", () => {
  const state = startTransport(createTransportState(5));
  const next = advanceTransport(state, 7);
  assert.equal(next.position, 5);
  assert.equal(next.status, TRANSPORT_STATES.STOPPED);
});
