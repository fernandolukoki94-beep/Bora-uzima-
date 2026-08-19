function getSupportedAudioMimeType() {
  const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  return candidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";
}

export function createRecorderController({ onStateChange, onComplete, onMetrics, getInputDeviceId, showToast }) {
  let recorder = null;
  let stream = null;
  let chunks = [];
  let startedAt = 0;
  let timerId = null;
  let recordingMimeType = "";
  let audioContext = null;
  let analyser = null;
  let meterFrame = null;
  let monitorEnabled = false;
  let monitorVolume = 0.35;
  let monitorGain = null;

  function updateTimer() {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    onStateChange({
      active: true,
      seconds,
      label: `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
    });
  }

  function stopMetering() {
    if (meterFrame) window.cancelAnimationFrame(meterFrame);
    meterFrame = null;
    analyser?.disconnect();
    monitorGain?.disconnect();
    analyser = null;
    monitorGain = null;
    audioContext?.close?.().catch(() => {});
    audioContext = null;
    onMetrics?.({ inputDb: -Infinity, peakDb: -Infinity, latencyMs: null, active: false });
  }

  function startMetering() {
    if (!stream || !window.AudioContext) return;
    try {
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      if (monitorEnabled) {
        monitorGain = audioContext.createGain();
        monitorGain.gain.value = monitorVolume;
        source.connect(monitorGain);
        monitorGain.connect(audioContext.destination);
      }
      const samples = new Float32Array(analyser.fftSize);
      const tick = () => {
        if (!analyser) return;
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        let peak = 0;
        for (const sample of samples) { sum += sample * sample; peak = Math.max(peak, Math.abs(sample)); }
        const rms = Math.sqrt(sum / samples.length);
        const toDb = (value) => value > 0.00001 ? 20 * Math.log10(value) : -Infinity;
        const latencyMs = ((audioContext.baseLatency || 0) + (audioContext.outputLatency || 0)) * 1000;
        onMetrics?.({ inputDb: toDb(rms), peakDb: toDb(peak), latencyMs, active: true });
        meterFrame = window.requestAnimationFrame(tick);
      };
      tick();
    } catch { onMetrics?.({ inputDb: -Infinity, peakDb: -Infinity, latencyMs: null, active: true }); }
  }

  async function start() {
    if (!window.isSecureContext && location.hostname !== "localhost") {
      showToast("A gravação exige HTTPS. Abre o endereço Vercel seguro e tenta novamente.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      showToast("Este navegador não suporta gravação local. Actualiza o Safari ou Chrome.");
      return;
    }

    try {
      const selectedDeviceId = getInputDeviceId?.();
      const audioConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
      if (selectedDeviceId && selectedDeviceId !== "default") audioConstraints.deviceId = { exact: selectedDeviceId };
      stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      recordingMimeType = getSupportedAudioMimeType();
      recorder = recordingMimeType ? new MediaRecorder(stream, { mimeType: recordingMimeType }) : new MediaRecorder(stream);
      recordingMimeType = recorder.mimeType || recordingMimeType || "audio/webm";
      chunks = [];
      startedAt = Date.now();
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size) chunks.push(event.data);
      });
      recorder.addEventListener("error", () => showToast("O navegador interrompeu a gravação. Tenta novamente sem sair desta página."));
      recorder.addEventListener("stop", finish, { once: true });
      recorder.start(1000);
      startMetering();
      timerId = window.setInterval(updateTimer, 250);
      onStateChange({ active: true, seconds: 0, label: "00:00" });
    } catch (error) {
      showToast(error?.name === "NotAllowedError" || error?.name === "SecurityError"
        ? "O microfone foi bloqueado. Em Definições, permite o microfone para este site."
        : error?.name === "NotFoundError"
          ? "Não foi encontrado nenhum microfone disponível."
          : "Não foi possível iniciar o microfone neste navegador.");
    }
  }

  function setMonitoring({ enabled = monitorEnabled, volume = monitorVolume } = {}) {
    monitorEnabled = Boolean(enabled);
    monitorVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (monitorGain) monitorGain.gain.value = monitorEnabled ? monitorVolume : 0;
  }

  function stop() {
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    stopMetering();
    window.clearInterval(timerId);
    timerId = null;
    onStateChange({ active: false, seconds: 0, label: "00:00" });
  }

  async function finish() {
    const mimeType = recordingMimeType || recorder?.mimeType || "audio/webm";
    const blob = new Blob(chunks, { type: mimeType });
    const seconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
    await onComplete({ blob, mimeType, seconds });
    recorder = null;
    chunks = [];
    stopMetering();
    recordingMimeType = "";
  }

  function toggle() {
    recorder && recorder.state !== "inactive" ? stop() : start();
  }

  function stopIfHidden() {
    if (document.hidden && recorder?.state === "recording") {
      showToast("A gravação foi parada porque a página deixou de estar activa.");
      stop();
    }
  }

  return { toggle, stop, stopIfHidden, setMonitoring, isRecording: () => recorder?.state === "recording" };
}
