export function runMobilePreflight(env = globalThis) {
  const checks = [
    { id: "mediaRecorder", label: "MediaRecorder", supported: typeof env.MediaRecorder === "function" },
    { id: "audioContext", label: "AudioContext", supported: typeof (env.AudioContext || env.webkitAudioContext) === "function" },
    { id: "offlineAudioContext", label: "OfflineAudioContext", supported: typeof (env.OfflineAudioContext || env.webkitOfflineAudioContext) === "function" },
    { id: "indexedDb", label: "IndexedDB", supported: Boolean(env.indexedDB) },
    { id: "mediaDevices", label: "Microfone via mediaDevices", supported: Boolean(env.navigator?.mediaDevices?.getUserMedia) },
    { id: "blobUrl", label: "Blob URLs", supported: typeof env.URL?.createObjectURL === "function" },
  ];
  return {
    checks,
    supported: checks.every((check) => check.supported),
    unsupported: checks.filter((check) => !check.supported).map((check) => check.id),
    generatedAt: new Date().toISOString(),
  };
}

export function formatPreflightSummary(result) {
  const passed = result.checks.filter((check) => check.supported).length;
  return `${passed}/${result.checks.length} APIs móveis disponíveis${result.supported ? "" : `; pendentes: ${result.unsupported.join(", ")}`}`;
}
