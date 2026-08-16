import { blobToDataUrl, escapeHtml, getFileExtension, makeProjectId, readProjects, saveProjects } from "./storage.js";
import { bindPlayerEvents } from "./player.js";
import { processProject } from "./production.js";
import { applyGain } from "./effects.js";
import { createRecorderController } from "./recorder.js";

const heroRecord = document.getElementById("hero-record");
const mainRecord = document.getElementById("record-main");
const timer = document.getElementById("timer");
const recordLabel = document.getElementById("record-label");
const list = document.getElementById("project-list");
const nameInput = document.getElementById("project-name");
const presetInput = document.getElementById("preset");
const genreInput = document.getElementById("genre");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 3600);
}

function setRecordingUI({ active, label }) {
  heroRecord.classList.toggle("recording", active);
  heroRecord.setAttribute("aria-label", active ? "Parar gravação" : "Iniciar gravação");
  mainRecord.textContent = active ? "Parar gravação" : "Começar a gravar";
  recordLabel.textContent = active ? "A gravar agora" : "Pronto para gravar";
  timer.textContent = active ? label : "00:00";
}

function renderProjects() {
  const projects = readProjects();
  if (!projects.length) {
    list.innerHTML = '<div class="empty">Ainda não há takes guardadas. A tua próxima ideia pode começar aqui.</div>';
    return;
  }
  list.innerHTML = projects.map((project) => {
    const audio = project.audioData
      ? `<audio class="project-audio" controls preload="metadata" playsinline webkit-playsinline aria-label="Reproduzir ${escapeHtml(project.name)}" src="${escapeHtml(project.audioData)}"></audio>`
      : "<small>Áudio não disponível nesta sessão.</small>";
    const download = project.audioData
      ? `<a class="mini-button" download="${escapeHtml(project.name)}.${getFileExtension(project.mimeType || "audio/webm")}" href="${escapeHtml(project.audioData)}">Descarregar</a>`
      : "";
    const process = project.audioData && project.status === "Guardada localmente"
      ? `<button class="mini-button" type="button" data-process-id="${escapeHtml(project.id)}">Preparar produção</button>`
      : "";
    const gain = project.audioData && !project.effectApplied
      ? `<button class="mini-button" type="button" data-gain-id="${escapeHtml(project.id)}">Ganho +3 dB real</button>`
      : project.effectApplied ? '<small class="effect-note">Ganho +3 dB aplicado localmente · WAV</small>' : "";
    return `<div class="project"><div class="project-content"><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(project.preset)} · ${escapeHtml(project.genre || "Demo vocal")} · ${escapeHtml(project.durationLabel || "duração não registada")} · ${escapeHtml(project.createdAt)}</small><div class="project-actions">${audio}${download}${gain}${process}<button class="mini-button danger" type="button" data-delete-id="${escapeHtml(project.id)}">Apagar</button></div></div><span class="pill">${escapeHtml(project.status)}</span></div>`;
  }).join("");
}

async function saveRecording({ blob, mimeType, seconds }) {
  const name = nameInput.value.trim() || `Take ${String(readProjects().length + 1).padStart(2, "0")}`;
  const project = {
    id: makeProjectId(),
    name,
    preset: presetInput.value,
    genre: genreInput.value,
    duration: seconds,
    durationLabel: `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`,
    status: "Guardada localmente",
    createdAt: new Date().toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" }),
    bytes: blob.size,
    mimeType,
  };
  try {
    project.audioData = await blobToDataUrl(blob);
    const projects = readProjects();
    projects.unshift(project);
    saveProjects(projects);
    renderProjects();
    showToast(`“${name}” foi guardada e pode ser reproduzida.`);
  } catch {
    project.status = "Metadados guardados; áudio indisponível";
    try {
      const projects = readProjects();
      projects.unshift(project);
      saveProjects(projects);
      renderProjects();
      showToast("A take foi guardada sem áudio porque o armazenamento local ficou cheio.");
    } catch {
      showToast("Não foi possível guardar esta take. Liberta espaço do navegador e tenta novamente.");
    }
  }
  nameInput.value = "";
}

async function applyLocalGain(id) {
  const project = readProjects().find((item) => item.id === id);
  if (!project?.audioData || project.effectApplied) return;
  try {
    showToast("A aplicar ganho local de +3 dB e a preparar WAV…");
    const response = await fetch(project.audioData);
    const processedBlob = await applyGain(await response.blob());
    const updated = readProjects().map((item) => item.id === id ? {
      ...item,
      mimeType: "audio/wav",
      effectApplied: "Ganho +3 dB",
      status: "Efeito local aplicado",
    } : item);
    const target = updated.find((item) => item.id === id);
    target.audioData = await blobToDataUrl(processedBlob);
    saveProjects(updated);
    renderProjects();
    showToast("Ganho +3 dB aplicado localmente. A take continua sem mixagem ou IA.");
  } catch {
    showToast("Não foi possível aplicar o efeito neste navegador. A take original foi preservada.");
  }
}

function deleteProject(id) {
  const project = readProjects().find((item) => item.id === id);
  if (!project || !window.confirm(`Apagar “${project.name}” deste navegador?`)) return;
  saveProjects(readProjects().filter((item) => item.id !== id));
  renderProjects();
  showToast("A sessão foi apagada localmente.");
}

const recorder = createRecorderController({ onStateChange: setRecordingUI, onComplete: saveRecording, showToast });

list.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-id]");
  const processButton = event.target.closest("[data-process-id]");
  const gainButton = event.target.closest("[data-gain-id]");
  if (deleteButton) deleteProject(deleteButton.dataset.deleteId);
  if (processButton) processProject(processButton.dataset.processId, { renderProjects, showToast });
  if (gainButton) applyLocalGain(gainButton.dataset.gainId);
});

bindPlayerEvents(list, showToast);
document.addEventListener("visibilitychange", recorder.stopIfHidden);
heroRecord.addEventListener("click", recorder.toggle);
mainRecord.addEventListener("click", recorder.toggle);
renderProjects();
