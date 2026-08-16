export const TRANSPORT_STATES = Object.freeze({
  STOPPED: "stopped",
  PLAYING: "playing",
  PAUSED: "paused",
});

export function getTimelineDuration(project) {
  return (project?.tracks || []).reduce((projectDuration, track) => (
    track.clips || []
  ).reduce((trackDuration, clip) => Math.max(
    trackDuration,
    Number(clip.start || 0) + Number(clip.duration || 0),
  ), projectDuration), 0);
}

export function clampTransportPosition(position, duration) {
  const safeDuration = Math.max(0, Number(duration) || 0);
  return Math.min(safeDuration, Math.max(0, Number(position) || 0));
}

export function createTransportState(duration = 0) {
  const safeDuration = Math.max(0, Number(duration) || 0);
  return {
    status: TRANSPORT_STATES.STOPPED,
    position: 0,
    duration: safeDuration,
  };
}

export function setTransportPosition(state, position) {
  return {
    ...state,
    position: clampTransportPosition(position, state.duration),
  };
}

export function startTransport(state) {
  if (state.position >= state.duration && state.duration > 0) {
    return { ...state, status: TRANSPORT_STATES.PLAYING, position: 0 };
  }
  return { ...state, status: TRANSPORT_STATES.PLAYING };
}

export function pauseTransport(state) {
  return { ...state, status: TRANSPORT_STATES.PAUSED };
}

export function stopTransport(state) {
  return { ...state, status: TRANSPORT_STATES.STOPPED, position: 0 };
}

export function advanceTransport(state, elapsedSeconds) {
  const nextPosition = clampTransportPosition(
    state.position + Math.max(0, Number(elapsedSeconds) || 0),
    state.duration,
  );
  return {
    ...state,
    position: nextPosition,
    status: nextPosition >= state.duration && state.duration > 0
      ? TRANSPORT_STATES.STOPPED
      : state.status,
  };
}
