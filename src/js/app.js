    const STORAGE_KEY = "fernando-lucoco-music-projects";
    const heroRecord = document.getElementById("hero-record");
    const mainRecord = document.getElementById("record-main");
    const timer = document.getElementById("timer");
    const recordLabel = document.getElementById("record-label");
    const list = document.getElementById("project-list");
    const nameInput = document.getElementById("project-name");
    const presetInput = document.getElementById("preset");
    const genreInput = document.getElementById("genre");
    const toast = document.getElementById("toast");
    let recorder = null;
    let stream = null;
    let chunks = [];
    let startedAt = 0;
    let timerId = null;
    let recordingMimeType = "";

    function getSupportedAudioMimeType() {
      const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
      return candidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";
    }
    function getFileExtension(mimeType) { return mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm"; }

    function showToast(message) { toast.textContent = message; toast.classList.add("show"); window.clearTimeout(showToast.timeout); showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 3600); }
    function readProjects() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
    function saveProjects(projects) { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); }
    function blobToDataUrl(blob) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); }); }
    function renderProjects() {
      const projects = readProjects();
      if (!projects.length) { list.innerHTML = '<div class="empty">Ainda não há takes guardadas. A tua próxima ideia pode começar aqui.</div>'; return; }
      list.innerHTML = projects.map((project) => {
        const audio = project.audioData ? `<audio class="project-audio" controls preload="metadata" playsinline webkit-playsinline aria-label="Reproduzir ${escapeHtml(project.name)}" src="${escapeHtml(project.audioData)}"></audio>` : '<small>Áudio não disponível nesta sessão.</small>';
        const download = project.audioData ? `<a class="mini-button" download="${escapeHtml(project.name)}.${getFileExtension(project.mimeType || "audio/webm")}" href="${escapeHtml(project.audioData)}">Descarregar</a>` : '';
        const process = project.audioData && project.status === "Guardada localmente" ? `<button class="mini-button" type="button" data-process-id="${escapeHtml(project.id)}">Preparar produção</button>` : '';
        return `<div class="project"><div class="project-content"><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(project.preset)} · ${escapeHtml(project.genre || "Demo vocal")} · ${escapeHtml(project.durationLabel || "duração não registada")} · ${escapeHtml(project.createdAt)}</small><div class="project-actions">${audio}${download}${process}<button class="mini-button danger" type="button" data-delete-id="${escapeHtml(project.id)}">Apagar</button></div></div><span class="pill">${escapeHtml(project.status)}</span></div>`;
      }).join("");
    }
    function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char])); }
    function updateTimer() { const seconds = Math.floor((Date.now() - startedAt) / 1000); timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}`; }
    function setRecordingUI(active) { heroRecord.classList.toggle("recording", active); heroRecord.setAttribute("aria-label", active ? "Parar gravação" : "Iniciar gravação"); mainRecord.textContent = active ? "Parar gravação" : "Começar a gravar"; recordLabel.textContent = active ? "A gravar agora" : "Pronto para gravar"; }
    async function startRecording() {
      if (!window.isSecureContext && location.hostname !== "localhost") { showToast("A gravação exige HTTPS. Abre o endereço Vercel seguro e tenta novamente."); return; }
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { showToast("Este navegador não suporta gravação local. Actualiza o Safari ou Chrome."); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        recordingMimeType = getSupportedAudioMimeType();
        recorder = recordingMimeType ? new MediaRecorder(stream, { mimeType: recordingMimeType }) : new MediaRecorder(stream);
        recordingMimeType = recorder.mimeType || recordingMimeType || "audio/webm";
        chunks = []; startedAt = Date.now();
        recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
        recorder.addEventListener("error", () => showToast("O navegador interrompeu a gravação. Tenta novamente sem sair desta página."));
        recorder.addEventListener("stop", finishRecording, { once: true }); recorder.start(1000); timerId = window.setInterval(updateTimer, 250); setRecordingUI(true);
      } catch (error) { showToast(error?.name === "NotAllowedError" || error?.name === "SecurityError" ? "O microfone foi bloqueado. Em Definições, permite o microfone para este site." : error?.name === "NotFoundError" ? "Não foi encontrado nenhum microfone disponível." : "Não foi possível iniciar o microfone neste navegador."); }
    }
    function stopRecording() { if (!recorder || recorder.state === "inactive") return; recorder.stop(); stream?.getTracks().forEach((track) => track.stop()); stream = null; window.clearInterval(timerId); setRecordingUI(false); }
    async function finishRecording() {
      const mimeType = recordingMimeType || recorder?.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type: mimeType });
      const seconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
      const name = nameInput.value.trim() || `Take ${String(readProjects().length + 1).padStart(2,"0")}`;
      const project = { id: crypto.randomUUID?.() || String(Date.now()), name, preset: presetInput.value, genre: genreInput.value, duration: seconds, durationLabel: `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2,"0")}s`, status: "Guardada localmente", createdAt: new Date().toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" }), bytes: blob.size, mimeType };
      try {
        project.audioData = await blobToDataUrl(blob);
        const projects = readProjects(); projects.unshift(project); saveProjects(projects); renderProjects(); showToast(`“${name}” foi guardada e pode ser reproduzida.`);
      } catch (error) {
        project.status = "Metadados guardados; áudio indisponível";
        try { const projects = readProjects(); projects.unshift(project); saveProjects(projects); renderProjects(); showToast("A take foi guardada sem áudio porque o armazenamento local ficou cheio."); } catch { showToast("Não foi possível guardar esta take. Liberta espaço do navegador e tenta novamente."); }
      }
      nameInput.value = ""; recorder = null; chunks = []; recordingMimeType = "";
    }
    function deleteProject(id) { const project = readProjects().find((item) => item.id === id); if (!project || !window.confirm(`Apagar “${project.name}” deste navegador?`)) return; saveProjects(readProjects().filter((item) => item.id !== id)); renderProjects(); showToast("A sessão foi apagada localmente."); }
    function updateProjectStatus(id, status) { const projects = readProjects().map((item) => item.id === id ? { ...item, status } : item); saveProjects(projects); renderProjects(); }
    function processProject(id) {
      const project = readProjects().find((item) => item.id === id); if (!project) return;
      updateProjectStatus(id, "PROCESSING · simulado"); showToast("Fluxo visual iniciado: análise vocal local simulada.");
      window.setTimeout(() => updateProjectStatus(id, "MIXING · simulado"), 1100);
      window.setTimeout(() => updateProjectStatus(id, "MASTERING · simulado"), 2200);
      window.setTimeout(() => { updateProjectStatus(id, "COMPLETED · pronto para revisão"); showToast("A simulação terminou. Nenhum processamento de áudio real foi aplicado."); }, 3300);
    }
    function toggleRecording() { recorder && recorder.state !== "inactive" ? stopRecording() : startRecording(); }
    list.addEventListener("click", (event) => { const deleteButton = event.target.closest("[data-delete-id]"); const processButton = event.target.closest("[data-process-id]"); if (deleteButton) deleteProject(deleteButton.dataset.deleteId); if (processButton) processProject(processButton.dataset.processId); });
    list.addEventListener("play", (event) => { list.querySelectorAll("audio").forEach((audio) => { if (audio !== event.target) audio.pause(); }); }, true);
    list.addEventListener("error", (event) => { if (event.target.matches?.("audio")) showToast("Esta take não pode ser reproduzida neste navegador. Tenta descarregar o ficheiro."); }, true);
    document.addEventListener("visibilitychange", () => { if (document.hidden && recorder?.state === "recording") { showToast("A gravação foi parada porque a página deixou de estar activa."); stopRecording(); } });
    heroRecord.addEventListener("click", toggleRecording); mainRecord.addEventListener("click", toggleRecording); renderProjects();
