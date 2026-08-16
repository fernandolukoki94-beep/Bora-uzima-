import { blobToDataUrl, escapeHtml, getFileExtension, makeProjectId, readProjects, saveProjects } from "./storage.js";
import { bindPlayerEvents } from "./player.js";
import { simulateProductionPipeline } from "./production.js";
import { applyFade, applyGain } from "./effects.js";
import { createRecorderController } from "./recorder.js";
import {
  clearLocalStudioData,
  deleteProjectData,
  estimateStorageUsage,
  indexedDbAvailable,
  migrateLocalStorageProjects,
  putAudioBlob,
  putEffect,
  putProject,
  putTake,
} from "./indexeddb-storage.js";

const heroRecord = document.getElementById("hero-record");
const mainRecord = document.getElementById("record-main");
const timer = document.getElementById("timer");
const recordLabel = document.getElementById("record-label");
const list = document.getElementById("project-list");
const nameInput = document.getElementById("project-name");
const presetInput = document.getElementById("preset");
const genreInput = document.getElementById("genre");
const toast = document.getElementById("toast");
const storageStatus = document.getElementById("storage-status");
const clearStorageButton = document.getElementById("clear-local-storage");

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

async function refreshStorageStatus() {
  if (!storageStatus) return;
  const estimate = await estimateStorageUsage();
  const quotaText = estimate.quota ? ` de ${formatBytes(estimate.quota)}` : "";
  storageStatus.textContent = `${estimate.indexedDbAvailable ? "IndexedDB activo" : "fallback localStorage"} · ${formatBytes(estimate.localBytes)}${quotaText} usados localmente`;
  storageStatus.dataset.storageMode = estimate.indexedDbAvailable ? "indexeddb" : "fallback";
}

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

function audioBlock(label, data, mimeType, projectName) {
  if (!data) return `<small>${label} não disponível nesta sessão.</small>`;
  const safeLabel = escapeHtml(`${label} de ${projectName}`);
  const extension = getFileExtension(mimeType || "audio/webm");
  return `<div class="audio-version"><span>${escapeHtml(label)}</span><audio class="project-audio" controls preload="metadata" playsinline webkit-playsinline aria-label="Reproduzir ${safeLabel}" src="${escapeHtml(data)}"></audio><a class="mini-button" download="${escapeHtml(projectName)}-${extension === "wav" ? "processada" : "original"}.${extension}" href="${escapeHtml(data)}">Descarregar ${escapeHtml(label.toLowerCase())}</a></div>`;
}

function renderProjects() {
  const projects = readProjects();
  if (!projects.length) {
    list.innerHTML = '<div class="empty">Ainda não há takes guardadas. A tua próxima ideia pode começar aqui.</div>';
    return;
  }
  list.innerHTML = projects.map((project) => {
    const originalData = project.originalAudioData || (!project.processedAudioData ? project.audioData : "");
    const processedData = project.processedAudioData || (project.effectApplied || project.fadeApplied ? project.audioData : "");
    const original = audioBlock("Original", originalData, project.originalMimeType || project.mimeType, project.name);
    const processed = processedData
      ? audioBlock("Processada", processedData, project.processedMimeType || "audio/wav", project.name)
      : "<small>Processada: ainda não existe.</small>";
    const legacyNotice = !project.originalAudioData && processedData
      ? '<small class="effect-note">Take histórica: o original separado não está disponível nesta versão.</small>'
      : "";
    const process = originalData && !String(project.status).includes("simulado")
      ? `<button class="mini-button" type="button" data-process-id="${escapeHtml(project.id)}">Preparar produção (simulado)</button>`
      : "";
    const gain = originalData && !project.effectApplied
      ? `<button class="mini-button" type="button" data-gain-id="${escapeHtml(project.id)}">Ganho +3 dB real</button>`
      : "";
    const fade = originalData && !project.fadeApplied
      ? `<button class="mini-button" type="button" data-fade-id="${escapeHtml(project.id)}">Fade in/out real</button>`
      : "";
    return `<div class="project"><div class="project-content"><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(project.preset)} · ${escapeHtml(project.genre || "Demo vocal")} · ${escapeHtml(project.durationLabel || "duração não registada")} · ${escapeHtml(project.createdAt)}</small><div class="project-audio-stack">${original}${processed}${legacyNotice}</div><div class="project-actions">${gain}${fade}${process}<button class="mini-button danger" type="button" data-delete-id="${escapeHtml(project.id)}">Apagar</button></div></div><span class="pill">${escapeHtml(project.status)}</span></div>`;
  }).join("");
}

async function saveRecording({ blob, mimeType, seconds }) {
  const name = nameInput.value.trim() || `Take ${String(readProjects().length + 1).padStart(2, "0")}`;
  const originalAudioData = await blobToDataUrl(blob);
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
    originalMimeType: mimeType,
    originalAudioData,
    processedAudioData: null,
    processedMimeType: null,
  };
  try {
    const projects = readProjects();
    projects.unshift(project);
    saveProjects(projects);
    try {
      if (await indexedDbAvailable()) {
        await Promise.all([
          putProject({ ...project, storageVersion: "indexeddb-v2" }),
          putTake({ id: project.id, projectId: project.id, originalAudioData: true, processedAudioData: false }),
          putAudioBlob(project.id, "original", blob),
        ]);
      }
    } catch {
      showToast("A take foi guardada no fallback local; IndexedDB não esteve disponível.");
    }
    renderProjects();
    await refreshStorageStatus();
    showToast(`“${name}” foi guardada e o original está disponível.`);
  } catch {
    showToast("Não foi possível guardar esta take. Liberta espaço do navegador e tenta novamente.");
  }
  nameInput.value = "";
}

async function applyLocalEffect(id, effectName, processor, successMessage) {
  const project = readProjects().find((item) => item.id === id);
  const sourceData = project?.processedAudioData || project?.originalAudioData || project?.audioData;
  if (!project || !sourceData || project[effectName]) return;
  try {
    showToast(`A aplicar ${effectName === "effectApplied" ? "ganho local de +3 dB" : "fade in/out local"} e a preparar WAV…`);
    const response = await fetch(sourceData);
    const processedBlob = await processor(await response.blob());
    const processedAudioData = await blobToDataUrl(processedBlob);
    const updated = readProjects().map((item) => item.id === id ? {
      ...item,
      processedAudioData,
      processedMimeType: "audio/wav",
      processedBytes: processedBlob.size,
      [effectName]: effectName === "effectApplied" ? "Ganho +3 dB" : "Fade in/out",
      status: "Efeito local aplicado",
    } : item);
    saveProjects(updated);
    try {
      if (await indexedDbAvailable()) {
        await Promise.all([
          putAudioBlob(id, "processed", processedBlob),
          putEffect({
            id: `${id}:${effectName}`,
            projectId: id,
            type: effectName === "effectApplied" ? "gain" : "fade",
            parameters: effectName === "effectApplied" ? { decibels: 3 } : { fadeInSeconds: 0.5, fadeOutSeconds: 1 },
            createdAt: new Date().toISOString(),
          }),
          putProject(updated.find((item) => item.id === id)),
        ]);
      }
    } catch {
      showToast("O efeito foi guardado no fallback local; a cópia IndexedDB falhou.");
    }
    renderProjects();
    await refreshStorageStatus();
    showToast(successMessage);
  } catch {
    showToast("Não foi possível aplicar o efeito neste navegador. O original continua preservado.");
  }
}

function applyLocalGain(id) {
  return applyLocalEffect(id, "effectApplied", applyGain, "Ganho +3 dB aplicado localmente. Original e processada estão separados.");
}

function applyLocalFade(id) {
  return applyLocalEffect(id, "fadeApplied", applyFade, "Fade in/out aplicado localmente. Original e processada estão separados.");
}

async function deleteProject(id) {
  const project = readProjects().find((item) => item.id === id);
  if (!project || !window.confirm(`Apagar “${project.name}” deste navegador?`)) return;
  saveProjects(readProjects().filter((item) => item.id !== id));
  try {
    if (await indexedDbAvailable()) await deleteProjectData(id);
  } catch {
    showToast("A sessão foi removida do fallback local, mas a limpeza IndexedDB precisa de nova tentativa.");
  }
  renderProjects();
  await refreshStorageStatus();
  showToast("A sessão foi apagada localmente.");
}

const recorder = createRecorderController({ onStateChange: setRecordingUI, onComplete: saveRecording, showToast });

list.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-id]");
  const processButton = event.target.closest("[data-process-id]");
  const gainButton = event.target.closest("[data-gain-id]");
  const fadeButton = event.target.closest("[data-fade-id]");
  if (deleteButton) deleteProject(deleteButton.dataset.deleteId);
  if (processButton) simulateProductionPipeline(processButton.dataset.processId, { renderProjects, showToast });
  if (gainButton) applyLocalGain(gainButton.dataset.gainId);
  if (fadeButton) applyLocalFade(fadeButton.dataset.fadeId);
});

bindPlayerEvents(list, showToast);
document.addEventListener("visibilitychange", recorder.stopIfHidden);
heroRecord.addEventListener("click", recorder.toggle);
mainRecord.addEventListener("click", recorder.toggle);
clearStorageButton?.addEventListener("click", async () => {
  if (!window.confirm("Apagar todas as sessões e dados locais deste navegador? Esta acção não pode ser desfeita.")) return;
  await clearLocalStudioData();
  renderProjects();
  await refreshStorageStatus();
  showToast("Todos os dados locais foram limpos.");
});
renderProjects();
refreshStorageStatus();
migrateLocalStorageProjects().then((result) => {
  if (result.migrated) refreshStorageStatus();
}).catch(() => {});
