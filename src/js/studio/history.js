const DEFAULT_HISTORY_LIMIT = 50;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createHistoryState(present, limit = DEFAULT_HISTORY_LIMIT) {
  return { present: clone(present), past: [], future: [], limit };
}

export function commitHistory(state, nextPresent) {
  const past = [...state.past, clone(state.present)];
  return {
    present: clone(nextPresent),
    past: past.slice(-state.limit),
    future: [],
    limit: state.limit,
  };
}

export function undoHistory(state) {
  if (!state.past.length) return state;
  const past = [...state.past];
  const present = past.pop();
  return {
    present: clone(present),
    past,
    future: [clone(state.present), ...state.future].slice(0, state.limit),
    limit: state.limit,
  };
}

export function redoHistory(state) {
  if (!state.future.length) return state;
  const [present, ...future] = state.future;
  return {
    present: clone(present),
    past: [...state.past, clone(state.present)].slice(-state.limit),
    future,
    limit: state.limit,
  };
}

export function canUndo(state) {
  return state.past.length > 0;
}

export function canRedo(state) {
  return state.future.length > 0;
}

export const HISTORY_LIMIT = DEFAULT_HISTORY_LIMIT;
