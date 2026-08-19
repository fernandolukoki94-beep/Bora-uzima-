import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTrackAutomation,
  upsertAutomationPoint,
  removeAutomationPoint,
  evaluateAutomationLane,
  evaluateTrackAutomation,
} from "../src/js/studio/automation.js";

test("normaliza lanes e ordena pontos", () => {
  const automation = normalizeTrackAutomation({ lanes: [{ target: "volume", points: [{ time: 4, value: 0.5 }, { time: 1, value: 1.5 }] }] });
  assert.deepEqual(automation.lanes[0].points, [{ time: 1, value: 1.5 }, { time: 4, value: 0.5 }]);
});

test("insere, substitui e remove ponto sem duplicar tempo", () => {
  let automation = upsertAutomationPoint({}, "pan", { time: 2, value: -1 });
  automation = upsertAutomationPoint(automation, "pan", { time: 2, value: 1 });
  assert.equal(automation.lanes[0].points.length, 1);
  assert.equal(automation.lanes[0].points[0].value, 1);
  automation = removeAutomationPoint(automation, "pan", 2);
  assert.equal(automation.lanes.length, 0);
});

test("interpola volume entre pontos e respeita limites temporais", () => {
  const lane = { target: "volume", points: [{ time: 0, value: 0 }, { time: 4, value: 2 }] };
  assert.equal(evaluateAutomationLane(lane, -1, 1), 0);
  assert.equal(evaluateAutomationLane(lane, 2, 1), 1);
  assert.equal(evaluateAutomationLane(lane, 8, 1), 2);
});

test("não aplica lanes quando a automação está globalmente desactivada", () => {
  const values = evaluateTrackAutomation({ volume: 1, pan: 0, automation: { enabled: false, lanes: [{ target: "volume", points: [{ time: 0, value: 0 }] }] } }, 0);
  assert.equal(values.volume, 1);
  assert.equal(values.pan, 0);
});

test("avalia volume, pan e FX de uma track", () => {
  const values = evaluateTrackAutomation({ volume: 1, pan: 0, automation: { lanes: [
    { target: "volume", points: [{ time: 0, value: 1 }, { time: 2, value: 0.5 }] },
    { target: "pan", points: [{ time: 0, value: -1 }, { time: 2, value: 1 }] },
    { target: "fx", fxIndex: 1, points: [{ time: 0, value: 0.2 }, { time: 2, value: 0.8 }] },
  ] } }, 1);
  assert.equal(values.volume, 0.75);
  assert.equal(values.pan, 0);
  assert.equal(values.fx[1], 0.5);
});
