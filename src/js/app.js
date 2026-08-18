import { blobToDataUrl, dataUrlToBlob, escapeHtml, getFileExtension, makeProjectId, readProjects, saveProjects } from "./storage.js";
import { bindPlayerEvents } from "./player.js";
import { buildProducerPlan, producerPlanClipSpecs, applyProducerMix } from "./producer-plan.js";
import { analyzeAudioDataUrl } from "./audio-analysis.js";
import { applyAutoTuneLocal, autoTuneParameters, autoTuneCorrectionFromPitch, detectPitchNotes, applyCompressor, applyFade, applyGain, applyNormalize, applyPitchCorrectionAssist, applyVocalEnhancement, applyReverbLocal, applyDelayLocal, spatialEffectParameters } from "./effects.js";
import { createRecorderController } from "./recorder.js";
import { addClip, addTrack, normalizeProject, updateTrack } from "./studio/project-model.js";
import { createHistoryState, canRedo, canUndo, commitHistory, redoHistory, undoHistory } from "./studio/history.js";
import { deleteClip, duplicateClip, moveClip, setClipFade, setClipGain, splitClip, trimClip } from "./studio/timeline.js";
import { playChord, playDrumHit, playNote, playPattern, playSequence } from "./studio/audio-engine.js";
import { createGridEvents } from "./studio/sequencer.js";
import { getBeatPreset } from "./studio/instruments.js";
import { SOUND_LIBRARY, getSoundLibraryItem, soundLibraryClip } from "./studio/sound-library.js";
import { isInstrumentClip } from "./studio/instrument-renderer.js";
import { renderTimelineToWav } from "./studio/mixdown.js";
import { createProjectManifest, downloadBlob, mixedExportFilename, projectManifestFilename } from "./export-audio.js";
import { deriveProducerStudioState } from "./producer-studio-flow.js";
import { ACTION_FEEDBACK_STATES, actionFeedbackLabel, transitionActionFeedback } from "./action-feedback.js";
import { materializeProducerPlan, trackOrigin } from "./producer-arrangement.js";
import { requestProductionAdvice } from "./ai-producer-client.js";
import { isFirebaseSignedIn, listCloudProjects, saveCloudProject, cloudProjectToLocal } from "./firebase-projects.js";
import { adviceToProducerPlan } from "./ai-advice-to-plan.js";
import { createImportedBeat, revokeImportedBeat } from "./beat-import.js";
import { loadEffectPresets, saveEffectPreset, deleteEffectPreset, isBuiltInEffectPreset } from "./effect-presets.js";
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
  deleteAudioBlob,
  deleteProjectData,
  estimateStorageUsage,
  indexedDbAvailable,
  getAudioBlob,
  getBeatBlob,
  migrateLocalStorageProjects,
  putAudioBlob,
  putBeatBlob,
  putEffect,
  getPitchEdits,
  putPitchEdits,
  deletePitchEdits,
  deleteEffect,
  putProject,
  putTake,
  resetProjectEffects,
} from "./indexeddb-storage.js";

const heroRecord = document.getElementById("hero-record");
const mainRecord = document.getElementById("record-main");
const timer = document.getElementById("timer");
const recordLabel = document.getElementById("record-label");
const list = document.getElementById("project-list");
const recentProjects = document.getElementById("studio-recent-projects");
const nameInput = document.getElementById("project-name");
const presetInput = document.getElementById("preset");
const genreInput = document.getElementById("genre");
const productionBriefInput = document.getElementById("production-brief");
const toast = document.getElementById("toast");
const storageStatus = document.getElementById("storage-status");
const clearStorageButton = document.getElementById("clear-local-storage");
const syncCloudProjectsButton = document.getElementById("sync-cloud-projects");
const saveCloudProjectButton = document.getElementById("save-cloud-project");
const cloudSyncStatus = document.getElementById("cloud-sync-status");
const timelineGrid = document.getElementById("timeline-grid");
const mixerTracks = document.getElementById("mixer-tracks");
const mixerInspector = document.getElementById("mixer-inspector");
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
const playPianoSequence = document.getElementById("play-piano-sequence");
const addPianoTimeline = document.getElementById("add-piano-timeline");
const pianoRollStatus = document.getElementById("piano-roll-status");
const beatGrid = document.getElementById("beat-grid");
const soundLibraryGrid = document.getElementById("sound-library-grid");
const soundLibraryStatus = document.getElementById("sound-library-status");
const beatPreset = document.getElementById("beat-preset");
const applyBeatPreset = document.getElementById("apply-beat-preset");
const playBeatSequence = document.getElementById("play-beat-sequence");
const resetBeat = document.getElementById("reset-beat");
const addChordTimeline = document.getElementById("add-chord-timeline");
const addGuitarTimeline = document.getElementById("add-guitar-timeline");
const addBeatTimeline = document.getElementById("add-beat-timeline");
const producerStudioEmpty = document.getElementById("producer-studio-empty");
const producerStudioContent = document.getElementById("producer-studio-content");
const producerAnalysisTitle = document.getElementById("producer-analysis-title");
const producerBpm = document.getElementById("producer-bpm");
const producerKey = document.getElementById("producer-key");
const producerConfidence = document.getElementById("producer-confidence");
const producerBpmInput = document.getElementById("producer-bpm-input");
const producerKeyInput = document.getElementById("producer-key-input");
const producerGenre = document.getElementById("producer-genre");
const producerBriefPreview = document.getElementById("producer-brief-preview");
const producerRunPlan = document.getElementById("producer-run-plan");
const producerRequestAi = document.getElementById("producer-request-ai");
const producerAiStatus = document.getElementById("producer-ai-status");
const producerSaveAnalysis = document.getElementById("producer-save-analysis");
const producerPlanStatus = document.getElementById("producer-plan-status");
const producerVocalStatus = document.getElementById("producer-vocal-status");
const producerMixStatus = document.getElementById("producer-mix-status");
const producerFinalStatus = document.getElementById("producer-final-status");
const producerAbOriginal = document.getElementById("producer-ab-original");
const producerAbMixed = document.getElementById("producer-ab-mixed");
const producerBypass = document.getElementById("producer-bypass");
const producerBypassAutoTune = document.getElementById("producer-bypass-autotune");
const producerBypassReverb = document.getElementById("producer-bypass-reverb");
const producerBypassDelay = document.getElementById("producer-bypass-delay");
const producerMeterA = document.getElementById("producer-meter-a");
const producerMeterB = document.getElementById("producer-meter-b");
const producerMeterABar = document.getElementById("producer-meter-a-bar");
const producerMeterBBar = document.getElementById("producer-meter-b-bar");
const producerPresetName = document.getElementById("producer-preset-name");
const producerSavePreset = document.getElementById("producer-save-preset");
const producerPresetSelect = document.getElementById("producer-preset-select");
const producerDeletePreset = document.getElementById("producer-delete-preset");
const producerPresetStatus = document.getElementById("producer-preset-status");
const producerExport = document.getElementById("producer-export");
const producerExportProject = document.getElementById("producer-export-project");
const producerActionFeedback = document.getElementById("producer-action-feedback");
const producerBeatFile = document.getElementById("producer-beat-file");
const producerBeatPreview = document.getElementById("producer-beat-preview");
const producerVocalBeatMix = document.getElementById("producer-vocal-beat-mix");
const producerBeatStatus = document.getElementById("producer-beat-status");
const producerBeatAudio = document.getElementById("producer-beat-audio");
const producerVocalWaveform = document.getElementById("producer-vocal-waveform");
const producerBeatWaveform = document.getElementById("producer-beat-waveform");
const producerVocalWaveformStatus = document.getElementById("producer-vocal-waveform-status");
const producerBeatWaveformStatus = document.getElementById("producer-beat-waveform-status");
const producerAutoTuneRoot = document.getElementById("producer-autotune-root");
const producerAutoTuneScale = document.getElementById("producer-autotune-scale");
const producerAnalyzePitch = document.getElementById("producer-analyze-pitch");
const producerPitchStatus = document.getElementById("producer-pitch-status");
const producerAutoTuneIntensity = document.getElementById("producer-autotune-intensity");
const producerAutoTuneValue = document.getElementById("producer-autotune-value");
const producerApplyAutoTune = document.getElementById("producer-apply-autotune");
const producerResetAutoTune = document.getElementById("producer-reset-autotune");
const producerAutoTuneStatus = document.getElementById("producer-autotune-status");
const producerPitchCurve = document.getElementById("producer-pitch-curve");
const producerPitchCurveStatus = document.getElementById("producer-pitch-curve-status");
const producerPitchNotes = document.getElementById("producer-pitch-notes");
const producerShare = document.getElementById("producer-share");
const producerReverbIntensity = document.getElementById("producer-reverb-intensity");
const producerReverbValue = document.getElementById("producer-reverb-value");
const producerDelayIntensity = document.getElementById("producer-delay-intensity");
const producerDelayValue = document.getElementById("producer-delay-value");
const producerApplySpace = document.getElementById("producer-apply-space");
const producerResetSpace = document.getElementById("producer-reset-space");
const producerPitchZoomIn = document.getElementById("producer-pitch-zoom-in");
const producerPitchZoomOut = document.getElementById("producer-pitch-zoom-out");
const producerPitchPanReset = document.getElementById("producer-pitch-pan-reset");
const producerPitchZoomStatus = document.getElementById("producer-pitch-zoom-status");
let importedBeatObjectUrl = null;
let activePitchAnalysis = null;
let activePitchNotes = [];
let pitchCurveZoom = 1;
let pitchCurvePan = 0;
let pitchCurveDrag = null;
let activeTimelineId = null;
let timelineHistory = null;
let selectedMixerTrackId = null;
let transportTimers = [];
let transportFrame = null;
let transportState = createTransportState(0);
let transportStartedAt = 0;
let transportBasePosition = 0;
let transportAudio = [];
const linearToDb = (value) => value <= 0.001 ? -60 : 20 * Math.log10(value);
const dbToLinear = (value) => value <= -60 ? 0 : Math.pow(10, value / 20);
const formatGainDb = (value) => value <= 0.001 ? "−∞ dB" : `${linearToDb(value).toFixed(1)} dB`;
const VOCAL_VARIANTS = {
  original: { label: "Original", kind: "original" },
  enhanced: { label: "Enhanced", kind: "enhanced" },
  pitchCorrected: { label: "Pitch Corrected", kind: "pitch-corrected" },
  mixed: { label: "Mixed", kind: "mixed" },
};
function canonicalVariant(variant) {
  return variant === "pitch-corrected" ? "pitchCorrected" : variant;
}
function getVariantData(project, variant) {
  if (!project) return "";
  const key = canonicalVariant(variant);
  if (key === "original") return project.originalAudioData || (!project.processedAudioData ? project.audioData : "") || "";
  return project.audioVariants?.[key]?.data || (key === "processed" ? project.processedAudioData || ((project.effectApplied || project.fadeApplied) ? project.audioData : "") : "") || "";
}
function getVariantMime(project, variant) {
  if (canonicalVariant(variant) === "original") return project?.originalMimeType || project?.mimeType || "audio/webm";
  const key = canonicalVariant(variant);
  return project?.audioVariants?.[key]?.mimeType || (key === "processed" ? project?.processedMimeType : "audio/wav") || "audio/wav";
}
function variantFromBlobKey(blobKey) {
  const kind = String(blobKey || "").split(":").pop();
  return Object.values(VOCAL_VARIANTS).some((item) => item.kind === kind) ? kind : kind === "processed" ? "processed" : "original";
}
function blobKindForVariant(variant) {
  const key = canonicalVariant(variant);
  return VOCAL_VARIANTS[key]?.kind || (key === "processed" ? "processed" : "original");
}
if (pianoRoll) {
  pianoRoll.innerHTML = Array.from({ length: 16 }, (_, index) => `<button class="piano-step" type="button" data-piano-note="${index % 8 === 0 ? "C4" : index % 8 === 2 ? "E4" : index % 8 === 4 ? "G4" : "C5"}" data-piano-step="${index}" aria-label="Passo ${index + 1}">${index + 1}</button>`).join("");
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

let producerPreviewAudio = null;
let producerBypassActive = false;
let effectBypassState = { autoTune: false, reverb: false, delay: false };
let activePresetId = "";
let producerActionStates = { ab: ACTION_FEEDBACK_STATES.IDLE, export: ACTION_FEEDBACK_STATES.IDLE };

function setProducerActionFeedback(action, event, message = "") {
  producerActionStates = { ...producerActionStates, [action]: transitionActionFeedback(producerActionStates[action], event) };
  const state = producerActionStates[action];
  const label = message || actionFeedbackLabel(action, state);
  if (producerActionFeedback) {
    producerActionFeedback.textContent = label;
    producerActionFeedback.dataset.state = state;
    producerActionFeedback.dataset.action = action;
  }
  const buttons = action === "ab" ? [producerAbOriginal, producerAbMixed] : [producerExport];
  buttons.forEach((button) => {
    if (!button) return;
    button.classList.toggle("is-busy", state === ACTION_FEEDBACK_STATES.LOADING);
    button.classList.toggle("is-success", state === ACTION_FEEDBACK_STATES.SUCCESS);
    button.classList.toggle("is-error", state === ACTION_FEEDBACK_STATES.ERROR);
    button.setAttribute("aria-busy", String(state === ACTION_FEEDBACK_STATES.LOADING));
  });
}

function updateProducerBypassUI(hasMixed = Boolean(getVariantData(currentTimelineProject(), "mixed"))) {
  if (!producerBypass) return;
  producerBypass.disabled = !hasMixed;
  producerBypass.classList.toggle("is-active", producerBypassActive && hasMixed);
  producerBypass.setAttribute("aria-pressed", String(producerBypassActive && hasMixed));
  producerBypass.textContent = producerBypassActive ? "Bypass activo: Original" : "Bypass: Original";
}

async function playProducerPreview(variant) {
  const project = currentTimelineProject();
  producerBypassActive = variant === "original";
  updateProducerBypassUI(Boolean(getVariantData(project, "mixed")));
  const data = getVariantData(project, variant);
  setProducerActionFeedback("ab", "start", variant === "mixed" ? "A preparar Mixed…" : "A preparar Original…");
  if (!data) {
    setProducerActionFeedback("ab", "error", `${variant === "mixed" ? "Mixed" : "Original"} ainda não disponível.`);
    showToast(`${variant === "mixed" ? "Mixed" : "Original"} ainda não disponível.`);
    return;
  }
  producerPreviewAudio?.pause();
  producerPreviewAudio = new Audio(data);
  producerPreviewAudio.playsInline = true;
  producerPreviewAudio.onended = () => { producerPreviewAudio = null; setProducerActionFeedback("ab", "reset"); };
  try {
    await producerPreviewAudio.play();
    setProducerActionFeedback("ab", "success", `${variant === "mixed" ? "Mixed" : "Original"} em reprodução`);
  } catch (error) {
    console.error("Pré-escuta A/B falhou", error);
    setProducerActionFeedback("ab", "error", "O navegador bloqueou a pré-escuta. Toca novamente para tentar.");
    showToast("O navegador bloqueou a pré-escuta. Toca novamente para tentar.");
  }
}

function updateIndividualBypassUI() {
  const controls = [[producerBypassAutoTune, "autoTune", "Auto-Tune"], [producerBypassReverb, "reverb", "Reverb"], [producerBypassDelay, "delay", "Delay"]];
  controls.forEach(([button, key, label]) => {
    if (!button) return;
    const bypassed = effectBypassState[key];
    button.setAttribute("aria-pressed", String(bypassed));
    button.classList.toggle("is-active", bypassed);
    button.textContent = bypassed ? `${label} bypass` : `${label} activo`;
  });
}

function updateEffectPresetOptions() {
  if (!producerPresetSelect) return;
  const project = currentTimelineProject();
  if (!activePresetId && project?.activeEffectPresetId) activePresetId = project.activeEffectPresetId;
  const presets = loadEffectPresets();
  producerPresetSelect.innerHTML = `<option value="">Escolher…</option>${presets.map((preset) => `<option value="${escapeHtml(preset.id)}">${escapeHtml(preset.name)}${preset.builtIn ? " · base" : ""}</option>`).join("")}`;
  producerPresetSelect.value = activePresetId;
  const selected = presets.find((item) => item.id === activePresetId);
  if (selected && project && !project._activePresetHydrated) {
    project._activePresetHydrated = true;
    applyEffectPreset(selected, { persist: false });
  }
  if (producerDeletePreset) producerDeletePreset.disabled = !activePresetId || isBuiltInEffectPreset(activePresetId);
}

async function persistActivePreset(projectId, presetId) {
  if (!projectId) return;
  const updated = readProjects().map((item) => item.id === projectId ? { ...item, activeEffectPresetId: presetId || "", activeEffectPreset: currentEffectPreset(), audioSettings: { autoTune: currentEffectPreset().autoTune, reverb: currentEffectPreset().reverb, delay: currentEffectPreset().delay } } : item);
  saveProjects(updated);
  const project = updated.find((item) => item.id === projectId);
  try { if (project && await indexedDbAvailable()) await putProject(project); } catch { /* fallback local já está guardado */ }
}

function currentEffectPreset() {
  return {
    name: producerPresetName?.value || "Predefinição sem nome",
    autoTune: { intensity: producerAutoTuneIntensity?.value, root: producerAutoTuneRoot?.value, scale: producerAutoTuneScale?.value, bypass: effectBypassState.autoTune },
    reverb: { intensity: producerReverbIntensity?.value, bypass: effectBypassState.reverb },
    delay: { intensity: producerDelayIntensity?.value, bypass: effectBypassState.delay },
  };
}

function applyEffectPreset(preset, { persist = true } = {}) {
  if (!preset) return;
  if (producerAutoTuneIntensity) producerAutoTuneIntensity.value = preset.autoTune.intensity;
  if (producerAutoTuneValue) producerAutoTuneValue.textContent = `${preset.autoTune.intensity}%`;
  if (producerAutoTuneRoot) producerAutoTuneRoot.value = preset.autoTune.root;
  if (producerAutoTuneScale) producerAutoTuneScale.value = preset.autoTune.scale;
  if (producerReverbIntensity) producerReverbIntensity.value = preset.reverb.intensity;
  if (producerReverbValue) producerReverbValue.textContent = `${preset.reverb.intensity}%`;
  if (producerDelayIntensity) producerDelayIntensity.value = preset.delay.intensity;
  if (producerDelayValue) producerDelayValue.textContent = `${preset.delay.intensity}%`;
  effectBypassState = { autoTune: preset.autoTune.bypass, reverb: preset.reverb.bypass, delay: preset.delay.bypass };
  updateIndividualBypassUI();
  if (producerPresetStatus) producerPresetStatus.textContent = `Predefinição “${preset.name}” aplicada.`;
  if (persist) {
    activePresetId = preset.id;
    const project = currentTimelineProject();
    if (project) persistActivePreset(project.id, preset.id);
  }
}

async function measureAudioData(data) {
  if (!data) return null;
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = await context.decodeAudioData(await (await fetch(data)).arrayBuffer());
    const samples = buffer.getChannelData(0);
    let peak = 0; let sum = 0;
    for (let index = 0; index < samples.length; index += Math.max(1, Math.floor(samples.length / 100000))) { const value = Math.abs(samples[index]); peak = Math.max(peak, value); sum += value * value; }
    const rms = Math.sqrt(sum / Math.max(1, Math.ceil(samples.length / Math.max(1, Math.floor(samples.length / 100000)))));
    await context.close();
    return { peakDb: linearToDb(peak), loudnessDb: linearToDb(rms) };
  } catch { return null; }
}

async function updateABMeters(project = currentTimelineProject()) {
  const cards = document.querySelectorAll(".ab-meter-card");
  cards.forEach((card) => card.classList.add("is-loading"));
  const [original, mixed] = await Promise.all([measureAudioData(getVariantData(project, "original")), measureAudioData(getVariantData(project, "mixed"))]);
  const format = (meter) => meter ? `Pico ${meter.peakDb.toFixed(1)} dB · Loudness ${meter.loudnessDb.toFixed(1)} dB` : "Pico −∞ dB · Loudness −∞ dB";
  const level = (meter) => meter ? `${Math.max(0, Math.min(100, ((meter.peakDb + 60) / 60) * 100))}%` : "0%";
  if (producerMeterA) producerMeterA.textContent = format(original);
  if (producerMeterB) producerMeterB.textContent = format(mixed);
  if (producerMeterABar) producerMeterABar.style.width = level(original);
  if (producerMeterBBar) producerMeterBBar.style.width = level(mixed);
  cards.forEach((card) => card.classList.remove("is-loading"));
}

async function exportMixedVersion(id) {
  const project = readProjects().find((item) => item.id === id);
  const mixedData = getVariantData(project, "mixed");
  setProducerActionFeedback("export", "start");
  if (!project || !mixedData) {
    setProducerActionFeedback("export", "error", "Cria primeiro o Mixed através do Mixdown local.");
    showToast("Primeiro cria o Mixed através do Mixdown local.");
    return;
  }
  try {
    const mixedBlob = await dataUrlToBlob(mixedData);
    downloadBlob(mixedBlob, mixedExportFilename(project.name));
    setProducerActionFeedback("export", "success");
    showToast("A versão Mixed foi exportada em WAV.");
  } catch (error) {
    console.error("Exportação Mixed falhou", error);
    setProducerActionFeedback("export", "error", "Não foi possível preparar o WAV. Tenta novamente.");
    showToast("Não foi possível exportar o Mixed. Tenta novamente neste navegador.");
  }
}

function currentTimelineProject() {
  const projects = readProjects();
  return projects.find((project) => project.id === activeTimelineId) || projects[0] || null;
}
async function resolveBeatBlob(project) {
  const beat = project?.importedBeat;
  if (!beat) return null;
  if (beat.storageKey && await indexedDbAvailable()) {
    const record = await getBeatBlob(project.id, beat.storageKey);
    if (record?.blob) return record.blob;
  }
  return beat.data ? dataUrlToBlob(beat.data) : null;
}

function drawWaveform(canvas, samples, color = "#62d6c7") {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const width = Math.max(160, canvas.clientWidth || 320);
  const height = canvas.height || 72;
  canvas.width = width;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,.035)";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = color;
  context.lineWidth = 1.5;
  context.beginPath();
  const step = Math.max(1, Math.floor(samples.length / width));
  for (let x = 0; x < width; x += 1) {
    let peak = 0;
    for (let index = x * step; index < Math.min(samples.length, (x + 1) * step); index += 1) peak = Math.max(peak, Math.abs(samples[index]));
    const y = height / 2 - peak * (height * 0.42);
    const y2 = height / 2 + peak * (height * 0.42);
    context.moveTo(x, y);
    context.lineTo(x, y2);
  }
  context.stroke();
}

async function drawBlobWaveform(blob, canvas, status, color) {
  if (!blob) { if (status) status.textContent = "Aguardando áudio"; return; }
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio API indisponível");
    const context = new AudioContextClass();
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    const channel = buffer.getChannelData(0);
    drawWaveform(canvas, channel, color);
    if (status) status.textContent = `${buffer.duration.toFixed(1)} s · waveform local`;
    await context.close();
  } catch (error) {
    console.warn("Waveform indisponível", error);
    if (status) status.textContent = "Pré-visualização indisponível";
  }
}

async function updateProducerBeatControls(project = currentTimelineProject()) {
  const beat = project?.importedBeat;
  const beatBlob = await resolveBeatBlob(project);
  const ready = Boolean(beat && beatBlob);
  if (producerBeatPreview) producerBeatPreview.disabled = !ready;
  if (producerApplyAutoTune) producerApplyAutoTune.disabled = !getVariantData(project, "original");
  if (producerResetAutoTune) producerResetAutoTune.disabled = !project?.audioVariants?.pitchCorrected;
  if (producerApplySpace) producerApplySpace.disabled = !getVariantData(project, "original");
  if (producerResetSpace) producerResetSpace.disabled = !project?.audioVariants?.spatial;
  if (producerExport) producerExport.disabled = !getVariantData(project, "mixed");
  if (producerExportProject) producerExportProject.disabled = !project;
  if (producerShare) producerShare.disabled = !getVariantData(project, "mixed");
  if (producerVocalBeatMix) producerVocalBeatMix.disabled = !ready || !getVariantData(project, "original");
  if (producerBeatStatus) producerBeatStatus.textContent = ready ? `${beat.name} · ${formatBytes(beat.size)} · IndexedDB dedicado` : "Nenhum beat importado.";
  if (producerBeatAudio) {
    producerBeatAudio.hidden = !ready;
    if (ready) {
      if (importedBeatObjectUrl) URL.revokeObjectURL(importedBeatObjectUrl);
      importedBeatObjectUrl = URL.createObjectURL(beatBlob);
      producerBeatAudio.src = importedBeatObjectUrl;
    }
  }
  await drawBlobWaveform(beatBlob, producerBeatWaveform, producerBeatWaveformStatus, "#62d6c7");
  await drawBlobWaveform(getVariantData(project, "original") ? await dataUrlToBlob(getVariantData(project, "original")) : null, producerVocalWaveform, producerVocalWaveformStatus, "#f06aa8");
}
async function importProducerBeat(file) {
  const project = currentTimelineProject();
  if (!project) { showToast("Grava primeiro uma take para importar um beat."); return; }
  try {
    const beat = createImportedBeat(file);
    beat.storageKey = beat.id;
    beat.data = null;
    if (await indexedDbAvailable()) await putBeatBlob(project.id, beat.storageKey, file, beat);
    const updated = readProjects().map((item) => item.id === project.id ? { ...item, importedBeat: beat, status: "Beat importado em IndexedDB" } : item);
    saveProjects(updated);
    if (importedBeatObjectUrl) URL.revokeObjectURL(importedBeatObjectUrl);
    importedBeatObjectUrl = beat.url;
    activeTimelineId = project.id;
    renderProjects();
    await refreshStorageStatus();
    showToast(`Beat “${beat.name}” importado localmente. O original vocal permanece intacto.`);
  } catch (error) {
    if (producerBeatStatus) producerBeatStatus.textContent = error instanceof Error ? error.message : "Não foi possível importar o beat.";
    showToast(error instanceof Error ? error.message : "Não foi possível importar o beat.");
  }
}
function noteLabel(midi) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const rounded = Math.round(Number(midi) || 60);
  return `${names[(rounded % 12 + 12) % 12]}${Math.floor(rounded / 12) - 1}`;
}
function pitchCurveMetrics(notes) {
  return { maxTime: Math.max(...notes.map((item) => item.time), 0.1), minMidi: Math.min(...notes.map((item) => item.midi)) - 2, maxMidi: Math.max(...notes.map((item) => item.midi)) + 2 };
}
function curvePoint(item, metrics, width, height) {
  const baseX = item.time / metrics.maxTime;
  const visibleX = (baseX * pitchCurveZoom - pitchCurvePan) / Math.max(1, pitchCurveZoom - pitchCurvePan);
  const x = visibleX * (width - 12) + 6;
  const y = height - 6 - ((item.midi - metrics.minMidi) / Math.max(1, metrics.maxMidi - metrics.minMidi)) * (height - 12);
  return { x, y };
}
function drawPitchCurve(notes = []) {
  if (!producerPitchCurve) return;
  const ctx = producerPitchCurve.getContext("2d"); const width = Math.max(240, producerPitchCurve.clientWidth || 480); const height = producerPitchCurve.height || 128;
  producerPitchCurve.width = width; ctx.clearRect(0, 0, width, height); ctx.fillStyle = "rgba(255,255,255,.035)"; ctx.fillRect(0, 0, width, height);
  if (!notes.length) { if (producerPitchCurveStatus) producerPitchCurveStatus.textContent = "Analisa o vocal para editar."; return; }
  const metrics = pitchCurveMetrics(notes);
  ctx.strokeStyle = "#f06aa8"; ctx.lineWidth = 2; ctx.beginPath();
  notes.forEach((item, index) => { const point = curvePoint(item, metrics, width, height); index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y); }); ctx.stroke();
  ctx.fillStyle = "#ffd166"; notes.forEach((item) => { const point = curvePoint(item, metrics, width, height); if (point.x < -8 || point.x > width + 8) return; ctx.beginPath(); ctx.arc(point.x, point.y, 4, 0, Math.PI * 2); ctx.fill(); });
  if (producerPitchCurveStatus) producerPitchCurveStatus.textContent = `${notes.length} pontos editáveis · zoom ${pitchCurveZoom.toFixed(1)}× · arrasta continuamente`;
  if (producerPitchZoomStatus) producerPitchZoomStatus.textContent = `Zoom ${pitchCurveZoom.toFixed(1)}× · deslocação ${Math.round(pitchCurvePan * 100)}%`;
}
function renderPitchNotes() {
  if (!producerPitchNotes) return;
  producerPitchNotes.innerHTML = activePitchNotes.length ? activePitchNotes.slice(0, 80).map((item, index) => `<label class="pitch-note"><span>${Number(item.time).toFixed(2)}s · ${noteLabel(item.midi)}</span><input data-pitch-index="${index}" type="number" min="24" max="96" step="0.01" value="${Number(item.midi).toFixed(2)}" aria-label="Nota alvo ${index + 1}" /></label>`).join("") : "<span class=\"muted\">Nenhuma nota disponível para edição.</span>";
  drawPitchCurve(activePitchNotes);
}
function editPitchFromCurve(event) {
  if (!activePitchNotes.length || !producerPitchCurve) return;
  const rect = producerPitchCurve.getBoundingClientRect(); const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left)); const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
  const metrics = pitchCurveMetrics(activePitchNotes);
  const nearest = activePitchNotes.reduce((best, item, index) => { const point = curvePoint(item, metrics, rect.width, rect.height); return Math.abs(point.x - x) < Math.abs(curvePoint(activePitchNotes[best], metrics, rect.width, rect.height).x - x) ? index : best; }, 0);
  const midi = metrics.minMidi + (1 - y / rect.height) * Math.max(1, metrics.maxMidi - metrics.minMidi);
  updateEditedPitch(nearest, midi);
}
async function updateEditedPitch(index, value) {
  const midi = Math.max(24, Math.min(96, Number(value)));
  if (!activePitchNotes[index] || !Number.isFinite(midi)) return;
  activePitchNotes[index] = { ...activePitchNotes[index], midi, note: Math.round(midi), name: noteLabel(midi), manuallyEdited: true };
  if (activePitchAnalysis) activePitchAnalysis = { ...activePitchAnalysis, notes: activePitchNotes, correction: autoTuneCorrectionFromPitch(activePitchNotes, producerAutoTuneRoot?.value || "C", producerAutoTuneScale?.value || "major") };
  const project = currentTimelineProject();
  if (project && await indexedDbAvailable()) {
    try { await putPitchEdits(project.id, activePitchNotes, { root: producerAutoTuneRoot?.value || "C", scale: producerAutoTuneScale?.value || "major" }); } catch { /* local project state remains usable */ }
  }
  renderPitchNotes();
  if (producerPitchStatus) producerPitchStatus.textContent = "Notas editadas e guardadas localmente. A análise manual será usada no próximo Auto-Tune.";
}
async function shareFinalTrack() {
  const project = currentTimelineProject(); const mixedData = getVariantData(project, "mixed");
  if (!project || !mixedData) return showToast("Cria primeiro o Mixed para partilhar a faixa final.");
  try { const blob = await dataUrlToBlob(mixedData); const file = new File([blob], mixedExportFilename(project.name), { type: "audio/wav" });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) { await navigator.share({ title: `${project.name} · Fernando Lucoco Music`, text: "Faixa final Vocal + beat", files: [file] }); showToast("Faixa partilhada através do dispositivo."); }
    else { await exportMixedVersion(project.id); showToast("Partilha directa indisponível; o WAV foi descarregado como fallback."); }
  } catch (error) { if (error?.name !== "AbortError") { console.warn("Partilha falhou", error); await exportMixedVersion(project.id); } }
}
async function analyzeProducerPitch() {
  const project = currentTimelineProject();
  const sourceData = getVariantData(project, "original");
  if (!project || !sourceData) return showToast("Grava primeiro uma take vocal.");
  if (producerAnalyzePitch) producerAnalyzePitch.disabled = true;
  if (producerPitchStatus) producerPitchStatus.textContent = "A analisar pitch nota-a-nota localmente…";
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio API indisponível neste navegador.");
    const context = new AudioContextClass();
    const buffer = await context.decodeAudioData((await dataUrlToBlob(sourceData)).arrayBuffer());
    const notes = detectPitchNotes(buffer.getChannelData(0), buffer.sampleRate);
    const correction = autoTuneCorrectionFromPitch(notes, producerAutoTuneRoot?.value || "C", producerAutoTuneScale?.value || "major");
    const savedPitchEdits = await getPitchEdits(project.id).catch(() => null);
    const savedByTime = new Map((savedPitchEdits?.notes || []).map((item) => [Number(item.time).toFixed(4), item]));
    activePitchNotes = notes.map((item) => ({ ...item, ...(savedByTime.get(Number(item.time).toFixed(4)) || {}) }));
    const restoredCorrection = autoTuneCorrectionFromPitch(activePitchNotes, producerAutoTuneRoot?.value || "C", producerAutoTuneScale?.value || "major");
    activePitchAnalysis = { notes: activePitchNotes, correction: restoredCorrection, sampleRate: buffer.sampleRate, analyzedAt: new Date().toISOString(), restoredEdits: Boolean(savedPitchEdits) };
    const updated = readProjects().map((item) => item.id === project.id ? { ...item, pitchAnalysis: activePitchAnalysis, autoTuneKey: producerAutoTuneRoot?.value || "C", autoTuneScale: producerAutoTuneScale?.value || "major" } : item);
    saveProjects(updated);
    renderPitchNotes();
    if (producerPitchStatus) producerPitchStatus.textContent = notes.length ? `${notes.length} notas detectadas · correcção média ${correction.cents} cents · confiança ${Math.round(correction.confidence * 100)}%` : "Não foram detectadas notas com confiança suficiente.";
    if (producerAutoTuneStatus) producerAutoTuneStatus.textContent = notes.length ? "Análise pronta; podes aplicar o Auto-Tune." : "Sem pitch suficiente para correcção segura.";
    if (producerApplyAutoTune) producerApplyAutoTune.disabled = !notes.length;
    await context.close();
  } catch (error) {
    if (producerPitchStatus) producerPitchStatus.textContent = error instanceof Error ? error.message : "Não foi possível analisar o pitch.";
    showToast(error instanceof Error ? error.message : "Análise de pitch falhou.");
  } finally {
    if (producerAnalyzePitch) producerAnalyzePitch.disabled = false;
  }
}
async function applyLocalAutoTune() {
  const project = currentTimelineProject();
  const sourceData = getVariantData(project, "original");
  if (!project || !sourceData) return showToast("Grava primeiro uma take vocal.");
  const intensity = Number(producerAutoTuneIntensity?.value || 50) / 100;
  const root = producerAutoTuneRoot?.value || "C";
  const scale = producerAutoTuneScale?.value || "major";
  const correction = activePitchAnalysis?.correction || autoTuneCorrectionFromPitch([], root, scale);
  const parameters = { ...autoTuneParameters(intensity), root, scale, detectedCents: correction.cents, noteCount: correction.noteCount || 0, pitchConfidence: correction.confidence || 0 };
  producerApplyAutoTune.disabled = true;
  if (producerAutoTuneStatus) producerAutoTuneStatus.textContent = `A processar ${Math.round(intensity * 100)}% · ${root} ${scale} · ${correction.cents} cents…`;
  try {
    const blob = await applyAutoTuneLocal(await dataUrlToBlob(sourceData), { intensity, correctionCents: correction.cents });
    const data = await blobToDataUrl(blob);
    const updated = readProjects().map((item) => item.id === project.id ? { ...item, audioVariants: { ...(item.audioVariants || {}), pitchCorrected: { data, mimeType: "audio/wav", bytes: blob.size, source: "local-autotune", intensity, root, scale, correctionCents: correction.cents, pitchConfidence: correction.confidence || 0, noteCount: correction.noteCount || 0, updatedAt: new Date().toISOString() } }, pitchCorrectionApplied: `Auto-Tune ${Math.round(intensity * 100)}% · ${root} ${scale}`, status: "Auto-Tune local disponível" } : item);
    saveProjects(updated);
    if (await indexedDbAvailable()) await Promise.all([putAudioBlob(project.id, "pitch-corrected", blob), putEffect({ id: `${project.id}:auto-tune`, projectId: project.id, type: "auto-tune-local", parameters, createdAt: new Date().toISOString() }), putProject(updated.find((item) => item.id === project.id))]);
    if (producerAutoTuneStatus) producerAutoTuneStatus.textContent = `Aplicado · ${root} ${scale} · ${correction.cents} cents · reversível`;
    renderProjects();
    showToast("Auto-Tune local aplicado. O Original continua preservado.");
  } catch (error) {
    if (producerAutoTuneStatus) producerAutoTuneStatus.textContent = "Não foi possível processar nesta sessão.";
    showToast(error instanceof Error ? error.message : "Auto-Tune local falhou.");
  } finally {
    producerApplyAutoTune.disabled = false;
  }
}

async function resetLocalAutoTune() {
  const project = currentTimelineProject();
  if (!project) return;
  const updated = readProjects().map((item) => {
    if (item.id !== project.id) return item;
    const variants = { ...(item.audioVariants || {}) };
    if (variants.pitchCorrected?.source !== "local-autotune") return item;
    delete variants.pitchCorrected;
    return { ...item, audioVariants: variants, pitchCorrectionApplied: false, status: "Auto-Tune revertido; vocal anterior preservado" };
  });
  saveProjects(updated);
  try { if (await indexedDbAvailable()) await Promise.all([deleteAudioBlob(project.id, "pitch-corrected"), putProject(updated.find((item) => item.id === project.id))]); } catch { showToast("A variante foi revertida localmente; a limpeza IndexedDB será tentada novamente."); }
  renderProjects();
  if (producerAutoTuneStatus) producerAutoTuneStatus.textContent = "Original recuperado; Auto-Tune revertido.";
  showToast("Auto-Tune revertido. Original e Enhanced continuam disponíveis.");
}

async function applyLocalSpaceEffects() {
  const project = currentTimelineProject();
  const sourceData = getVariantData(project, "pitchCorrected") || getVariantData(project, "enhanced") || getVariantData(project, "original");
  if (!project || !sourceData) return showToast("Grava primeiro uma take vocal.");
  const reverb = Number(producerReverbIntensity?.value || 0) / 100;
  const delay = Number(producerDelayIntensity?.value || 0) / 100;
  if (producerApplySpace) producerApplySpace.disabled = true;
  try {
    let blob = await dataUrlToBlob(sourceData);
    if (reverb > 0) blob = await applyReverbLocal(blob, { intensity: reverb });
    if (delay > 0) blob = await applyDelayLocal(blob, { intensity: delay });
    const data = await blobToDataUrl(blob);
    const updated = readProjects().map((item) => item.id === project.id ? { ...item, audioVariants: { ...(item.audioVariants || {}), spatial: { data, mimeType: "audio/wav", bytes: blob.size, source: "local-spatial", reverb, delay, parameters: [spatialEffectParameters("reverb", reverb), spatialEffectParameters("delay", delay)], updatedAt: new Date().toISOString() } }, status: "Reverb/delay local disponível" } : item);
    saveProjects(updated);
    if (await indexedDbAvailable()) await Promise.all([putAudioBlob(project.id, "spatial", blob), putEffect({ id: `${project.id}:spatial`, projectId: project.id, type: "reverb-delay-local", parameters: { reverb, delay }, createdAt: new Date().toISOString() }), putProject(updated.find((item) => item.id === project.id))]);
    if (producerAutoTuneStatus) producerAutoTuneStatus.textContent = `Espaço aplicado · reverb ${Math.round(reverb * 100)}% · delay ${Math.round(delay * 100)}% · reversível`;
    renderProjects();
    showToast("Reverb e delay locais aplicados sem alterar o Original.");
  } catch (error) { showToast(error instanceof Error ? error.message : "Não foi possível aplicar reverb/delay."); }
  finally { if (producerApplySpace) producerApplySpace.disabled = false; }
}
async function resetLocalSpaceEffects() {
  const project = currentTimelineProject();
  if (!project) return;
  const updated = readProjects().map((item) => item.id === project.id ? { ...item, audioVariants: Object.fromEntries(Object.entries(item.audioVariants || {}).filter(([key]) => key !== "spatial")), status: "Reverb/delay revertidos" } : item);
  saveProjects(updated);
  try { if (await indexedDbAvailable()) await Promise.all([deleteAudioBlob(project.id, "spatial"), deleteEffect(project.id, "spatial"), putProject(updated.find((item) => item.id === project.id))]); } catch { showToast("A variante espacial foi revertida localmente; a limpeza IndexedDB será tentada novamente."); }
  renderProjects();
  if (producerAutoTuneStatus) producerAutoTuneStatus.textContent = "Reverb e delay revertidos; vocal anterior preservado.";
  showToast("Reverb e delay revertidos.");
}

async function mixImportedBeatWithVocal() {
  const project = currentTimelineProject();
  const beat = project?.importedBeat;
  const vocalData = getVariantData(project, "pitchCorrected") || getVariantData(project, "enhanced") || getVariantData(project, "original");
  const beatBlob = project ? await resolveBeatBlob(project) : null;
  if (!project || !beatBlob || !vocalData) return showToast("Precisas de uma take vocal e de um beat importado.");
  producerVocalBeatMix.disabled = true;
  producerBeatStatus.textContent = "A preparar Vocal + beat local…";
  try {
    const vocalKey = `${project.id}:pitch-corrected`;
    const beatKey = `${project.id}:imported-beat`;
    let arrangement = normalizeProject({ ...project, tracks: [] });
    arrangement = addTrack(arrangement, { id: `${project.id}-vocal`, name: "Vocal processado", type: "audio", color: "#f06aa8" });
    arrangement = addTrack(arrangement, { id: `${project.id}-beat`, name: `Beat · ${beat.name}`, type: "audio", color: "#62d6c7" });
    arrangement = addClip(arrangement, `${project.id}-vocal`, { id: `${project.id}-vocal-clip`, blobKey: vocalKey, name: "Vocal processado", duration: Number(project.duration || 0), mimeType: "audio/wav", gain: 1 });
    arrangement = addClip(arrangement, `${project.id}-beat`, { id: `${project.id}-beat-clip`, blobKey: beatKey, name: beat.name, duration: Number(project.duration || 0), mimeType: beat.type, gain: 1.15 });
    const sources = new Map([[vocalKey, await dataUrlToBlob(vocalData)], [beatKey, beatBlob]]);
    const wav = await renderTimelineToWav(arrangement, sources, { headroom: 0.86 });
    const mixedData = await blobToDataUrl(wav);
    const next = readProjects().map((item) => item.id === project.id ? {
      ...arrangement,
      ...item,
      tracks: arrangement.tracks,
      audioVariants: { ...(item.audioVariants || {}), mixed: { data: mixedData, mimeType: "audio/wav", bytes: wav.size, source: "local-vocal-beat-mix", updatedAt: new Date().toISOString() } },
      status: "Vocal + beat disponível",
    } : item);
    saveProjects(next);
    try { if (await indexedDbAvailable()) await Promise.all([putAudioBlob(project.id, "mixed", wav), putProject(next.find((item) => item.id === project.id))]); } catch { showToast("O Mixed ficou no armazenamento local; a cópia IndexedDB será tentada novamente."); }
    activeTimelineId = project.id;
    timelineHistory = createHistoryState(normalizeProject(next.find((item) => item.id === project.id)));
    renderProjects();
    await refreshStorageStatus();
    if (producerFinalStatus) producerFinalStatus.textContent = "Faixa final Vocal + beat pronta para exportar em WAV.";
    showToast("Vocal + beat misturados localmente. A faixa final está pronta para exportar; Original, Enhanced e Pitch Corrected continuam reversíveis.");
  } catch (error) {
    console.error("Vocal + beat falhou", error);
    producerBeatStatus.textContent = error instanceof Error ? error.message : "Não foi possível criar o Mixed.";
    showToast("Não foi possível misturar Vocal + beat neste navegador. O original permanece preservado.");
  } finally {
    producerVocalBeatMix.disabled = false;
  }
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
  return getVariantData(project, variantFromBlobKey(clip.blobKey));
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
    const origin = trackOrigin(track);
    const originLabel = origin === "producer-plan" ? "Producer Plan" : "Manual";
    const originDescription = origin === "producer-plan" ? "Faixa gerada pelo Producer Plan" : "Faixa criada ou editada manualmente";
    const clips = track.clips.map((clip) => {
      const left = Math.min(92, Math.max(0, (clip.start / 40) * 100));
      const width = Math.max(8, Math.min(96 - left, (clip.duration / 40) * 100));
      const key = `${escapeHtml(track.id)}:${escapeHtml(clip.id)}`;
      return `<div class="timeline-clip" style="left:${left}%;width:${width}%" title="${escapeHtml(clip.name)}"><strong>${escapeHtml(clip.name)}</strong><small>${clip.duration.toFixed(1)}s · ${clip.gain.toFixed(2)}x · offset ${clip.sourceOffset.toFixed(1)}s</small><div class="clip-actions"><button class="mini-button" type="button" data-clip-action="move-left" data-clip-key="${key}">←</button><button class="mini-button" type="button" data-clip-action="move-right" data-clip-key="${key}">→</button><button class="mini-button" type="button" data-clip-action="trim" data-clip-key="${key}">Trim</button><button class="mini-button" type="button" data-clip-action="split" data-clip-key="${key}">Split</button><button class="mini-button" type="button" data-clip-action="shorter" data-clip-key="${key}">−Len</button><button class="mini-button" type="button" data-clip-action="longer" data-clip-key="${key}">+Len</button><button class="mini-button" type="button" data-clip-action="fade" data-clip-key="${key}">Fade</button><button class="mini-button" type="button" data-clip-action="gain" data-clip-key="${key}">Gain</button><button class="mini-button" type="button" data-duplicate-clip="${key}">Duplicar</button><button class="mini-button danger" type="button" data-delete-clip="${key}">Apagar</button></div></div>`;
    }).join("");
    const selected = track.id === selectedMixerTrackId ? " is-selected" : "";
    return `<div class="timeline-track timeline-track--${origin}${selected}" data-track-origin="${origin}" data-timeline-track="${escapeHtml(track.id)}" tabindex="0" aria-label="${escapeHtml(track.name)} · ${originDescription}"><div class="timeline-track-label"><div class="timeline-track-name"><span>${escapeHtml(track.name)}</span><span class="timeline-origin-badge timeline-origin-badge--${origin}" title="${originDescription}">${originLabel}</span></div><small>${escapeHtml(track.type)} · ${originDescription}</small></div><div class="timeline-lane">${clips || '<span class="empty">Sem clips</span>'}</div></div>`;
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
    if (mixerInspector) mixerInspector.innerHTML = "<strong>Inspector de track</strong><span>Selecciona uma faixa para ver os seus clips e origem.</span>";
    return;
  }
  if (!project.tracks.some((track) => track.id === selectedMixerTrackId)) selectedMixerTrackId = project.tracks[0].id;
  mixerTracks.innerHTML = project.tracks.map((track) => { const volume = Number(track.volume ?? 1); const selected = track.id === selectedMixerTrackId ? " is-selected" : ""; return `<div class="mixer-track${selected}" data-mixer-track="${escapeHtml(track.id)}" tabindex="0"><div class="mixer-track-title"><strong>${escapeHtml(track.name)}</strong><span>${escapeHtml(track.type)}</span></div><label><span>Ganho <output data-mixer-output="volume">${formatGainDb(volume)}</output></span><span class="control-hint">−∞ a +6 dB</span><input type="range" min="-60" max="6" step="0.5" value="${Math.max(-60, Math.min(6, linearToDb(volume)))}" data-mixer-field="volume" aria-label="Ganho em decibéis de ${escapeHtml(track.name)}"></label><label><span>Pan <output data-mixer-output="pan">${Number(track.pan ?? 0).toFixed(2)}</output></span><span class="control-hint">L · C · R</span><input type="range" min="-1" max="1" step="0.01" value="${Number(track.pan ?? 0)}" data-mixer-field="pan" aria-label="Pan de ${escapeHtml(track.name)}"></label><div class="mixer-switches"><button class="mini-button ${track.muted ? "active" : ""}" type="button" data-mixer-field="muted">${track.muted ? "Unmute" : "Mute"}</button><button class="mini-button ${track.solo ? "active" : ""}" type="button" data-mixer-field="solo">${track.solo ? "Unsolo" : "Solo"}</button></div></div>`; }).join("");
  const selected = project.tracks.find((track) => track.id === selectedMixerTrackId) || project.tracks[0];
  const origin = trackOrigin(selected);
  if (mixerInspector) mixerInspector.innerHTML = `<strong>${escapeHtml(selected.name)}</strong><span>${escapeHtml(selected.type)} · ${origin === "producer-plan" ? "Producer Plan" : "Manual"}</span><small>${selected.clips.length} clip${selected.clips.length === 1 ? "" : "s"} · ${selected.effects.length} efeito${selected.effects.length === 1 ? "" : "s"}</small><div class="mixer-inspector-clips">${selected.clips.length ? selected.clips.map((clip) => `<span>${escapeHtml(clip.name)} · ${Number(clip.duration || 0).toFixed(1)}s</span>`).join("") : "<span>Sem clips nesta faixa.</span>"}</div>`;
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
      const variant = variantFromBlobKey(clip.blobKey);
      try { if (await indexedDbAvailable() && clip.blobKey) blob = await getAudioBlob(project.id, blobKindForVariant(variant)); } catch {}
      const variantData = getVariantData(project, variant) || sourceData;
      if (!blob && variantData && (clip.blobKey?.startsWith(`${project.id}:`) || clip.blobKey === null)) {
        blob = await dataUrlToBlob(variantData);
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
    const mixedAudioData = await blobToDataUrl(wav);
    const updated = readProjects().map((item) => item.id === project.id ? {
      ...item,
      audioVariants: { ...(item.audioVariants || {}), mixed: { data: mixedAudioData, mimeType: "audio/wav", bytes: wav.size, source: "timeline-mixdown", updatedAt: new Date().toISOString() } },
      status: "Mixdown local disponível",
    } : item);
    saveProjects(updated);
    try {
      if (await indexedDbAvailable()) await Promise.all([putAudioBlob(project.id, "mixed", wav), putProject(updated.find((item) => item.id === project.id))]);
    } catch { showToast("O Mixed foi guardado localmente; a cópia IndexedDB será tentada novamente."); }
    renderProjects();
    await refreshStorageStatus();
    showToast("Mixdown WAV exportado localmente com headroom e guardado como Mixed.");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Não foi possível exportar o mixdown.");
  } finally {
    timelineMixdownButton.disabled = false;
    timelineMixdownButton.textContent = "↓ Mixdown WAV";
  }
}

function insertInstrumentClip({ name, type, duration = 4, metadata = {}, start = null }) {
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
    start: Number.isFinite(Number(start)) ? Math.max(0, Number(start)) : end,
    duration,
    sourceOffset: 0,
    mimeType: "application/x-fernando-lucoco-event",
    event: metadata,
  });
  commitTimelineProject(nextProject);
  showToast(`${name} adicionado à timeline local.`);
  return true;
}

function renderSoundLibrary() {
  if (!soundLibraryGrid) return;
  soundLibraryGrid.innerHTML = SOUND_LIBRARY.map((item) => `<article class="sound-library-card" draggable="true" data-sound-id="${escapeHtml(item.id)}" tabindex="0" aria-label="${escapeHtml(item.name)}">
    <div class="sound-library-card-top"><span class="sound-library-swatch" style="background:${escapeHtml(item.color)}" aria-hidden="true"></span><span class="sound-library-type">${escapeHtml(item.type)}</span></div>
    <strong>${escapeHtml(item.name)}</strong><small>${item.duration}s · local</small>
    <div class="sound-library-actions"><button class="mini-button" type="button" data-sound-preview="${escapeHtml(item.id)}">▶ Ouvir</button><button class="mini-button primary" type="button" data-sound-add="${escapeHtml(item.id)}">＋ Timeline</button></div>
  </article>`).join("");
}

async function previewSoundLibraryItem(item) {
  if (!item) return;
  try {
    if (item.preview.kind === "pattern") await playPattern(item.preview.value, { bpm: Number(projectTempo?.value) || 100, bars: 1 });
    else if (item.preview.kind === "note") await playNote(item.preview.value, { instrument: item.type === "bass" ? "piano" : item.type, duration: 0.45, volume: 0.18 });
    else await playChord(item.preview.value, { instrument: item.type, duration: 0.55, volume: 0.12 });
    if (soundLibraryStatus) soundLibraryStatus.textContent = `${item.name}: pré-escuta local a tocar.`;
  } catch (error) {
    if (soundLibraryStatus) soundLibraryStatus.textContent = error instanceof Error ? error.message : "Não foi possível pré-escutar este som.";
  }
}

function addSoundLibraryItem(item, start = null) {
  if (!item) return false;
  const clip = soundLibraryClip(item, start);
  const added = insertInstrumentClip({ name: clip.name, type: item.type, duration: clip.duration, start: clip.start, metadata: clip.event });
  if (added && soundLibraryStatus) soundLibraryStatus.textContent = `${item.name} adicionado à timeline na posição ${clip.start.toFixed(1)}s.`;
  return added;
}

async function runProducerPlan(id, { planOverride = null, sourceLabel = "local" } = {}) {
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
    let analysis = null;
    try {
      analysis = await analyzeAudioDataUrl(source.originalAudioData || source.audioData || "");
    } catch {
      analysis = null;
    }
    const plan = planOverride || source.aiRecommendedPlan || buildProducerPlan({ genre: source.genre, tempo: source.tempo, key: source.key, duration: source.duration, brief: source.productionBrief || "", analysis, preferAnalysis: Boolean(analysis?.hasAudio) });
    const analyzedProject = readProjects().map((item) => item.id === id ? {
      ...item,
      analysis,
      tempo: plan.bpm || analysis?.bpm || item.tempo,
      key: plan.key || analysis?.key || item.key,
      producerPlanSource: sourceLabel,
      producerPlanAppliedAt: new Date().toISOString(),
    } : item);
    saveProjects(analyzedProject);
    const isAiPlan = sourceLabel === "ai";
    if (!setProductionPhase(id, PRODUCTION_STATES.ARRANGING, isAiPlan ? "A IA está a criar o arranjo e a instrumentalização" : "A criar arranjo local", 25, renderProjects)) return;
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    const plannedProject = applyProducerMix(normalizeProject(analyzedProject.find((item) => item.id === id) || source), plan);
    const specs = producerPlanClipSpecs(plan, Math.max(4, Math.min(16, Number(source.duration || 8))));
    if (!isProductionActive(id)) return;
    const next = materializeProducerPlan(plannedProject, plan, {
      duration: source.duration,
        onStep: ({ index, total }) => setProductionPhase(id, PRODUCTION_STATES.ARRANGING, `${isAiPlan ? "A IA materializa a faixa do produtor" : "A criar arranjo local"} · ${index}/${total}`, 25 + Math.round((index / total) * 45), renderProjects),
    });
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    if (!setProductionPhase(id, PRODUCTION_STATES.MIXING, isAiPlan ? "A preparar vocal, mix e master local seguro" : "A preparar mix local", 85, renderProjects)) return;
    await commitTimelineProject(next);
    completeProduction(id, renderProjects, isAiPlan ? "AI Producer aplicado · arranjo, vocal, mix e master local" : "Producer Plan local aplicado");
    showToast(`${sourceLabel === "ai" ? "Plano IA aplicado" : "Producer Plan aplicado"}: ${plan.genre}, ${plan.bpm} BPM, ${plan.instruments.length} instrumentos na faixa do produtor.`);
  } catch (error) {
    failProduction(id, error, renderProjects);
    showToast("A produção falhou, mas o projecto original foi preservado. Tenta novamente.");
  }
}

function cancelProducerPlan(id) {
  cancelProduction(id, renderProjects, showToast);
}

function setProducerStage(id, done, active = false) {
  const node = document.getElementById(id);
  if (!node) return;
  node.classList.toggle("is-done", done);
  node.classList.toggle("is-active", active);
}

function renderProducerStudio() {
  const project = currentTimelineProject();
  const state = deriveProducerStudioState(project);
  if (producerStudioEmpty) producerStudioEmpty.hidden = state.hasProject;
  if (producerStudioContent) producerStudioContent.hidden = !state.hasProject;
  if (!state.hasProject) return;
  const confidence = `${Math.round(state.confidence * 100)}%`;
  if (producerAnalysisTitle) producerAnalysisTitle.textContent = state.hasAnalysis ? "Análise local disponível" : "Análise pendente — usa o Producer Plan";
  if (producerBpm) producerBpm.textContent = String(state.bpm);
  if (producerKey) producerKey.textContent = state.key;
  if (producerConfidence) producerConfidence.textContent = state.hasAnalysis ? confidence : "não calculada";
  if (producerBpmInput && document.activeElement !== producerBpmInput) producerBpmInput.value = state.bpm;
  if (producerKeyInput && document.activeElement !== producerKeyInput) producerKeyInput.value = state.key;
  if (producerGenre) producerGenre.textContent = state.genre;
  if (producerBriefPreview) producerBriefPreview.textContent = state.brief;
  if (producerRunPlan) producerRunPlan.disabled = state.processingState === PRODUCTION_STATES.PREPARING || state.processingState === PRODUCTION_STATES.ARRANGING || state.processingState === PRODUCTION_STATES.MIXING;
  if (producerPlanStatus) producerPlanStatus.textContent = state.hasPlan ? (state.processingState === PRODUCTION_STATES.COMPLETED ? "Arranjo local concluído" : "Arranjo disponível na timeline") : "Ainda não aplicado";
  if (producerVocalStatus) producerVocalStatus.textContent = state.hasVocal ? "Enhanced / Pitch Corrected disponíveis" : "Original preservado";
  if (producerMixStatus) producerMixStatus.textContent = state.hasMix ? "Mixed WAV disponível" : "Aguardando Mixdown";
  if (producerFinalStatus) producerFinalStatus.textContent = state.hasMix ? "Compara Original e Mixed antes de exportar." : "Cria um Mixed para comparar versões.";
  if (producerAbMixed) producerAbMixed.disabled = !state.hasMix;
  updateProducerBypassUI(state.hasMix);
  if (producerExport) producerExport.disabled = !state.hasMix;
  if (producerExportProject) producerExportProject.disabled = !state.projectId;
  setProducerStage("producer-stage-plan", state.hasPlan, state.processingState !== "IDLE" && !state.hasPlan);
  setProducerStage("producer-stage-vocal", state.hasVocal);
  setProducerStage("producer-stage-mix", state.hasMix);
  setProducerStage("producer-stage-master", state.hasMaster);
  updateProducerBeatControls(project);
  updateEffectPresetOptions();
}

function renderRecentProjects(projects) {
  if (!recentProjects) return;
  if (!projects.length) {
    recentProjects.innerHTML = '<div class="studio-recent-empty"><span>♪</span><div><strong>Ainda não há sessões guardadas</strong><p>Cria o teu primeiro projecto e ele aparecerá aqui.</p></div><button class="mini-button" type="button" data-studio-area="recording-workspace">Criar projecto</button></div>';
    return;
  }
  recentProjects.innerHTML = projects.filter((project) => !project.archived).slice(0, 4).map((project) => {
    const duration = project.durationLabel || "duração não registada";
    const detail = `${project.genre || "Demo vocal"} · ${duration}`;
    return `<article class="studio-recent-project"><div class="studio-recent-project-art" aria-hidden="true">♫</div><div class="studio-recent-project-main"><strong>${escapeHtml(project.name || "Sessão sem título")}</strong><small>${escapeHtml(detail)}</small><span class="studio-recent-project-status">${escapeHtml(project.status || "Guardada localmente")}</span></div><button class="mini-button" type="button" data-open-project="${escapeHtml(project.id)}" data-studio-area="timeline">Abrir</button></article>`;
  }).join("");
}

function renderProjects() {
  renderSoundLibrary();
  const projects = readProjects();
  renderRecentProjects(projects);
  if (!projects.length) {
    list.innerHTML = '<div class="empty">Ainda não há takes guardadas. A tua próxima ideia pode começar aqui.</div>';
    renderProducerStudio();
    renderTimeline();
    return;
  }
  list.innerHTML = projects.map((project) => {
    const originalData = getVariantData(project, "original");
    const processedData = getVariantData(project, "processed");
    const variantBlocks = ["enhanced", "pitchCorrected", "mixed"].map((variant) => {
      const data = getVariantData(project, variant);
      return data ? audioBlock(VOCAL_VARIANTS[variant].label, data, getVariantMime(project, variant), project.name) : `<small>${VOCAL_VARIANTS[variant].label}: ainda não existe.</small>`;
    }).join("");
    const original = audioBlock("Original", originalData, getVariantMime(project, "original"), project.name);
    const processed = processedData ? audioBlock("Processada legacy", processedData, getVariantMime(project, "processed"), project.name) : "";
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
    const pitchAssist = originalData && !project.pitchCorrectionApplied
      ? `<button class="mini-button" type="button" data-pitch-correct-id="${escapeHtml(project.id)}">Pitch assistido</button>`
      : "";
    const archiveButton = project.archived
      ? `<button class="mini-button" type="button" data-archive-id="${escapeHtml(project.id)}">Restaurar</button>`
      : `<button class="mini-button" type="button" data-archive-id="${escapeHtml(project.id)}">Arquivar</button>`;
    const resetEffects = (processedData || variantBlocks.includes("audio-version"))
      ? `<button class="mini-button" type="button" data-reset-effects-id="${escapeHtml(project.id)}">Repor variantes</button>`
      : "";
    const mixedExport = getVariantData(project, "mixed")
      ? `<button class="mini-button primary" type="button" data-export-mixed-id="${escapeHtml(project.id)}">Exportar Mixed WAV</button>`
      : "";
    return `<div class="project${project.archived ? " is-archived" : ""}"><div class="project-content"><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(project.preset)} · ${escapeHtml(project.genre || "Demo vocal")} · ${escapeHtml(project.durationLabel || "duração não registada")} · ${escapeHtml(project.createdAt)}</small><div class="project-audio-stack">${original}${processed}${variantBlocks}${legacyNotice}${brief}</div><div class="project-actions">${gain}${fade}${normalize}${compressor}${vocalEnhancement}${pitchAssist}${mixedExport}${resetEffects}${process}${archiveButton}<button class="mini-button" type="button" data-rename-id="${escapeHtml(project.id)}">Renomear</button><button class="mini-button" type="button" data-duplicate-id="${escapeHtml(project.id)}">Duplicar</button><button class="mini-button danger" type="button" data-delete-id="${escapeHtml(project.id)}">Apagar</button></div></div><span class="pill">${escapeHtml(project.status)}</span></div>`;
    }).join("");
  renderProducerStudio();
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
    audioVariants: {},
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

async function applyLocalEffect(id, effectName, processor, successMessage, variant = "processed") {
  const project = readProjects().find((item) => item.id === id);
  const sourceData = getVariantData(project, "original");
  if (!project || !sourceData || project[effectName] || project.audioVariants?.[variant]?.data) return;
  try {
    showToast(`A preparar ${VOCAL_VARIANTS[variant]?.label || "Processada"} local em WAV…`);
    const sourceBlob = await dataUrlToBlob(sourceData);
    const processedBlob = await processor(sourceBlob);
    const processedAudioData = await blobToDataUrl(processedBlob);
    const variantRecord = { data: processedAudioData, mimeType: "audio/wav", bytes: processedBlob.size, source: "local-dsp", updatedAt: new Date().toISOString() };
    const updated = readProjects().map((item) => item.id === id ? {
      ...item,
      ...(variant === "processed" ? { processedAudioData, processedMimeType: "audio/wav", processedBytes: processedBlob.size } : {}),
      audioVariants: { ...(item.audioVariants || {}), [variant]: variantRecord },
      [effectName]: effectName === "effectApplied" ? "Ganho +3 dB" : effectName === "fadeApplied" ? "Fade in/out" : true,
      status: `${VOCAL_VARIANTS[variant]?.label || "Processada"} local aplicada`,
    } : item);
    saveProjects(updated);
    try {
      if (await indexedDbAvailable()) {
        await Promise.all([
          putAudioBlob(id, blobKindForVariant(variant), processedBlob),
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
  return applyLocalEffect(id, "vocalEnhancementApplied", applyVocalEnhancement, "Melhoria vocal local aplicada. O original continua preservado.", "enhanced");
}

function applyLocalPitchAssist(id) {
  return applyLocalEffect(id, "pitchCorrectionApplied", applyPitchCorrectionAssist, "Pitch correction assistida aplicada localmente. O original continua preservado.", "pitchCorrected");
}

async function resetEffects(id) {
  const project = readProjects().find((item) => item.id === id);
  if (!project || (!project.processedAudioData && !Object.keys(project.audioVariants || {}).length)) return;
  const updated = readProjects().map((item) => item.id === id ? {
    ...item,
    processedAudioData: null,
    processedMimeType: null,
    processedBytes: 0,
    audioVariants: {},
    effectApplied: null,
    fadeApplied: null,
    normalizeApplied: null,
    compressorApplied: null,
    vocalEnhancementApplied: false,
    pitchCorrectionApplied: false,
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

async function archiveProject(id) {
  const project = readProjects().find((item) => item.id === id);
  if (!project) return;
  const archived = !project.archived;
  const updated = readProjects().map((item) => item.id === id ? { ...item, archived, status: archived ? "Arquivada localmente" : "Restaurada localmente", updatedAt: new Date().toISOString() } : item);
  saveProjects(updated);
  try { if (await indexedDbAvailable()) await putProject(updated.find((item) => item.id === id)); } catch { /* fallback já foi guardado */ }
  renderProjects();
  showToast(archived ? "Sessão arquivada; continua recuperável." : "Sessão restaurada.");
}

async function renameProject(id) {
  const project = readProjects().find((item) => item.id === id);
  if (!project) return;
  const nextName = window.prompt("Novo nome da sessão", project.name || "Sessão sem título")?.trim();
  if (!nextName || nextName === project.name) return;
  const updated = readProjects().map((item) => item.id === id ? { ...item, name: nextName, updatedAt: new Date().toISOString() } : item);
  saveProjects(updated);
  try { if (await indexedDbAvailable()) await putProject(updated.find((item) => item.id === id)); } catch { /* fallback já foi guardado */ }
  renderProjects();
  showToast(`Sessão renomeada para “${nextName}”.`);
}

async function duplicateProject(id) {
  const project = readProjects().find((item) => item.id === id);
  if (!project) return;
  const copy = { ...project, id: makeProjectId(), name: `${project.name || "Sessão"} — cópia`, createdAt: new Date().toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" }), updatedAt: new Date().toISOString(), importedBeat: null, status: "Cópia local" };
  saveProjects([copy, ...readProjects()]);
  try { if (await indexedDbAvailable()) await putProject(copy); } catch { /* fallback já foi guardado */ }
  renderProjects();
  showToast(`Foi criada uma cópia de “${project.name}”.`);
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

producerSaveAnalysis?.addEventListener("click", () => {
  const project = currentTimelineProject();
  if (!project) return showToast("Grava primeiro uma take para editar a análise.");
  const bpm = Math.max(40, Math.min(240, Number(producerBpmInput?.value) || 100));
  const key = producerKeyInput?.value || "C";
  const updated = readProjects().map((item) => item.id === project.id ? {
    ...item,
    tempo: bpm,
    key,
    manualAnalysis: { ...(item.manualAnalysis || {}), bpm, key, source: "manual" },
  } : item);
  saveProjects(updated);
  timelineHistory = createHistoryState(normalizeProject(updated.find((item) => item.id === project.id)));
  renderProjects();
  showToast(`Análise guardada: ${bpm} BPM · ${key}.`);
});
producerRunPlan?.addEventListener("click", () => {
  const project = currentTimelineProject();
  if (project) runProducerPlan(project.id);
});
producerRequestAi?.addEventListener("click", async () => {
  const project = currentTimelineProject();
  if (!project) return showToast("Grava primeiro uma take para pedir uma recomendação IA.");
  producerRequestAi.disabled = true;
  producerAiStatus?.setAttribute("data-state", "loading");
  if (producerAiStatus) producerAiStatus.textContent = "A pedir recomendação server-side…";
  try {
    const result = await requestProductionAdvice({
      takeId: project.id,
      genre: project.genre || "Afrobeat",
      vocalPreset: project.preset || "Natural",
      durationSeconds: Number(project.duration || 0),
      bpm: Number(project.tempo || 100),
      key: project.key || "C",
      locale: "pt-PT",
      intent: project.productionBrief || "demo vocal",
    });
    const advice = result.advice;
    const recommendationPlan = adviceToProducerPlan({
      advice,
      base: {
        genre: project.genre || "Afrobeat",
        tempo: project.tempo || 100,
        key: project.key || "C",
        duration: Number(project.duration || 60),
        brief: project.productionBrief || "",
        analysis: project.analysis || null,
        preferAnalysis: Boolean(project.analysis?.hasAudio),
      },
    });
    const nextProjects = readProjects().map((item) => item.id === project.id
      ? { ...item, aiRecommendation: advice, aiRecommendedPlan: recommendationPlan }
      : item);
    saveProjects(nextProjects);
    if (producerAiStatus) {
      producerAiStatus.dataset.state = "success";
      producerAiStatus.textContent = `${advice.summary} Cadeia: ${advice.chain.join(" → ")} · confiança ${advice.confidence}. A IA vai agora materializar o arranjo na faixa do produtor.`;
    }
    await runProducerPlan(project.id, { planOverride: recommendationPlan, sourceLabel: "ai" });
  } catch (error) {
    if (producerAiStatus) {
      producerAiStatus.dataset.state = "error";
      producerAiStatus.textContent = error.message || "Recomendação IA indisponível; o fluxo local continua disponível.";
    }
  } finally {
    producerRequestAi.disabled = false;
  }
});
producerAbOriginal?.addEventListener("click", () => playProducerPreview("original"));
producerAbMixed?.addEventListener("click", () => playProducerPreview("mixed"));
producerBypass?.addEventListener("click", () => {
  const project = currentTimelineProject();
  if (!getVariantData(project, "mixed")) {
    showToast("Cria primeiro uma versão Mixed para usar o bypass A/B.");
    return;
  }
  producerBypassActive = !producerBypassActive;
  updateProducerBypassUI(true);
  playProducerPreview(producerBypassActive ? "original" : "mixed");
});
function exportProjectManifest() {
  const project = currentTimelineProject();
  if (!project) return showToast("Cria ou selecciona um projecto primeiro.");
  const currentPreset = loadEffectPresets().find((item) => item.id === activePresetId) || null;
  const manifest = createProjectManifest({
    ...project,
    activeEffectPresetId: activePresetId || project.activeEffectPresetId || "",
    activeEffectPreset: currentPreset,
    audioSettings: currentEffectPreset(),
  });
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
  downloadBlob(blob, projectManifestFilename(project.name));
  showToast("Manifesto do projecto exportado com as configurações de áudio.");
}

producerExport?.addEventListener("click", () => {
  const project = currentTimelineProject();
  if (project) exportMixedVersion(project.id);
});
producerExportProject?.addEventListener("click", exportProjectManifest);
producerBeatFile?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (file) await importProducerBeat(file);
  event.target.value = "";
});
producerBeatPreview?.addEventListener("click", async () => {
  const beatBlob = await resolveBeatBlob(currentTimelineProject());
  if (!beatBlob) return showToast("Importa primeiro um beat local.");
  try {
    producerBeatAudio.hidden = false;
    await producerBeatAudio.play();
    producerBeatStatus.textContent = "Beat em reprodução.";
  } catch {
    producerBeatStatus.textContent = "O navegador bloqueou a pré-escuta. Usa os controlos do áudio.";
    showToast("Toca novamente para ouvir o beat.");
  }
});
producerAutoTuneIntensity?.addEventListener("input", () => {
  const intensity = Number(producerAutoTuneIntensity.value || 0);
  if (producerAutoTuneValue) producerAutoTuneValue.textContent = `${intensity}%`;
  if (producerAutoTuneStatus) producerAutoTuneStatus.textContent = `${Math.round(intensity * 0.5)} cents de correcção prevista.`;
});
producerAutoTuneRoot?.addEventListener("change", () => { activePitchAnalysis = null; if (producerPitchStatus) producerPitchStatus.textContent = "Tonalidade alterada; analisa novamente o pitch."; });
producerAutoTuneScale?.addEventListener("change", () => { activePitchAnalysis = null; if (producerPitchStatus) producerPitchStatus.textContent = "Escala alterada; analisa novamente o pitch."; });
producerAnalyzePitch?.addEventListener("click", analyzeProducerPitch);
producerPitchNotes?.addEventListener("change", (event) => { const input = event.target.closest("[data-pitch-index]"); if (input) updateEditedPitch(Number(input.dataset.pitchIndex), input.value); });
producerPitchCurve?.addEventListener("pointerdown", (event) => { pitchCurveDrag = { pointerId: event.pointerId }; producerPitchCurve.setPointerCapture?.(event.pointerId); editPitchFromCurve(event); });
producerPitchCurve?.addEventListener("pointermove", (event) => { if (pitchCurveDrag?.pointerId === event.pointerId) editPitchFromCurve(event); });
producerPitchCurve?.addEventListener("pointerup", (event) => { if (pitchCurveDrag?.pointerId === event.pointerId) { pitchCurveDrag = null; producerPitchCurve.releasePointerCapture?.(event.pointerId); } });
producerPitchCurve?.addEventListener("pointercancel", () => { pitchCurveDrag = null; });
producerPitchZoomIn?.addEventListener("click", () => { pitchCurveZoom = Math.min(8, Number((pitchCurveZoom + 0.5).toFixed(1))); pitchCurvePan = Math.min(pitchCurvePan, Math.max(0, pitchCurveZoom - 1)); drawPitchCurve(activePitchNotes); });
producerPitchZoomOut?.addEventListener("click", () => { pitchCurveZoom = Math.max(1, Number((pitchCurveZoom - 0.5).toFixed(1))); pitchCurvePan = Math.min(pitchCurvePan, Math.max(0, pitchCurveZoom - 1)); drawPitchCurve(activePitchNotes); });
producerPitchPanReset?.addEventListener("click", () => { pitchCurveZoom = 1; pitchCurvePan = 0; drawPitchCurve(activePitchNotes); });
producerShare?.addEventListener("click", shareFinalTrack);
producerApplyAutoTune?.addEventListener("click", applyLocalAutoTune);
producerResetAutoTune?.addEventListener("click", resetLocalAutoTune);
producerApplySpace?.addEventListener("click", applyLocalSpaceEffects);
producerResetSpace?.addEventListener("click", resetLocalSpaceEffects);
producerReverbIntensity?.addEventListener("input", () => { if (producerReverbValue) producerReverbValue.textContent = `${producerReverbIntensity.value}%`; });
producerDelayIntensity?.addEventListener("input", () => { if (producerDelayValue) producerDelayValue.textContent = `${producerDelayIntensity.value}%`; });
producerVocalBeatMix?.addEventListener("click", mixImportedBeatWithVocal);
[[producerBypassAutoTune, "autoTune"], [producerBypassReverb, "reverb"], [producerBypassDelay, "delay"]].forEach(([button, key]) => button?.addEventListener("click", () => { effectBypassState[key] = !effectBypassState[key]; updateIndividualBypassUI(); }));
producerSavePreset?.addEventListener("click", () => { const name = producerPresetName?.value?.trim(); if (!name) { if (producerPresetStatus) producerPresetStatus.textContent = "Escreve um nome para guardar a predefinição."; producerPresetName?.focus(); return; } const preset = saveEffectPreset({ ...currentEffectPreset(), name }); activePresetId = preset.id; const project = currentTimelineProject(); if (project) persistActivePreset(project.id, preset.id); updateEffectPresetOptions(); if (producerPresetName) producerPresetName.value = ""; if (producerPresetStatus) producerPresetStatus.textContent = `Predefinição “${preset.name}” guardada.`; });
producerPresetSelect?.addEventListener("change", () => { activePresetId = producerPresetSelect.value; const preset = loadEffectPresets().find((item) => item.id === activePresetId); applyEffectPreset(preset); const project = currentTimelineProject(); if (project) persistActivePreset(project.id, activePresetId); if (producerDeletePreset) producerDeletePreset.disabled = !preset || isBuiltInEffectPreset(activePresetId); if (producerPresetStatus) producerPresetStatus.textContent = preset ? `Predefinição “${preset.name}” aplicada.` : "Nenhuma predefinição seleccionada."; });
producerDeletePreset?.addEventListener("click", () => { if (!activePresetId || isBuiltInEffectPreset(activePresetId)) return; const project = currentTimelineProject(); deleteEffectPreset(activePresetId); activePresetId = ""; if (project) persistActivePreset(project.id, ""); updateEffectPresetOptions(); if (producerPresetStatus) producerPresetStatus.textContent = "Predefinição apagada."; });
async function syncCloudProjects() {
  if (!isFirebaseSignedIn()) {
    if (cloudSyncStatus) cloudSyncStatus.textContent = "Inicia sessão para sincronizar manifestos cloud.";
    if (saveCloudProjectButton) saveCloudProjectButton.disabled = true;
    return;
  }
  if (syncCloudProjectsButton) syncCloudProjectsButton.disabled = true;
  if (cloudSyncStatus) cloudSyncStatus.textContent = "A sincronizar manifestos…";
  try {
    const cloudProjects = await listCloudProjects();
    const localProjects = readProjects();
    const localById = new Map(localProjects.map((item) => [item.id, item]));
    cloudProjects.forEach((cloudProject) => {
      const local = localById.get(cloudProject.id);
      if (!local) localById.set(cloudProject.id, cloudProjectToLocal(cloudProject));
      else localById.set(cloudProject.id, { ...local, cloudSynced: true, cloudUpdatedAt: cloudProject.updatedAt || null });
    });
    saveProjects([...localById.values()]);
    renderProjects();
    if (cloudSyncStatus) cloudSyncStatus.textContent = `${cloudProjects.length} manifesto(s) sincronizado(s). O áudio continua local.`;
    if (saveCloudProjectButton) saveCloudProjectButton.disabled = !currentTimelineProject();
  } catch (error) {
    if (cloudSyncStatus) cloudSyncStatus.textContent = error.message || "Não foi possível sincronizar a cloud.";
    showToast(error.message || "Não foi possível sincronizar os projectos cloud.");
  } finally {
    if (syncCloudProjectsButton) syncCloudProjectsButton.disabled = false;
  }
}

async function saveCurrentProjectToCloud() {
  const project = currentTimelineProject();
  if (!project) return showToast("Cria ou selecciona uma sessão primeiro.");
  if (!isFirebaseSignedIn()) return showToast("Inicia sessão para guardar a sessão na cloud.");
  if (saveCloudProjectButton) saveCloudProjectButton.disabled = true;
  if (cloudSyncStatus) cloudSyncStatus.textContent = "A guardar manifesto cloud…";
  try {
    await saveCloudProject(project);
    saveProjects(readProjects().map((item) => item.id === project.id ? { ...item, cloudSynced: true, status: "Manifesto cloud guardado · áudio local" } : item));
    renderProjects();
    if (cloudSyncStatus) cloudSyncStatus.textContent = "Sessão sincronizada. O áudio permanece neste dispositivo.";
    showToast(`“${project.name}” foi guardada na cloud sem enviar áudio bruto.`);
  } catch (error) {
    if (cloudSyncStatus) cloudSyncStatus.textContent = error.message || "Falha ao guardar manifesto cloud.";
    showToast(error.message || "Não foi possível guardar a sessão na cloud.");
  } finally {
    if (saveCloudProjectButton) saveCloudProjectButton.disabled = !isFirebaseSignedIn();
  }
}

syncCloudProjectsButton?.addEventListener("click", syncCloudProjects);
saveCloudProjectButton?.addEventListener("click", saveCurrentProjectToCloud);
window.addEventListener("fernando-authenticated", () => { syncCloudProjects(); });
window.addEventListener("firebase-signed-out", () => {
  if (saveCloudProjectButton) saveCloudProjectButton.disabled = true;
  if (cloudSyncStatus) cloudSyncStatus.textContent = "Sessão terminada. Os projectos locais continuam disponíveis.";
});

updateIndividualBypassUI();
updateEffectPresetOptions();
updateABMeters();

recentProjects?.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-project]");
  if (!openButton) return;
  activeTimelineId = openButton.dataset.openProject || null;
  renderTimeline();
  renderProducerStudio();
});

list?.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-id]");
  const processButton = event.target.closest("[data-process-id]");
  const cancelProcessButton = event.target.closest("[data-cancel-process-id]");
  const gainButton = event.target.closest("[data-gain-id]");
  const fadeButton = event.target.closest("[data-fade-id]");
  const normalizeButton = event.target.closest("[data-normalize-id]");
  const compressorButton = event.target.closest("[data-compressor-id]");
  const vocalEnhancementButton = event.target.closest("[data-vocal-enhance-id]");
  const pitchCorrectionButton = event.target.closest("[data-pitch-correct-id]");
  const exportMixedButton = event.target.closest("[data-export-mixed-id]");
  const resetEffectsButton = event.target.closest("[data-reset-effects-id]");
  const renameButton = event.target.closest("[data-rename-id]");
  const duplicateButton = event.target.closest("[data-duplicate-id]");
  const archiveButton = event.target.closest("[data-archive-id]");
  if (deleteButton) deleteProject(deleteButton.dataset.deleteId);
  if (processButton) runProducerPlan(processButton.dataset.processId);
  if (cancelProcessButton) cancelProducerPlan(cancelProcessButton.dataset.cancelProcessId);
  if (gainButton) applyLocalGain(gainButton.dataset.gainId);
  if (fadeButton) applyLocalFade(fadeButton.dataset.fadeId);
  if (normalizeButton) applyLocalNormalize(normalizeButton.dataset.normalizeId);
  if (compressorButton) applyLocalCompressor(compressorButton.dataset.compressorId);
  if (vocalEnhancementButton) applyLocalVocalEnhancement(vocalEnhancementButton.dataset.vocalEnhanceId);
  if (pitchCorrectionButton) applyLocalPitchAssist(pitchCorrectionButton.dataset.pitchCorrectId);
  if (exportMixedButton) exportMixedVersion(exportMixedButton.dataset.exportMixedId);
  if (resetEffectsButton) resetEffects(resetEffectsButton.dataset.resetEffectsId);
  if (renameButton) renameProject(renameButton.dataset.renameId);
  if (duplicateButton) duplicateProject(duplicateButton.dataset.duplicateId);
  if (archiveButton) archiveProject(archiveButton.dataset.archiveId);
});

mixerTracks?.addEventListener("click", (event) => {
  const trackNode = event.target.closest("[data-mixer-track]");
  if (!trackNode || event.target.closest("[data-mixer-field]")) return;
  selectedMixerTrackId = trackNode.dataset.mixerTrack;
  renderMixer(timelineHistory?.present || currentTimelineProject());
});
mixerTracks?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const trackNode = event.target.closest("[data-mixer-track]");
  if (!trackNode) return;
  event.preventDefault();
  selectedMixerTrackId = trackNode.dataset.mixerTrack;
  renderMixer(timelineHistory?.present || currentTimelineProject());
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

timelineGrid?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const trackNode = event.target.closest("[data-timeline-track]");
  if (!trackNode) return;
  event.preventDefault();
  selectedMixerTrackId = trackNode.dataset.timelineTrack;
  renderTimeline();
  mixerInspector?.scrollIntoView({ behavior: "smooth", block: "nearest" });
});
timelineGrid?.addEventListener("click", (event) => {
  const trackNode = event.target.closest("[data-timeline-track]");
  if (trackNode && !event.target.closest("button")) {
    selectedMixerTrackId = trackNode.dataset.timelineTrack;
    renderTimeline();
    mixerInspector?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }
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
function pianoRollEvents() {
  const bpm = Math.max(40, Math.min(240, Number(projectTempo?.value) || 100));
  const stepDuration = 60 / bpm / 2;
  return [...(pianoRoll?.querySelectorAll("[data-piano-note].is-active") || [])].map((button) => ({
    note: button.dataset.pianoNote,
    time: Number(button.dataset.pianoStep || 0) * stepDuration,
    duration: stepDuration * 0.9,
    velocity: 0.82,
    instrument: "piano",
  }));
}
async function previewPianoRollSequence() {
  const events = pianoRollEvents();
  if (!events.length) return showToast("Activa pelo menos um passo no Piano Roll.");
  try {
    for (const event of events) {
      await playNote(event.note, { type: "triangle", duration: Math.min(0.35, event.duration), volume: event.velocity * 0.14 });
      await new Promise((resolve) => window.setTimeout(resolve, Math.max(0, event.duration * 1000 - 70)));
    }
    if (pianoRollStatus) pianoRollStatus.textContent = `${events.length} notas reproduzidas · ${Math.round((events.at(-1).time + events.at(-1).duration) * 1000) / 1000}s`;
  } catch (error) { showToast(error instanceof Error ? error.message : "Pré-escuta do Piano Roll falhou."); }
}
function addPianoRollToTimeline() {
  const events = pianoRollEvents();
  if (!events.length) return showToast("Activa pelo menos um passo no Piano Roll.");
  const duration = Math.max(0.25, events.reduce((latest, event) => Math.max(latest, event.time + event.duration), 0));
  const added = insertInstrumentClip({ name: "Piano Roll · sequência", type: "instrument", duration, metadata: { instrument: "piano", events, sequence: "piano-roll", bpm: Number(projectTempo?.value) || 100 } });
  if (added && pianoRollStatus) pianoRollStatus.textContent = `${events.length} notas materializadas na timeline · clip reversível.`;
}

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
  if (pianoRollStatus) pianoRollStatus.textContent = `${pianoRollEvents().length} passos activos · pronto para ouvir ou inserir.`;
  try { await playNote(button.dataset.pianoNote, { type: "triangle", duration: 0.28, volume: 0.11 }); } catch (error) { showToast(error.message); }
});
playPianoSequence?.addEventListener("click", previewPianoRollSequence);
addPianoTimeline?.addEventListener("click", addPianoRollToTimeline);
soundLibraryGrid?.addEventListener("click", async (event) => {
  const preview = event.target.closest("[data-sound-preview]");
  const add = event.target.closest("[data-sound-add]");
  if (!preview && !add) return;
  const item = getSoundLibraryItem((preview || add).dataset.soundPreview || (preview || add).dataset.soundAdd);
  if (preview) await previewSoundLibraryItem(item);
  else addSoundLibraryItem(item);
});
soundLibraryGrid?.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest("[data-sound-id]");
  if (!card) return;
  event.preventDefault();
  await previewSoundLibraryItem(getSoundLibraryItem(card.dataset.soundId));
});
soundLibraryGrid?.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-sound-id]");
  if (!card || !event.dataTransfer) return;
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("text/fernando-lucoco-sound", card.dataset.soundId);
  card.classList.add("is-dragging");
});
soundLibraryGrid?.addEventListener("dragend", (event) => event.target.closest("[data-sound-id]")?.classList.remove("is-dragging"));
timelineGrid?.addEventListener("dragover", (event) => {
  if (event.dataTransfer?.types.includes("text/fernando-lucoco-sound")) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    timelineGrid.classList.add("is-drop-target");
  }
});
timelineGrid?.addEventListener("dragleave", () => timelineGrid.classList.remove("is-drop-target"));
timelineGrid?.addEventListener("drop", (event) => {
  event.preventDefault();
  timelineGrid.classList.remove("is-drop-target");
  const id = event.dataTransfer?.getData("text/fernando-lucoco-sound");
  const item = getSoundLibraryItem(id);
  if (!item || !timelineGrid) return;
  const rect = timelineGrid.getBoundingClientRect();
  const start = Math.max(0, Math.min(39, ((event.clientX - rect.left) / Math.max(1, rect.width)) * 40));
  addSoundLibraryItem(item, start);
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

const aiTaskStation = document.querySelector(".ai-task-station");
const aiTaskStatus = document.querySelector("#ai-task-status");
aiTaskStation?.addEventListener("click", (event) => {
  const task = event.target.closest("[data-studio-target]");
  if (!task) return;
  const target = document.getElementById(task.dataset.studioTarget);
  if (!target) {
    if (aiTaskStatus) aiTaskStatus.textContent = "Esta tarefa ainda não tem um módulo disponível.";
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("is-task-focused");
  window.setTimeout(() => target.classList.remove("is-task-focused"), 1100);
  const label = task.querySelector("strong")?.textContent || "Tarefa";
  if (aiTaskStatus) aiTaskStatus.textContent = `${label}: módulo aberto. A execução depende de uma take ou beat disponível.`;
});
