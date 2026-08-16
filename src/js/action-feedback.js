export const ACTION_FEEDBACK_STATES = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
});

export function transitionActionFeedback(currentState = ACTION_FEEDBACK_STATES.IDLE, event) {
  if (event === "start") return ACTION_FEEDBACK_STATES.LOADING;
  if (event === "success") return ACTION_FEEDBACK_STATES.SUCCESS;
  if (event === "error") return ACTION_FEEDBACK_STATES.ERROR;
  if (event === "reset") return ACTION_FEEDBACK_STATES.IDLE;
  return currentState;
}

export function actionFeedbackLabel(action, state) {
  const labels = {
    ab: {
      idle: "Pronto para ouvir",
      loading: "A preparar pré-escuta…",
      success: "Pré-escuta activa",
      error: "Pré-escuta indisponível",
    },
    export: {
      idle: "Pronto para exportar",
      loading: "A preparar WAV…",
      success: "Exportação concluída",
      error: "Exportação falhou",
    },
  };
  return labels[action]?.[state] || "";
}
