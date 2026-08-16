function getSupportedAudioMimeType() {
  const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  return candidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";
}

export function createRecorderController({ onStateChange, onComplete, showToast }) {
  let recorder = null;
  let stream = null;
  let chunks = [];
  let startedAt = 0;
  let timerId = null;
  let recordingMimeType = "";

  function updateTimer() {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    onStateChange({
      active: true,
      seconds,
      label: `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
    });
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
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
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

  function stop() {
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
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

  return { toggle, stop, stopIfHidden, isRecording: () => recorder?.state === "recording" };
}
