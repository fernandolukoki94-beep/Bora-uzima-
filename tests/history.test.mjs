import test from "node:test";
import assert from "node:assert/strict";
import { canRedo, canUndo, commitHistory, createHistoryState, redoHistory, undoHistory } from "../src/js/studio/history.js";

test("undo e redo percorrem estados sem mutação", () => {
  const initial = { name: "A", tempo: 100 };
  const first = commitHistory(createHistoryState(initial), { ...initial, tempo: 110 });
  const second = commitHistory(first, { ...first.present, tempo: 120 });
  assert.equal(canUndo(second), true);
  const undone = undoHistory(second);
  assert.equal(undone.present.tempo, 110);
  assert.equal(canRedo(undone), true);
  const redone = redoHistory(undone);
  assert.equal(redone.present.tempo, 120);
  assert.equal(second.present.tempo, 120);
});

test("uma nova edição limpa o futuro", () => {
  const initial = createHistoryState({ value: 0 });
  const first = commitHistory(initial, { value: 1 });
  const undone = undoHistory(first);
  const branch = commitHistory(undone, { value: 2 });
  assert.equal(canRedo(branch), false);
  assert.equal(branch.present.value, 2);
});

test("respeita o limite do histórico e estados vazios são no-op", () => {
  let state = createHistoryState({ value: 0 }, 2);
  state = commitHistory(state, { value: 1 });
  state = commitHistory(state, { value: 2 });
  state = commitHistory(state, { value: 3 });
  assert.equal(state.past.length, 2);
  assert.equal(undoHistory(createHistoryState({ value: 0 })).present.value, 0);
  assert.equal(redoHistory(state).present.value, 3);
});
