import { blobToDataUrl, dataUrlToBlob, escapeHtml, getFileExtension, makeProjectId, readProjects, saveProjects } from "./storage.js";
import { bindPlayerEvents } from "./player.js";
import { buildProducerPlan, producerPlanClipSpecs, applyProducerMix } from "./producer-plan.js";
import { applyCompressor, applyFade, applyGain, applyNormalize, applyVocalEnhancement } from "./effects.js";
import { createRecorderController } from "./recorder.js";
import { addClip, addTrack, normalizeProject, updateTrack } from "./studio/project-model.js";
import { createHistoryState, canRedo, canUndo, commitHistory, redoHistory, undoHistory } from "./studio/history.js";
import { deleteClip, duplicateClip, moveClip, setClipFade, setClipGain, splitClip, trimClip } from "./studio/timeline.js";
import { playChord, playDrumHit, playNote, playPattern, playSequence } from "./studio/audio-engine.js";
import { createGridEvents } from "./studio/sequencer.js";
import { getBeatPreset } from "./studio/instruments.js";
import { isInstrumentClip } from "./studio/instrument-renderer.js";
import { renderTimelineToWav } from "./studio/mixdown.js";
import { beginProduction, cancelProduction, completeProduction, failProduction, setProductionPhase, isProductionActive, PRODUCTION_STATES } from "./production.js";
import {
  TRANSPORT_STATES,
  advanceTransport,
  createTransportState,
  getTimelineDuration,
  pauseTransport,
  startTransport,
  stopTransport,
} from "./studio/transport.js";
import {
  clearLocalStudioData,
  deleteProjectData,
  estimateStorageUsage,
  indexedDbAvailable,
  getAudioBlob,
  migrateLocalStorageProjects,
  putAudioBlob,
  putEffect,
  putProject,
  putTake,
  resetProjectEffects,
} from "./indexeddb-storage.js";

const heroRecord = document.getElementById("hero-record");
const mainRecord = document.getElementById("record-main");
const timer = document.getElementById("timer");
const recordLabel = document.getElementById("record-label");
const list = document.getElementById("project-list");
const nameInput = document.getElementById("project-name");
const presetInput = document.getElementById("preset");
const genreInput = document.getElementById("genre");
const productionBriefInput = document.getElementById("production-brief");
const toast = document.getElementById("toast");
const storageStatus = document.getElementById("storage-status");
const clearStorageButton = document.getElementById("clear-local-storage");
const timelineGrid = document.getElementById("timeline-grid");
const mixerTracks = document.getElementById("mixer-tracks");
const mixerHeadroom = document.getElementById("mixer-headroom");
const addTrackButton = document.getElementById("add-track");
const timelineMixdownButton = document.getElementById("timeline-mixdown");
const timelineUndoButton = document.getElementById("timeline-undo");
const timelineRedoButton = document.getElementById("timeline-redo");
const projectTempo = document.getElementById("project-tempo");
const projectKey = document.getElementById("project-key");
const transportBeginning = document.getElementById("transport-beginning");
const transportPlay = document.getElementById("transport-play");
const transportPause = document.getElementById("transport-pause");
const transportStop = document.getElementById("transport-stop");
const transportClock = document.getElementById("transport-clock");
const timelinePlayhead = document.getElementById("timeline-playhead");
const transportStatus = document.getElementById("transport-status");
const keyboardNotes = document.getElementById("keyboard-notes");
const chordSelect = document.getElementById("chord-select");
const playChordButton = document.getElementById("play-chord");
const patternSelect = document.getElementById("pattern-select");
const playPatternButton = document.getElementById("play-pattern");
const guitarChords = document.getElementById("guitar-chords");
const extraInstruments = document.getElementById("extra-instruments");
const pianoRoll = document.getElementById("piano-roll");
const beatGrid = document.getElementById("beat-grid");
const beatPreset = document.getElementById("beat-preset");
const applyBeatPreset = document.getElementById("apply-beat-preset");
const playBeatSequence = document.getElementById("play-beat-sequence");
const resetBeat = document.getElementById("reset-beat");
const addChordTimeline = document.getElementById("add-chord-timeline");
const addGuitarTimeline = document.getElementById("add-guitar-timeline");
const addBeatTimeline = document.getElementById("add-beat-timeline");
let activeTimelineId = null;
let timelineHistory = null;
let transportTimers = [];
let transportFrame = null;
let transportState = createTransportState(0);
let transportStartedAt = 0;
let transportBasePosition = 0;
let transportAudio = [];
const linearToDb = (value) => value <= 0.001 ? -60 : 20 * Math.log10(value);
const dbToLinear = (value) => value <= -60 ? 0 : Math.pow(10, value / 20);
const formatGainDb = (value) => value <= 0.001 ? "−∞ dB" : `${linearToDb(value).toFixed(1)} dB`;
if (pianoRoll) {
  pianoRoll.innerHTML = Array.from({ length: 16 }, (_, index) => `<button class="piano-step" type="button" data-piano-note="${index % 8 === 0 ? "C4" : index % 8 === 2 ? "E4" : index % 8 === 4 ? "G4" : "C5"}" aria-label="Passo ${index + 1}">${index + 1}</button>`).join("");
}
if (beatGrid) {
  const channels = ["kick", "snare", "clap", "hihat", "percussion", "bass"];
  beatGrid.innerHTML = channels.map((channel) => `<div class="beat-row"><span class="beat-label">${channel}</span>${Array.from({ length: 16 }, (_, step) => `<button class="beat-step" type="button" data-beat-channel="${channel}" data-beat-step="${step}" aria-label="${channel} passo ${step + 1}"></button>`).join("")}</div>`).join("");
}

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

function flashControl(button) {
  if (!button) return;
  button.classList.add("is-playing");
  window.setTimeout(() => button.classList.remove("is-playing"), 180);
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

function currentTimelineProject() {
  const projects = readProjects();
  return projects.find((project) => project.id === activeTimelineId) || projects[0] || null;
}
function syncTimelineHistory(project) {
  if (!project) { activeTimelineId = null; timelineHistory = null; return; }
  if (activeTimelineId !== project.id || !timelineHistory) {
    activeTimelineId = project.id;
    timelineHistory = createHistoryState(normalizeProject(project));
  }
}
function formatTransportTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
}

function updateTransportUI() {
  const duration = transportState.duration;
  if (transportClock) transportClock.textContent = `${formatTransportTime(transportState.position)} / ${formatTransportTime(duration)}`;
  if (transportStatus) transportStatus.textContent = transportState.status === TRANSPORT_STATES.PLAYING
    ? "A reproduzir"
    : transportState.status === TRANSPORT_STATES.PAUSED ? "Pausado" : "Parado";
  if (timelinePlayhead) {
    const scaleDuration = Math.max(40, duration);
    timelinePlayhead.style.left = `${Math.min(100, (transportState.position / scaleDuration) * 100)}%`;
  }
  if (transportPlay) transportPlay.textContent = transportState.status === TRANSPORT_STATES.PLAYING ? "▶ A reproduzir" : "▶ Play";
}

function stopTransportAudio() {
  transportAudio.forEach((audio) => {
    try { audio.pause(); } catch {}
    audio.removeAttribute("src");
    audio.load();
  });
  transportAudio = [];
  transportTimers.forEach((timerId) => window.clearTimeout(timerId));
  transportTimers = [];
}

function audioSourceForClip(project, clip) {
  if (clip.blobKey?.endsWith(":processed")) return project.processedAudioData || project.originalAudioData || project.audioData;
  return project.originalAudioData || project.audioData;
}

function scheduleTimelineAudio(project, startPosition) {
  stopTransportAudio();
  project.tracks.forEach((track) => {
    if (track.muted || (project.tracks.some((item) => item.solo) && !track.solo)) return;
    track.clips.forEach((clip) => {
      const clipEnd = Number(clip.start || 0) + Number(clip.duration || 0);
      if (clipEnd <= startPosition) return;
      const source = audioSourceForClip(project, clip);
      if (!source) return;
      const delay = Math.max(0, (Number(clip.start || 0) - startPosition) * 1000);
      const timerId = window.setTimeout(() => {
        const audio = new Audio(source);
        audio.preload = "auto";
        audio.volume = Math.max(0, Math.min(1, Number(track.volume ?? 1) * Number(clip.gain ?? 1)));
        const offset = Math.max(0, startPosition - Number(clip.start || 0)) + Number(clip.sourceOffset || 0);
        audio.currentTime = offset;
        audio.play().then(() => transportAudio.push(audio)).catch(() => showToast("A reprodução da sessão foi bloqueada pelo navegador."));
      }, delay);
      transportTimers.push(timerId);
    });
  });
}

function transportTick(now) {
  if (transportState.status !== TRANSPORT_STATES.PLAYING) return;
  const elapsed = (now - transportStartedAt) / 1000;
  transportState = advanceTransport({ ...transportState, position: transportBasePosition }, elapsed);
  updateTransportUI();
  if (transportState.status === TRANSPORT_STATES.STOPPED) {
    stopTransportAudio();
    transportFrame = null;
    return;
  }
  transportFrame = window.requestAnimationFrame(transportTick);
}

function refreshTransportProject() {
  const project = currentTimelineProject();
  transportState = createTransportState(project ? getTimelineDuration(project) : 0);
  updateTransportUI();
}

function renderTimeline() {
  if (!timelineGrid) return;
  const project = currentTimelineProject();
  syncTimelineHistory(project);
  if (!project) {
    timelineGrid.innerHTML = '<div class="empty">Grava uma take para abrir a timeline da sessão.</div>';
    if (timelineUndoButton) timelineUndoButton.disabled = true;
    if (timelineRedoButton) timelineRedoButton.disabled = true;
    return;
  }
  const normalized = timelineHistory.present;
  const nextDuration = getTimelineDuration(normalized);
  if (transportState.status === TRANSPORT_STATES.STOPPED || transportState.duration !== nextDuration) {
    transportState = { ...transportState, duration: nextDuration, position: Math.min(transportState.position, nextDuration) };
  }
  if (projectTempo) projectTempo.value = normalized.tempo;
  if (projectKey) projectKey.value = normalized.key;
  timelineGrid.innerHTML = normalized.tracks.map((track) => {
    const clips = track.clips.map((clip) => {
      const left = Math.min(92, Math.max(0, (clip.start / 40) * 100));
      const width = Math.max(8, Math.min(96 - left, (clip.duration / 40) * 100));
      const key = `${escapeHtml(track.id)}:${escapeHtml(clip.id)}`;
      return `<div class="timeline-clip" style="left:${left}%;width:${width}%" title="${escapeHtml(clip.name)}"><strong>${escapeHtml(clip.name)}</strong><small>${clip.duration.toFixed(1)}s · ${clip.gain.toFixed(2)}x · offset ${clip.sourceOffset.toFixed(1)}s</small><div class="clip-actions"><button class="mini-button" type="button" data-clip-action="move-left" data-clip-key="${key}">←</button><button class="mini-button" type="button" data-clip-action="move-right" data-clip-key="${key}">→</button><button class="mini-button" type="button" data-clip-action="trim" data-clip-key="${key}">Trim</button><button class="mini-button" type="button" data-clip-action="split" data-clip-key="${key}">Split</button><button class="mini-button" type="button" data-clip-action="shorter" data-clip-key="${key}">−Len</button><button class="mini-button" type="button" data-clip-action="longer" data-clip-key="${key}">+Len</button><button class="mini-button" type="button" data-clip-action="fade" data-clip-key="${key}">Fade</button><button class="mini-button" type="button" data-clip-action="gain" data-clip-key="${key}">Gain</button><button class="mini-button" type="button" data-duplicate-clip="${key}">Duplicar</button><button class="mini-button danger" type="button" data-delete-clip="${key}">Apagar</button></div></div>`;
    }).join("");
    return `<div class="timeline-track"><div class="timeline-track-label">${escapeHtml(track.name)}<small>${escapeHtml(track.type)}</small></div><div class="timeline-lane">${clips || '<span class="empty">Sem clips</span>'}</div></div>`;
  }).join("");
  if (timelineUndoButton) timelineUndoButton.disabled = !canUndo(timelineHistory);
  if (timelineRedoButton) timelineRedoButton.disabled = !canRedo(timelineHistory);
  renderMixer(normalized);
  updateTransportUI();
}
function renderMixer(project) {
  if (!mixerTracks) return;
  if (!project?.tracks?.length) {
    mixerTracks.innerHTML = '<div class="empty">Abre uma sessão para ver as tracks.</div>';
    if (mixerHeadroom) mixerHeadroom.textContent = "Headroom 0 dB";
    return;
  }
  mixerTracks.innerHTML = project.tracks.map((track) => { const volume = Number(track.volume ?? 1); return `<div class="mixer-track" data-mixer-track="${escapeHtml(track.id)}"><div class="mixer-track-title"><strong>${escapeHtml(track.name)}</strong><span>${escapeHtml(track.type)}</span></div><label><span>Ganho <output data-mixer-output="volume">${formatGainDb(volume)}</output></span><span class="control-hint">−∞ a +6 dB</span><input type="range" min="-60" max="6" step="0.5" value="${Math.max(-60, Math.min(6, linearToDb(volume)))}" data-mixer-field="volume" aria-label="Ganho em decibéis de ${escapeHtml(track.name)}"></label><label><span>Pan <output data-mixer-output="pan">${Number(track.pan ?? 0).toFixed(2)}</output></span><span class="control-hint">L · C · R</span><input type="range" min="-1" max="1" step="0.01" value="${Number(track.pan ?? 0)}" data-mixer-field="pan" aria-label="Pan de ${escapeHtml(track.name)}"></label><div class="mixer-switches"><button class="mini-button ${track.muted ? "active" : ""}" type="button" data-mixer-field="muted">${track.muted ? "Unmute" : "Mute"}</button><button class="mini-button ${track.solo ? "active" : ""}" type="button" data-mixer-field="solo">${track.solo ? "Unsolo" : "Solo"}</button></div></div>`; }).join("");
  const active = project.tracks.filter((track) => !track.muted);
  const estimatedPeak = active.reduce((sum, track) => sum + Number(track.volume ?? 1), 0);
  const headroomDb = estimatedPeak > 0 ? 20 * Math.log10(Math.max(0.0001, 0.98 / estimatedPeak)) : 0;
  if (mixerHeadroom) mixerHeadroom.textContent = `Headroom ${headroomDb.toFixed(1)} dB`;
}
async function commitTimelineProject(nextProject) {
  timelineHistory = commitHistory(timelineHistory, normalizeProject(nextProject));
  const projects = readProjects().map((project) => project.id === activeTimelineId ? timelineHistory.present : project);
  saveProjects(projects);
  try { if (await indexedDbAvailable()) await putProject(timelineHistory.present); } catch { showToast("A edição ficou no fallback local; IndexedDB será tentado novamente."); }
  renderProjects();
}
async function mixdownActiveTimeline() {
  const project = currentTimelineProject();
  if (!project || !timelineHistory) { showToast("Grava primeiro uma take para abrir uma sessão."); return; }
  const sources = new Map();
  const sourceData = project.originalAudioData || project.audioData;
  for (const track of timelineHistory.present.tracks) {
    for (const clip of track.clips) {
      if (sources.has(clip.blobKey) || sources.has(clip.id)) continue;
      let blob = null;
      try { if (indexedDbAvailable() && clip.blobKey) blob = await getAudioBlob(project.id, clip.blobKey.endsWith(":processed") ? "processed" : "original"); } catch {}
      if (!blob && sourceData && (clip.blobKey?.startsWith(`${project.id}:`) || clip.blobKey === null)) {
        blob = await fetch(sourceData).then((response) => response.blob());
      }
      if (blob) sources.set(clip.blobKey || clip.id, blob);
    }
  }
  const hasInstrumentClip = timelineHistory.present.tracks.some((track) => track.clips.some((clip) => isInstrumentClip(clip)));
  if (!sources.size && !hasInstrumentClip) { showToast("Não encontrei áudio local exportável nesta timeline."); return; }
  timelineMixdownButton.disabled = true;
  timelineMixdownButton.textContent = "A preparar WAV…";
  try {
    const wav = await renderTimelineToWav(timelineHistory.present, sources);
    const url = URL.createObjectURL(wav);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name || "sessao"}-mixdown.wav`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Mixdown WAV exportado localmente com headroom.");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Não foi possível exportar o mixdown.");
  } finally {
    timelineMixdownButton.disabled = false;
    timelineMixdownButton.textContent = "↓ Mixdown WAV";
  }
}

function insertInstrumentClip({ name, type, duration = 4, metadata = {} }) {
  const project = currentTimelineProject();
  if (!project) {
    showToast("Grava primeiro uma take para abrir uma sessão na timeline.");
    return false;
  }
  let nextProject = normalizeProject(project);
  let track = nextProject.tracks.find((item) => item.type === type);
  if (!track) {
    nextProject = addTrack(nextProject, { name, type, color: type === "drums" ? "#f4b860" : type === "guitar" ? "#9c8cff" : "#62d6c7" });
    track = nextProject.tracks[nextProject.tracks.length - 1];
  }
  const end = track.clips.reduce((latest, clip) => Math.max(latest, Number(clip.start || 0) + Number(clip.duration || 0)), 0);
  nextProject = addClip(nextProject, track.id, {
    name,
    start: end,
    duration,
    sourceOffset: 0,
    mimeType: "application/x-fernando-lucoco-event",
    event: metadata,
  });
  commitTimelineProject(nextProject);
  showToast(`${name} adicionado à timeline local.`);
  return true;
}

async function runProducerPlan(id) {
  const source = readProjects().find((item) => item.id === id);
  if (!source) return;
  const job = beginProduction(id, renderProjects);
  if (!job) {
    showToast("Este projecto já está a ser processado.");
    return;
  }
  activeTimelineId = id;
  timelineHistory = createHistoryState(normalizeProject(source));
  try {
    const plan = buildProducerPlan({ genre: source.genre, tempo: source.tempo, key: source.key, duration: source.duration, brief: source.productionBrief || "" });
    if (!setProductionPhase(id, PRODUCTION_STATES.ARRANGING, "A criar arranjo local", 25, renderProjects)) return;
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    let next = applyProducerMix(normalizeProject(source), plan);
    const clipDuration = Math.max(4, Math.min(16, Number(source.duration || 8)));
    const specs = producerPlanClipSpecs(plan, clipDuration);
    for (const [index, spec] of specs.entries()) {
      if (!isProductionActive(id)) return;
      let track = next.tracks.find((item) => item.type === spec.type);
      if (!track) {
        next = addTrack(next, { name: spec.type === "drums" ? "Beat Maker" : spec.name.split(" · ")[0], type: spec.type, color: spec.type === "drums" ? "#f4b860" : spec.type === "guitar" ? "#9c8cff" : "#62d6c7" });
        track = next.tracks[next.tracks.length - 1];
      }
      const end = track.clips.reduce((latest, clip) => Math.max(latest, Number(clip.start || 0) + Number(clip.duration || 0)), 0);
      next = addClip(next, track.id, { name: spec.name, start: end, duration: spec.duration, sourceOffset: 0, mimeType: "application/x-fernando-lucoco-event", event: spec.metadata });
      setProductionPhase(id, PRODUCTION_STATES.ARRANGING, `A criar arranjo local · ${index + 1}/${specs.length}`, 25 + Math.round(((index + 1) / specs.length) * 45), renderProjects);
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
    if (!setProductionPhase(id, PRODUCTION_STATES.MIXING, "A preparar mix local", 85, renderProjects)) return;
    await commitTimelineProject(next);
    completeProduction(id, renderProjects);
    showToast(`Producer Plan aplicado: ${plan.genre}, ${plan.bpm} BPM, ${plan.instruments.length} instrumentos locais.`);
  } catch (error) {
    failProduction(id, error, renderProjects);
    showToast("A produção falhou, mas o projecto original foi preservado. Tenta novamente.");
  }
}

function cancelProducerPlan(id) {
  cancelProduction(id, renderProjects, showToast);
}

function renderProjects() {
  const projects = readProjects();
  if (!projects.length) {
    list.innerHTML = '<div class="empty">Ainda não há takes guardadas. A tua próxima ideia pode começar aqui.</div>';
    renderTimeline();
    return;
  }
  list.innerHTML = projects.map((project) => {
    const originalData = project.originalAudioData || (!project.processedAudioData ? project.audioData : "");
    const processedData = project.processedAudioData || (project.effectApplied || project.fadeApplied ? project.audioData : "");
    const original = audioBlock("Original", originalData, project.originalMimeType || project.mimeType, project.name);
    const processed = processedData
      ? audioBlock("Processada", processedData, project.processedMimeType || "audio/wav", project.name)
      : "<small>Processada: ainda não existe.</small>";
    const brief = project.productionBrief ? `<small class="effect-note">Intenção do produtor: ${escapeHtml(project.productionBrief)}</small>` : "";
    const legacyNotice = !project.originalAudioData && processedData
      ? '<small class="effect-note">Take histórica: o original separado não está disponível nesta versão.</small>'
      : "";
    const processingState = project.processing?.state || "IDLE";
    const processingActive = processingState === PRODUCTION_STATES.PREPARING || processingState === PRODUCTION_STATES.ARRANGING || processingState === PRODUCTION_STATES.MIXING;
    const process = processingActive
      ? `<button class="mini-button" type="button" data-cancel-process-id="${escapeHtml(project.id)}">Cancelar produção</button>`
      : originalData && !String(project.status).includes("simulado")
        ? `<button class="mini-button" type="button" data-process-id="${escapeHtml(project.id)}">${processingState === PRODUCTION_STATES.FAILED || processingState === PRODUCTION_STATES.CANCELLED ? "Tentar Producer Plan novamente" : "Aplicar Producer Plan local"}</button>`
        : "";
    const gain = originalData && !project.effectApplied
      ? `<button class="mini-button" type="button" data-gain-id="${escapeHtml(project.id)}">Ganho +3 dB real</button>`
      : "";
    const fade = originalData && !project.fadeApplied
      ? `<button class="mini-button" type="button" data-fade-id="${escapeHtml(project.id)}">Fade in/out real</button>`
      : "";
    const normalize = originalData && !project.normalizeApplied
      ? `<button class="mini-button" type="button" data-normalize-id="${escapeHtml(project.id)}">Normalizar 0.95</button>`
      : "";
    const compressor = originalData && !project.compressorApplied
      ? `<button class="mini-button" type="button" data-compressor-id="${escapeHtml(project.id)}">Compressor local</button>`
      : "";
    const vocalEnhancement = originalData && !project.vocalEnhancementApplied
      ? `<button class="mini-button" type="button" data-vocal-enhance-id="${escapeHtml(project.id)}">Melhorar voz</button>`
      : "";
    const resetEffects = processedData
      ? `<button class="mini-button" type="button" data-reset-effects-id="${escapeHtml(project.id)}">Repor original</button>`
      : "";
    return `<div class="project"><div class="project-content"><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(project.preset)} · ${escapeHtml(project.genre || "Demo vocal")} · ${escapeHtml(project.durationLabel || "duração não registada")} · ${escapeHtml(project.createdAt)}</small><div class="project-audio-stack">${original}${processed}${legacyNotice}${brief}</div><div class="project-actions">${gain}${fade}${normalize}${compressor}${vocalEnhancement}${resetEffects}${process}<button class="mini-button danger" type="button" data-delete-id="${escapeHtml(project.id)}">Apagar</button></div></div><span class="pill">${escapeHtml(project.status)}</span></div>`;
    }).join("");
  renderTimeline();
}
async function saveRecording({ blob, mimeType, seconds }) {
  const name = nameInput.value.trim() || `Take ${String(readProjects().length + 1).padStart(2, "0")}`;
  const originalAudioData = await blobToDataUrl(blob);
  const projectId = makeProjectId();
  const project = normalizeProject({
    id: projectId,
    name,
    tempo: 100,
    key: "C",
    preset: presetInput.value,
    genre: genreInput.value,
    productionBrief: productionBriefInput?.value.trim() || "",
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
  });
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
  if (productionBriefInput) productionBriefInput.value = "";
}

async function applyLocalEffect(id, effectName, processor, successMessage) {
  const project = readProjects().find((item) => item.id === id);
  const sourceData = project?.processedAudioData || project?.originalAudioData || project?.audioData;
  if (!project || !sourceData || project[effectName]) return;
  try {
    showToast(`A aplicar ${effectName === "effectApplied" ? "ganho local de +3 dB" : "fade in/out local"} e a preparar WAV…`);
    const sourceBlob = await dataUrlToBlob(sourceData);
    const processedBlob = await processor(sourceBlob);
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "falha desconhecida";
    console.error("Efeito local falhou", error);
    showToast(`Não foi possível aplicar o efeito local (${message}). O original continua preservado.`);
  }
}

function applyLocalGain(id) {
  return applyLocalEffect(id, "effectApplied", applyGain, "Ganho +3 dB aplicado localmente. Original e processada estão separados.");
}

function applyLocalFade(id) {
  return applyLocalEffect(id, "fadeApplied", applyFade, "Fade in/out aplicado localmente. Original e processada estão separados.");
}
function applyLocalNormalize(id) {
  return applyLocalEffect(id, "normalizeApplied", applyNormalize, "Normalização local aplicada com headroom. Original preservado.");
}
function applyLocalCompressor(id) {
  return applyLocalEffect(id, "compressorApplied", applyCompressor, "Compressor local aplicado. Original e processada estão separados.");
}
function applyLocalVocalEnhancement(id) {
  return applyLocalEffect(id, "vocalEnhancementApplied", applyVocalEnhancement, "Melhoria vocal local aplicada. O original continua preservado.");
}

async function resetEffects(id) {
  const project = readProjects().find((item) => item.id === id);
  if (!project?.processedAudioData) return;
  const updated = readProjects().map((item) => item.id === id ? {
    ...item,
    processedAudioData: null,
    processedMimeType: null,
    processedBytes: 0,
    effectApplied: null,
    fadeApplied: null,
    normalizeApplied: null,
    compressorApplied: null,
    status: "Original recuperado",
  } : item);
  saveProjects(updated);
  try {
    if (await indexedDbAvailable()) await resetProjectEffects(id);
  } catch {
    showToast("O original foi reposto localmente; a limpeza IndexedDB será tentada novamente.");
  }
  renderProjects();
  await refreshStorageStatus();
  showToast("Original recuperado; nenhum áudio guardado foi apagado.");
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
  const cancelProcessButton = event.target.closest("[data-cancel-process-id]");
  const gainButton = event.target.closest("[data-gain-id]");
  const fadeButton = event.target.closest("[data-fade-id]");
  const normalizeButton = event.target.closest("[data-normalize-id]");
  const compressorButton = event.target.closest("[data-compressor-id]");
  const vocalEnhancementButton = event.target.closest("[data-vocal-enhance-id]");
  const resetEffectsButton = event.target.closest("[data-reset-effects-id]");
  if (deleteButton) deleteProject(deleteButton.dataset.deleteId);
  if (processButton) runProducerPlan(processButton.dataset.processId);
  if (cancelProcessButton) cancelProducerPlan(cancelProcessButton.dataset.cancelProcessId);
  if (gainButton) applyLocalGain(gainButton.dataset.gainId);
  if (fadeButton) applyLocalFade(fadeButton.dataset.fadeId);
  if (normalizeButton) applyLocalNormalize(normalizeButton.dataset.normalizeId);
  if (compressorButton) applyLocalCompressor(compressorButton.dataset.compressorId);
  if (vocalEnhancementButton) applyLocalVocalEnhancement(vocalEnhancementButton.dataset.vocalEnhanceId);
  if (resetEffectsButton) resetEffects(resetEffectsButton.dataset.resetEffectsId);
});

mixerTracks?.addEventListener("input", (event) => {
  const control = event.target.closest("[data-mixer-field]");
  const trackNode = event.target.closest("[data-mixer-track]");
  if (!control || !trackNode || !timelineHistory) return;
  const field = control.dataset.mixerField;
  if (field !== "volume" && field !== "pan") return;
  const rawValue = Number(control.value);
  const value = field === "volume" ? dbToLinear(rawValue) : rawValue;
  const output = trackNode.querySelector(`[data-mixer-output="${field}"]`);
  if (output) output.textContent = field === "volume" ? formatGainDb(value) : value.toFixed(2);
  const trackId = trackNode.dataset.mixerTrack;
  const track = timelineHistory.present.tracks.find((item) => item.id === trackId);
  if (!track) return;
  const next = updateTrack(timelineHistory.present, trackId, { [field]: field === "volume" ? Math.max(0, Math.min(2, value)) : Math.max(-1, Math.min(1, value)) });
  commitTimelineProject(next);
});
mixerTracks?.addEventListener("click", (event) => {
  const control = event.target.closest("[data-mixer-field]");
  const trackNode = event.target.closest("[data-mixer-track]");
  if (!control || !trackNode || !timelineHistory) return;
  const field = control.dataset.mixerField;
  if (field !== "muted" && field !== "solo") return;
  const trackId = trackNode.dataset.mixerTrack;
  const track = timelineHistory.present.tracks.find((item) => item.id === trackId);
  if (track) commitTimelineProject(updateTrack(timelineHistory.present, trackId, { [field]: !track[field] }));
});

timelineGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || !timelineHistory) return;
  const [trackId, clipId] = (button.dataset.clipKey || button.dataset.duplicateClip || button.dataset.deleteClip || "").split(":");
  if (!trackId || !clipId) return;
  const actionName = button.dataset.clipAction;
  let next = timelineHistory.present;
  if (button.dataset.duplicateClip) next = duplicateClip(next, trackId, clipId);
  else if (button.dataset.deleteClip) next = deleteClip(next, trackId, clipId);
  else if (actionName === "move-left" || actionName === "move-right") {
    const clip = timelineHistory.present.tracks.flatMap((track) => track.clips).find((item) => item.id === clipId);
    next = moveClip(next, trackId, clipId, (clip?.start || 0) + (actionName === "move-right" ? 1 : -1));
  } else if (actionName === "trim") {
    const clip = timelineHistory.present.tracks.flatMap((track) => track.clips).find((item) => item.id === clipId);
    next = trimClip(next, trackId, clipId, Math.min(0.5, Math.max(0, (clip?.duration || 1) - 0.1)), Math.max(0.1, (clip?.duration || 1) - 0.5));
  } else if (actionName === "split") {
    const clip = timelineHistory.present.tracks.flatMap((track) => track.clips).find((item) => item.id === clipId);
    if (clip) next = splitClip(next, trackId, clipId, clip.start + clip.duration / 2);
  } else if (actionName === "shorter" || actionName === "longer") {
    const clip = timelineHistory.present.tracks.flatMap((track) => track.clips).find((item) => item.id === clipId);
    if (clip) next = trimClip(next, trackId, clipId, 0, Math.max(0.1, clip.duration + (actionName === "longer" ? 0.5 : -0.5)));
  } else if (actionName === "fade") {
    const clip = timelineHistory.present.tracks.flatMap((track) => track.clips).find((item) => item.id === clipId);
    if (clip) next = setClipFade(next, trackId, clipId, Math.min(clip.duration / 2, clip.fadeIn + 0.1), Math.min(clip.duration / 2, clip.fadeOut + 0.1));
  } else if (actionName === "gain") {
    const clip = timelineHistory.present.tracks.flatMap((track) => track.clips).find((item) => item.id === clipId);
    if (clip) next = setClipGain(next, trackId, clipId, Math.min(2, clip.gain + 0.1));
  } else return;
  commitTimelineProject(next);
});
timelineMixdownButton?.addEventListener("click", () => { mixdownActiveTimeline(); });

addTrackButton?.addEventListener("click", () => {
  const project = currentTimelineProject();
  if (!project || !timelineHistory) return showToast("Grava primeiro uma take para criar tracks.");
  const name = window.prompt("Nome da nova track", `Track ${timelineHistory.present.tracks.length + 1}`)?.trim();
  if (name) commitTimelineProject(addTrack(timelineHistory.present, { name, type: "audio" }));
});
timelineUndoButton?.addEventListener("click", () => {
  if (!timelineHistory || !canUndo(timelineHistory)) return;
  timelineHistory = undoHistory(timelineHistory);
  saveProjects(readProjects().map((project) => project.id === activeTimelineId ? timelineHistory.present : project));
  renderProjects();
});
timelineRedoButton?.addEventListener("click", () => {
  if (!timelineHistory || !canRedo(timelineHistory)) return;
  timelineHistory = redoHistory(timelineHistory);
  saveProjects(readProjects().map((project) => project.id === activeTimelineId ? timelineHistory.present : project));
  renderProjects();
});
projectTempo?.addEventListener("change", () => {
  if (!timelineHistory) return;
  const tempo = Math.max(40, Math.min(240, Number(projectTempo.value) || 100));
  commitTimelineProject({ ...timelineHistory.present, tempo });
});
projectKey?.addEventListener("change", () => {
  if (!timelineHistory) return;
  commitTimelineProject({ ...timelineHistory.present, key: projectKey.value });
});
function playTimeline() {
  const project = currentTimelineProject();
  if (!project || !timelineHistory) return showToast("Grava primeiro uma take para reproduzir a sessão.");
  if (transportState.position >= transportState.duration) transportState = stopTransport(transportState);
  transportState = startTransport(transportState);
  transportBasePosition = transportState.position;
  transportStartedAt = performance.now();
  scheduleTimelineAudio(project, transportState.position);
  updateTransportUI();
  window.cancelAnimationFrame(transportFrame);
  transportFrame = window.requestAnimationFrame(transportTick);
}
function pauseTimeline() {
  if (transportState.status !== TRANSPORT_STATES.PLAYING) return;
  transportState = advanceTransport({ ...transportState, position: transportBasePosition }, (performance.now() - transportStartedAt) / 1000);
  transportState = pauseTransport(transportState);
  window.cancelAnimationFrame(transportFrame);
  transportFrame = null;
  stopTransportAudio();
  updateTransportUI();
}
function stopTimeline() {
  window.cancelAnimationFrame(transportFrame);
  transportFrame = null;
  stopTransportAudio();
  transportState = stopTransport(transportState);
  updateTransportUI();
}
transportBeginning?.addEventListener("click", stopTimeline);
transportPlay?.addEventListener("click", playTimeline);
transportPause?.addEventListener("click", pauseTimeline);
transportStop?.addEventListener("click", stopTimeline);
keyboardNotes?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-note]");
  if (!button) return;
  flashControl(button);
  try { await playNote(button.dataset.note); } catch (error) { showToast(error.message); }
});
playChordButton?.addEventListener("click", async () => {
  try { await playChord(chordSelect?.value || "C"); } catch (error) { showToast(error.message); }
});
addChordTimeline?.addEventListener("click", () => {
  insertInstrumentClip({ name: `Piano · ${chordSelect?.value || "C"}`, type: "instrument", metadata: { instrument: "piano", chord: chordSelect?.value || "C" } });
});
guitarChords?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-guitar-chord]");
  if (!button) return;
  flashControl(button);
  try { await playChord(button.dataset.guitarChord, { type: "triangle", duration: 0.65, volume: 0.1, instrument: "guitar" }); } catch (error) { showToast(error.message); }
});
extraInstruments?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-extra-instrument]");
  if (!button) return;
  const instrument = button.dataset.extraInstrument;
  const chord = button.dataset.extraChord || "C";
  flashControl(button);
  try {
    await playChord(chord, { duration: instrument === "strings" ? 0.9 : 0.7, volume: instrument === "strings" ? 0.08 : 0.07, instrument });
    insertInstrumentClip({ name: `${instrument === "strings" ? "Cordas" : "Synth Pad"} · ${chord}`, type: "instrument", duration: instrument === "strings" ? 1.2 : 0.9, metadata: { instrument, chord } });
    showToast(`${instrument === "strings" ? "Cordas" : "Synth Pad"} preparado localmente.`);
  } catch (error) { showToast(error.message); }
});
addGuitarTimeline?.addEventListener("click", () => {
  insertInstrumentClip({ name: `Guitarra · ${chordSelect?.value || "C"}`, type: "guitar", metadata: { instrument: "guitar", chord: chordSelect?.value || "C" } });
});
function resetBeatGrid() {
  beatGrid?.querySelectorAll(".beat-step.is-active").forEach((button) => button.classList.remove("is-active"));
}
function applyBeatGridPreset(name = beatPreset?.value || "Afrobeat") {
  const preset = getBeatPreset(name);
  resetBeatGrid();
  Object.entries(preset.channels).forEach(([channel, steps]) => steps.forEach((step) => {
    beatGrid?.querySelector(`[data-beat-channel="${channel}"][data-beat-step="${step}"]`)?.classList.add("is-active");
  }));
  if (projectTempo) projectTempo.value = String(preset.bpm);
  return preset;
}
applyBeatPreset?.addEventListener("click", () => {
  const preset = applyBeatGridPreset();
  showToast(`Preset ${preset.name} aplicado a ${preset.bpm} BPM.`);
});
resetBeat?.addEventListener("click", () => {
  resetBeatGrid();
  showToast("Beat Maker reposto sem alterar as gravações.");
});
addBeatTimeline?.addEventListener("click", () => {
  const preset = getBeatPreset(beatPreset?.value || "Afrobeat");
  insertInstrumentClip({ name: `Beat · ${preset.name}`, type: "drums", duration: 8, metadata: { instrument: "drums", preset: preset.name, bpm: preset.bpm, channels: preset.channels } });
});
playBeatSequence?.addEventListener("click", async () => {
  const preset = getBeatPreset(beatPreset?.value || "Afrobeat");
  const channels = Object.fromEntries(["kick", "snare", "clap", "hihat", "percussion", "bass"].map((channel) => [
    channel,
    [...(beatGrid?.querySelectorAll(`[data-beat-channel="${channel}"].is-active`) || [])].map((button) => Number(button.dataset.beatStep)),
  ]));
  const sequence = createGridEvents({ channels, bpm: Number(projectTempo?.value) || preset.bpm });
  try {
    const result = await playSequence(sequence);
    showToast(`${preset.name}: ${result.steps} eventos do grid reproduzidos localmente.`);
  } catch (error) { showToast(error.message); }
});
beatGrid?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-beat-channel]");
  if (!button) return;
  button.classList.toggle("is-active");
  const channel = button.dataset.beatChannel;
  flashControl(button);
  try { await playDrumHit(channel, { velocity: channel === "hihat" ? 0.72 : 0.9 }); } catch (error) { showToast(error.message); }
});
pianoRoll?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-piano-note]");
  if (!button) return;
  button.classList.toggle("is-active");
  flashControl(button);
  try { await playNote(button.dataset.pianoNote, { type: "triangle", duration: 0.28, volume: 0.11 }); } catch (error) { showToast(error.message); }
});
playPatternButton?.addEventListener("click", async () => {
  try {
    const result = await playPattern(patternSelect?.value || "Afrobeat", { bpm: Number(projectTempo?.value) || 100 });
    showToast(`${patternSelect?.value || "Groove"}: ${result.steps} eventos locais agendados.`);
  } catch (error) { showToast(error.message); }
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
refreshTransportProject();
refreshStorageStatus();
migrateLocalStorageProjects().then((result) => {
  if (result.migrated) refreshStorageStatus();
}).catch(() => {});
