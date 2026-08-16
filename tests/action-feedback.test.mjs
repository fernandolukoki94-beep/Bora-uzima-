import assert from "node:assert/strict";
import test from "node:test";
import { ACTION_FEEDBACK_STATES, actionFeedbackLabel, transitionActionFeedback } from "../src/js/action-feedback.js";

test("A/B percorre idle, loading, success e reset", () => {
  let state = ACTION_FEEDBACK_STATES.IDLE;
  state = transitionActionFeedback(state, "start");
  assert.equal(state, ACTION_FEEDBACK_STATES.LOADING);
  assert.equal(actionFeedbackLabel("ab", state), "A preparar pré-escuta…");
  state = transitionActionFeedback(state, "success");
  assert.equal(state, ACTION_FEEDBACK_STATES.SUCCESS);
  assert.equal(actionFeedbackLabel("ab", state), "Pré-escuta activa");
  assert.equal(transitionActionFeedback(state, "reset"), ACTION_FEEDBACK_STATES.IDLE);
});

test("A/B comunica erro sem ficar preso em loading", () => {
  const state = transitionActionFeedback(ACTION_FEEDBACK_STATES.LOADING, "error");
  assert.equal(state, ACTION_FEEDBACK_STATES.ERROR);
  assert.equal(actionFeedbackLabel("ab", state), "Pré-escuta indisponível");
});

test("exportação comunica preparação, conclusão e falha", () => {
  let state = transitionActionFeedback(ACTION_FEEDBACK_STATES.IDLE, "start");
  assert.equal(actionFeedbackLabel("export", state), "A preparar WAV…");
  state = transitionActionFeedback(state, "success");
  assert.equal(actionFeedbackLabel("export", state), "Exportação concluída");
  state = transitionActionFeedback(state, "start");
  state = transitionActionFeedback(state, "error");
  assert.equal(state, ACTION_FEEDBACK_STATES.ERROR);
  assert.equal(actionFeedbackLabel("export", state), "Exportação falhou");
});
