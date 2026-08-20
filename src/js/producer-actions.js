const ACTION_INSTRUMENTS = Object.freeze({
  "generate-drums": ["drums"],
  "create-bassline": ["bass"],
  "improve-arrangement": ["drums", "bass", "piano", "guitar", "strings", "synth"],
});

export const PRODUCER_ACTIONS = Object.freeze([
  "analyze-vocal",
  "generate-drums",
  "create-bassline",
  "improve-arrangement",
  "mix-vocals",
  "master-track",
]);

export function producerActionLabel(action) {
  return {
    "analyze-vocal": "Analyze vocal",
    "generate-drums": "Generate drums",
    "create-bassline": "Create bassline",
    "improve-arrangement": "Improve arrangement",
    "mix-vocals": "Mix vocals",
    "master-track": "Master track",
  }[action] || action;
}

export function buildProducerActionPlan(basePlan, action) {
  if (!basePlan || !ACTION_INSTRUMENTS[action]) throw new Error("Acção instrumental sem Producer Plan válido.");
  return {
    ...basePlan,
    instruments: [...ACTION_INSTRUMENTS[action]],
    execution: { ...(basePlan.execution || {}), action, localOnly: true, originalPreserved: true },
  };
}

export function producerActionRequiresAudio(action) {
  return ["analyze-vocal", "mix-vocals", "master-track"].includes(action);
}

export function producerActionRequiresMixed(action) {
  return action === "master-track";
}
