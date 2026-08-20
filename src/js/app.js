import { blobToDataUrl, dataUrlToBlob, escapeHtml, getFileExtension, makeProjectId, readProjects, saveProjects } from "./storage.js";
import { bindPlayerEvents } from "./player.js";
import { buildProducerPlan, producerPlanClipSpecs, applyProducerMix } from "./producer-plan.js";
import { analyzeAudioDataUrl } from "./audio-analysis.js";
import { applyAutoTuneLocal, autoTuneParameters, autoTuneCorrectionFromPitch, detectPitchNotes, applyCompressor, applyFade, applyGain, applyNormalize, applyPitchCorrectionAssist, applyVocalEnhancement, applyVoiceCleanerLocal, applyVoiceChangerLocal, applyHarmonyLocal, applyVoiceCharacterLocal, voiceCharacterParameters, harmonyParameters, applyMasteringLocal, applyReverbLocal, applyDelayLocal, spatialEffectParameters, audioBufferToWav } from "./effects.js";
import { createRecorderController } from "./recorder.js";
import { addClip, addTrack, createProject, normalizeProject, updateTrack } from "./studio/project-model.js";
import { createHistoryState, canRedo, canUndo, commitHistory, redoHistory, undoHistory } from "./studio/history.js";
import { deleteClip, duplicateClip, moveClip, setClipFade, setClipGain, splitClip, trimClip } from "./studio/timeline.js";
import { ensureAudioContextRunning, getAudioContext, playChord, playDrumHit, playNote, playPattern, playSequence } from "./studio/audio-engine.js";
import { createSamplerState, playSamplerVoice, updateSamplerState } from "./studio/sampler.js";
import { createGridEvents } from "./studio/sequencer.js";
import { getBeatPreset } from "./studio/instruments.js";
import { SOUND_LIBRARY, filterSoundLibrary, getSoundLibraryItem, soundLibraryClip } from "./studio/sound-library.js";
import { filterMySounds, listMySounds, putMySound, updateMySound, deleteMySound, getMySoundBlob } from "./studio/my-sounds.js";
import { isInstrumentClip, renderInstrumentClip } from "./studio/instrument-renderer.js";
import { renderTimelineToWav, calculateLoudnessMetrics } from "./studio/mixdown.js";
import { createProjectManifest, downloadBlob, exportVariantFilename, preferredExportVariant, projectManifestFilename } from "./export-audio.js";
import { deriveProducerStudioState } from "./producer-studio-flow.js";
import { ACTION_FEEDBACK_STATES, actionFeedbackLabel, transitionActionFeedback } from "./action-feedback.js";
import { materializeProducerPlan, trackOrigin } from "./producer-arrangement.js";
import { buildProducerActionPlan, producerActionLabel } from "./producer-actions.js";
import { requestProductionAdvice } from "./ai-producer-client.js";
import { isFirebaseSignedIn, listCloudProjects, saveCloudProject, cloudProjectToLocal } from "./firebase-projects.js";
import { uploadUserMedia } from "./firebase-media.js";
import { auth } from "./firebase-client.js";
import { adviceToProducerPlan } from "./ai-advice-to-plan.js";
import { createImportedBeat, revokeImportedBeat } from "./beat-import.js";
import { createLooperState, addLooperLayer, removeLastLooperLayer, toggleLooperLayerMute, materializeLooperClip, looperSummary } from "./studio/looper.js";
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
import { estimateMasterMeter, estimateTrackMeter } from "./studio/mixer-meters.js";
import { AUTOMATION_TARGETS_LIST, normalizeTrackAutomation, upsertAutomationPoint, removeAutomationPoint } from "./studio/automation.js";
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
const recordInputLevel = document.getElementById("record-input-level");
const recordPeakBar = document.getElementById("record-peak-bar");
const recordPeakValue = document.getElementById("record-peak-value");
const recordLatency = document.getElementById("record-latency");
const recordInputDevice = document.getElementById("record-input-device");
const recordMonitorToggle = document.getElementById("record-monitor-toggle");
const recordMonitorVolume = document.getElementById("record-monitor-volume");
const recordMonitorVolumeValue = document.getElementById("record-monitor-volume-value");
const timer = document.getElementById("timer");
const recordLabel = document.getElementById("record-label");
const list = document.getElementById("project-list");
const recentProjects = document.getElementById("studio-recent-projects");
const projectsHubList = document.getElementById("projects-hub-list");
const projectsHubSearch = document.getElementById("projects-hub-search");
const projectSearch = document.getElementById("project-search");
const projectFilter = document.getElementById("project-filter");
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
const controlRoomTrackList = document.getElementById("control-room-track-list");
const instrumentSessionSummary = document.getElementById("instrument-session-summary");
const instrumentSessionTracks = document.getElementById("instrument-session-tracks");
const mixerTracks = document.getElementById("mixer-tracks");
const mixerInspector = document.getElementById("mixer-inspector");
const mixerHeadroom = document.getElementById("mixer-headroom");
const mixerMasterGain = document.getElementById("mixer-master-gain");
const mixerMasterGainValue = document.getElementById("mixer-master-gain-value");
const mixerMasterPan = document.getElementById("mixer-master-pan");
const mixerMasterPanValue = document.getElementById("mixer-master-pan-value");
const mixerMasterLimiter = document.getElementById("mixer-master-limiter");
const mixerMasterLimiterValue = document.getElementById("mixer-master-limiter-value");
const mixerMasterBypass = document.getElementById("mixer-master-bypass");
const mixerMasterPeak = document.getElementById("mixer-master-peak");
const addTrackButton = document.getElementById("add-track");
const addTrackType = document.getElementById("add-track-type");
const timelineMixdownButton = document.getElementById("timeline-mixdown");
const timelineUndoButton = document.getElementById("timeline-undo");
const timelineRedoButton = document.getElementById("timeline-redo");
const timelineSaveButton = document.getElementById("timeline-save");
const timelineShareButton = document.getElementById("timeline-share");
const timelineExportButton = document.getElementById("timeline-export");
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
const keyboardOctave = document.getElementById("keyboard-octave");
const keyboardVelocity = document.getElementById("keyboard-velocity");
const keyboardVelocityValue = document.getElementById("keyboard-velocity-value");
const keyboardSustain = document.getElementById("keyboard-sustain");
const keyboardQuantize = document.getElementById("keyboard-quantize");
const keyboardMidiRecord = document.getElementById("keyboard-midi-record");
const keyboardMidiStatus = document.getElementById("keyboard-midi-status");
const samplerSource = document.getElementById("sampler-source");
const samplerStart = document.getElementById("sampler-start");
const samplerStartValue = document.getElementById("sampler-start-value");
const samplerEnd = document.getElementById("sampler-end");
const samplerEndValue = document.getElementById("sampler-end-value");
const samplerPitch = document.getElementById("sampler-pitch");
const samplerPitchValue = document.getElementById("sampler-pitch-value");
const samplerReverse = document.getElementById("sampler-reverse");
const samplerLoop = document.getElementById("sampler-loop");
const samplerFilter = document.getElementById("sampler-filter");
const samplerPreview = document.getElementById("sampler-preview");
const samplerStatus = document.getElementById("sampler-status");
const looperDuration = document.getElementById("looper-duration");
const looperQuantize = document.getElementById("looper-quantize");
const looperOverdub = document.getElementById("looper-overdub");
const looperAddLayer = document.getElementById("looper-add-layer");
const looperUndoLayer = document.getElementById("looper-undo-layer");
const looperMaterialize = document.getElementById("looper-materialize");
const looperLayers = document.getElementById("looper-layers");
const looperStatus = document.getElementById("looper-status");
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
const soundLibraryQuery = document.getElementById("sound-library-query");
const soundLibraryCategory = document.getElementById("sound-library-category");
const soundLibraryGenre = document.getElementById("sound-library-genre");
const soundLibraryMood = document.getElementById("sound-library-mood");
const soundLibraryFavoritesOnly = document.getElementById("sound-library-favorites-only");
const mySoundsForm = document.getElementById("my-sounds-form");
const mySoundsFile = document.getElementById("my-sounds-file");
const mySoundsName = document.getElementById("my-sounds-name");
const mySoundsFolder = document.getElementById("my-sounds-folder");
const mySoundsTags = document.getElementById("my-sounds-tags");
const mySoundsQuery = document.getElementById("my-sounds-query");
const mySoundsFolderFilter = document.getElementById("my-sounds-folder-filter");
const mySoundsFavoritesOnly = document.getElementById("my-sounds-favorites-only");
const mySoundsGrid = document.getElementById("my-sounds-grid");
const mySoundsStatus = document.getElementById("my-sounds-status");
const mySoundsCloudUpload = document.getElementById("my-sounds-cloud-upload");
const studioLiveProjectCount = document.getElementById("studio-live-project-count");
const studioLiveClipCount = document.getElementById("studio-live-clip-count");
const studioLiveSoundCount = document.getElementById("studio-live-sound-count");
const studioLiveAudioState = document.getElementById("studio-live-audio-state");
const studioLiveStatusLabel = document.getElementById("studio-live-status-label");
const studioLiveStatusDetail = document.getElementById("studio-live-status-detail");
const beatPreset = document.getElementById("beat-preset");
const applyBeatPreset = document.getElementById("apply-beat-preset");
const playBeatSequence = document.getElementById("play-beat-sequence");
const resetBeat = document.getElementById("reset-beat");
const addChordTimeline = document.getElementById("add-chord-timeline");
const addGuitarTimeline = document.getElementById("add-guitar-timeline");
const addBeatTimeline = document.getElementById("add-beat-timeline");
const beatKit = document.getElementById("beat-kit");
const beatSwing = document.getElementById("beat-swing");
const beatSwingValue = document.getElementById("beat-swing-value");
const beatVelocity = document.getElementById("beat-velocity");
const beatVelocityValue = document.getElementById("beat-velocity-value");
const beatLoop = document.getElementById("beat-loop");
const beatLoopCount = document.getElementById("beat-loop-count");
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
const voiceCleanerAnalyze = document.getElementById("voice-cleaner-analyze");
const voiceCleanerNoise = document.getElementById("voice-cleaner-noise");
const voiceCleanerDereverb = document.getElementById("voice-cleaner-dereverb");
const voiceCleanerAutoEq = document.getElementById("voice-cleaner-autoeq");
const voiceCleanerPreview = document.getElementById("voice-cleaner-preview");
const voiceCleanerApply = document.getElementById("voice-cleaner-apply");
const voiceCleanerReset = document.getElementById("voice-cleaner-reset");
const voiceCleanerAnalysis = document.getElementById("voice-cleaner-analysis");
const voiceCleanerStatus = document.getElementById("voice-cleaner-status");
const voiceChangerCharacter = document.getElementById("voice-changer-character");
const voiceChangerPreview = document.getElementById("voice-changer-preview");
const voiceChangerApply = document.getElementById("voice-changer-apply");
const voiceChangerReset = document.getElementById("voice-changer-reset");
const voiceChangerStatus = document.getElementById("voice-changer-status");
const harmonyIntensity = document.getElementById("harmony-intensity");
const harmonyIntensityValue = document.getElementById("harmony-intensity-value");
const harmonyPreview = document.getElementById("harmony-preview");
const harmonyApply = document.getElementById("harmony-apply");
const harmonyReset = document.getElementById("harmony-reset");
const voiceCharacterProfile = document.getElementById("voice-character-profile");
const voiceCharacterIntensity = document.getElementById("voice-character-intensity");
const voiceCharacterIntensityValue = document.getElementById("voice-character-intensity-value");
const voiceCharacterPreview = document.getElementById("voice-character-preview");
const voiceCharacterApply = document.getElementById("voice-character-apply");
const voiceCharacterReset = document.getElementById("voice-character-reset");
const voiceCharacterStatus = document.getElementById("voice-character-status");
const harmonyStatus = document.getElementById("harmony-status");
const producerSavePreset = document.getElementById("producer-save-preset");
const producerPresetSelect = document.getElementById("producer-preset-select");
const producerDeletePreset = document.getElementById("producer-delete-preset");
const producerPresetStatus = document.getElementById("producer-preset-status");
const automixGenre = document.getElementById("automix-genre");
const automixPreview = document.getElementById("automix-preview");
const automixApply = document.getElementById("automix-apply");
const automixReset = document.getElementById("automix-reset");
const automixStatus = document.getElementById("automix-status");
const automixSummary = document.getElementById("automix-summary");
const masteringPreset = document.getElementById("mastering-preset");
const masteringIntensity = document.getElementById("mastering-intensity");
const masteringLoudness = document.getElementById("mastering-loudness");
const masteringDynamics = document.getElementById("mastering-dynamics");
const masteringStereo = document.getElementById("mastering-stereo");
const masteringEq = document.getElementById("mastering-eq");
const masteringPreview = document.getElementById("mastering-preview");
const masteringApply = document.getElementById("mastering-apply");
const masteringReset = document.getElementById("mastering-reset");
const masteringStatus = document.getElementById("mastering-status");
const masteringBefore = document.getElementById("mastering-before");
const masteringAfter = document.getElementById("mastering-after");
const producerExport = document.getElementById("producer-export");
const producerExportProject = document.getElementById("producer-export-project");
const producerActionFeedback = document.getElementById("producer-action-feedback");
const producerCommandStatus = document.getElementById("producer-command-status");
const producerActionButtons = [...document.querySelectorAll("[data-producer-action]")];
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
let voiceCleanerPreviewUrl = "";
let masteringPreviewUrl = "";
let activePitchNotes = [];
let pitchCurveZoom = 1;
let pitchCurvePan = 0;
let pitchCurveDrag = null;
let cloudAutosaveTimer = null;
let activeTimelineId = null;
let timelineHistory = null;
let timelineClipboard = null;
let keyboardMidiRecording = null;
let samplerState = createSamplerState();
let looperState = createLooperState();
const samplerBuffers = new Map();
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
  cleaned: { label: "Voice Cleaned", kind: "cleaned" },
  mastered: { label: "Mastered", kind: "mastered" },
  voiceChanged: { label: "Voice Changed", kind: "voiceChanged" },
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

async function resolveVocalSourceBlob(project) {
  const direct = getVariantData(project, "original");
  if (direct) return dataUrlToBlob(direct);
  const candidates = (project?.tracks || []).flatMap((track) => (track.clips || []).map((clip) => ({ track, clip })))
    .filter(({ track, clip }) => ["vocal", "audio", "sample"].includes(track.type) || clip.metadata?.origin === "my-sounds");
  for (const { clip } of candidates) {
    try {
      if (clip.metadata?.origin === "my-sounds" && clip.metadata.mySoundId) {
        const blob = await getMySoundBlob(clip.metadata.mySoundId);
        if (blob) return blob;
      }
      if (clip.audioData) return dataUrlToBlob(clip.audioData);
      if (clip.blobKey?.startsWith(`${project.id}:`) && await indexedDbAvailable()) {
        const kind = clip.blobKey.slice(`${project.id}:`.length);
        const blob = await getAudioBlob(project.id, kind);
        if (blob) return blob;
      }
    } catch (error) {
      console.warn("Fonte vocal local indisponível para análise", error);
    }
  }
  return null;
}

async function resolveVocalSourceData(project) {
  const blob = await resolveVocalSourceBlob(project);
  return blob ? blobToDataUrl(blob) : "";
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
  pianoRoll.innerHTML = Array.from({ length: 16 }, (_, index) => `<button class="piano-step" type="button" data-piano-note="${index % 8 === 0 ? "C4" : index % 8 === 2 ? "E4" : index % 8 === 4 ? "G4" : "C5"}" data-piano-step="${index}" data-piano-velocity="0.82" data-piano-duration="0.9" aria-label="Passo ${index + 1}">${index + 1}</button>`).join("");
}
if (beatGrid) {
  const channels = ["kick", "snare", "clap", "hihat", "percussion", "bass"];
  beatGrid.innerHTML = channels.map((channel) => `<div class="beat-row"><span class="beat-label">${channel}</span>${Array.from({ length: 16 }, (_, step) => `<button class="beat-step" type="button" data-beat-channel="${channel}" data-beat-step="${step}" aria-label="${channel} passo ${step + 1}"></button>`).join("")}</div>`).join("");
}
function pianoRollStorageKey() { return `fernando-lucoco-music:piano-roll:${activeTimelineId || "draft"}`; }
function savePianoRollEdits() {
  if (!pianoRoll) return;
  const notes = [...pianoRoll.querySelectorAll("[data-piano-note]")].map((button) => ({
    step: Number(button.dataset.pianoStep || 0),
    note: button.dataset.pianoNote,
    velocity: Number(button.dataset.pianoVelocity || 0.82),
    duration: Number(button.dataset.pianoDuration || 0.9),
    active: button.classList.contains("is-active"),
  }));
  try { window.localStorage.setItem(pianoRollStorageKey(), JSON.stringify(notes)); } catch {}
}
function restorePianoRollEdits() {
  if (!pianoRoll) return;
  try {
    const saved = JSON.parse(window.localStorage.getItem(pianoRollStorageKey()) || "null");
    if (!Array.isArray(saved)) return;
    saved.forEach((item) => {
      const button = pianoRoll.querySelector(`[data-piano-step="${Number(item.step) || 0}"]`);
      if (!button) return;
      if (item.note) {
        button.dataset.pianoNote = String(item.note);
        button.textContent = String(item.note).replace(/[0-9]/g, "");
      }
      button.dataset.pianoVelocity = Math.max(0.1, Math.min(1, Number(item.velocity) || 0.82)).toFixed(2);
      button.dataset.pianoDuration = Math.max(0.25, Math.min(2, Number(item.duration) || 0.9)).toFixed(2);
      button.classList.toggle("is-active", item.active !== false);
      button.title = `${button.dataset.pianoNote} · velocity ${button.dataset.pianoVelocity} · duração ${button.dataset.pianoDuration}`;
    });
  } catch {}
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

function formatMeterDb(value) { return Number.isFinite(value) ? `${value.toFixed(1)} dB` : "−∞ dB"; }

function setRecordingMetrics({ inputDb = -Infinity, peakDb = -Infinity, latencyMs = null, active = false } = {}) {
  if (recordInputLevel) recordInputLevel.textContent = formatMeterDb(inputDb);
  if (recordPeakValue) recordPeakValue.textContent = formatMeterDb(peakDb);
  if (recordPeakBar) recordPeakBar.style.width = `${Math.max(0, Math.min(100, Number.isFinite(peakDb) ? ((peakDb + 60) / 60) * 100 : 0))}%`;
  if (recordLatency) recordLatency.textContent = Number.isFinite(latencyMs) ? `${Math.round(latencyMs)} ms` : "—";
  document.body.classList.toggle("is-recording", active);
}

async function loadRecordInputDevices() {
  if (!navigator.mediaDevices?.enumerateDevices || !recordInputDevice) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter((device) => device.kind === "audioinput");
    recordInputDevice.innerHTML = `<option value="default">Microfone predefinido</option>${inputs.map((device, index) => `<option value="${escapeHtml(device.deviceId || `input-${index}`)}">${escapeHtml(device.label || `Microfone ${index + 1}`)}</option>`).join("")}`;
  } catch { /* Alguns browsers só revelam dispositivos depois da permissão. */ }
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
  const availableVariants = {
    original: getVariantData(project, "original"),
    mixed: getVariantData(project, "mixed"),
    mastered: getVariantData(project, "mastered"),
  };
  const variant = preferredExportVariant(project, availableVariants);
  const exportData = availableVariants[variant];
  setProducerActionFeedback("export", "start");
  if (!project || !exportData || variant === "original") {
    setProducerActionFeedback("export", "error", "Cria primeiro o Mixed através do Mixdown local.");
    showToast("Primeiro cria o Mixed através do Mixdown local.");
    return;
  }
  try {
    const exportBlob = await dataUrlToBlob(exportData);
    downloadBlob(exportBlob, exportVariantFilename(project.name, variant));
    setProducerActionFeedback("export", "success");
    showToast(`A versão ${variant === "mastered" ? "Mastered" : "Mixed"} foi exportada em WAV.`);
  } catch (error) {
    console.error(`Exportação ${variant} falhou`, error);
    setProducerActionFeedback("export", "error", "Não foi possível preparar o WAV. Tenta novamente.");
    showToast("Não foi possível exportar a faixa. Tenta novamente neste navegador.");
  }
}

function currentTimelineProject() {
  const projects = readProjects();
  return projects.find((project) => project.id === activeTimelineId) || projects[0] || null;
}
function ensureProductionSession(name = "Nova sessão de produção") {
  if (activeTimelineId && timelineHistory) {
    const active = currentTimelineProject();
    if (active) return active;
  }
  const existing = readProjects()[0];
  if (existing) {
    syncTimelineHistory(existing);
    return existing;
  }
  const created = normalizeProject(createProject({ name }));
  saveProjects([created]);
  syncTimelineHistory(created);
  renderProjects();
  showToast("Sessão de produção criada. Já podes adicionar instrumental ou áudio.");
  return created;
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
  const vocalBlob = await resolveVocalSourceBlob(project);
  const vocalReady = Boolean(vocalBlob);
  if (producerBeatPreview) producerBeatPreview.disabled = !ready;
  if (producerAnalyzePitch) producerAnalyzePitch.disabled = !vocalReady;
  if (producerApplyAutoTune) producerApplyAutoTune.disabled = !vocalReady;
  if (producerResetAutoTune) producerResetAutoTune.disabled = !project?.audioVariants?.pitchCorrected;
  if (producerApplySpace) producerApplySpace.disabled = !vocalReady;
  if (producerResetSpace) producerResetSpace.disabled = !project?.audioVariants?.spatial;
  if (harmonyPreview) harmonyPreview.disabled = !vocalReady;
  if (harmonyApply) harmonyApply.disabled = !vocalReady;
  if (harmonyReset) harmonyReset.disabled = !project?.audioVariants?.harmony;
  if (voiceCharacterPreview) voiceCharacterPreview.disabled = !vocalReady;
  if (voiceCharacterApply) voiceCharacterApply.disabled = !vocalReady;
  if (voiceCharacterReset) voiceCharacterReset.disabled = !project?.audioVariants?.voiceCharacter;
  if (harmonyStatus && project?.audioVariants?.harmony) harmonyStatus.textContent = `Harmony disponível · ${Math.round((project.audioVariants.harmony.intensity || 0) * 100)}%`;
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
  await drawBlobWaveform(vocalBlob, producerVocalWaveform, producerVocalWaveformStatus, "#f06aa8");
}
async function importProducerBeat(file) {
  const project = ensureProductionSession("Beat Studio");
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
  const project = currentTimelineProject();
  const availableVariants = {
    original: getVariantData(project, "original"),
    mixed: getVariantData(project, "mixed"),
    mastered: getVariantData(project, "mastered"),
  };
  const variant = preferredExportVariant(project, availableVariants);
  const exportData = availableVariants[variant];
  if (!project || !exportData || variant === "original") return showToast("Cria primeiro o Mixed para partilhar a faixa final.");
  try {
    const blob = await dataUrlToBlob(exportData);
    const file = new File([blob], exportVariantFilename(project.name, variant), { type: "audio/wav" });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) { await navigator.share({ title: `${project.name} · Fernando Lucoco Music`, text: `Faixa final ${variant === "mastered" ? "Mastered" : "Mixed"} Vocal + beat`, files: [file] }); showToast("Faixa partilhada através do dispositivo."); }
    else { await exportMixedVersion(project.id); showToast("Partilha directa indisponível; o WAV foi descarregado como fallback."); }
  } catch (error) { if (error?.name !== "AbortError") { console.warn("Partilha falhou", error); await exportMixedVersion(project.id); } }
}
async function analyzeProducerPitch() {
  const project = currentTimelineProject();
  const sourceData = await resolveVocalSourceData(project);
  if (!project || !sourceData) return showToast("Grava ou adiciona um clip vocal à sessão.");
  if (producerAnalyzePitch) producerAnalyzePitch.disabled = true;
  if (producerPitchStatus) producerPitchStatus.textContent = "A analisar pitch nota-a-nota localmente…";
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio API indisponível neste navegador.");
    const context = new AudioContextClass();
    const buffer = await context.decodeAudioData(await (await dataUrlToBlob(sourceData)).arrayBuffer());
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
  const sourceData = await resolveVocalSourceData(project);
  if (!project || !sourceData) return showToast("Grava ou adiciona um clip vocal à sessão.");
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

function masteringParameters() {
  return {
    preset: masteringPreset?.value || "natural",
    intensity: Number(masteringIntensity?.value || 55),
    loudness: Number(masteringLoudness?.value || 70),
    dynamics: Number(masteringDynamics?.value || 50),
    stereo: Number(masteringStereo?.value || 50),
    eq: Number(masteringEq?.value || 50),
  };
}

function updateMasteringControls() {
  const controls = [
    [masteringIntensity, document.getElementById("mastering-intensity-value")],
    [masteringLoudness, document.getElementById("mastering-loudness-value")],
    [masteringDynamics, document.getElementById("mastering-dynamics-value")],
    [masteringStereo, document.getElementById("mastering-stereo-value")],
    [masteringEq, document.getElementById("mastering-eq-value")],
  ];
  controls.forEach(([input, output]) => { if (input && output) output.textContent = `${input.value}%`; });
}

async function createMasteredBlob(project) {
  const mixedData = getVariantData(project, "mixed");
  if (!mixedData) throw new Error("Cria primeiro um Mixed para iniciar o Mastering.");
  return applyMasteringLocal(await dataUrlToBlob(mixedData), masteringParameters());
}
async function measureLufsFromBlob(blob) {
  if (!blob) return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  const context = new AudioContextClass();
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    const left = buffer.getChannelData(0);
    const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
    return calculateLoudnessMetrics(left, right, buffer.sampleRate);
  } finally {
    await context.close();
  }
}
function formatMasteringLufs(metrics) {
  if (!metrics) return "LUFS indisponível";
  return `LUFS integrado ${metrics.integratedLufs.toFixed(1)} · short-term ${metrics.shortTermLufs.toFixed(1)}`;
}

async function previewMastering() {
  const project = currentTimelineProject();
  if (!project || !getVariantData(project, "mixed")) {
    if (masteringStatus) masteringStatus.textContent = "Mixed necessário para iniciar o Mastering.";
    return showToast("Cria primeiro um Mixed através do Mixdown local.");
  }
  if (masteringPreview) masteringPreview.disabled = true;
  if (masteringStatus) masteringStatus.textContent = "A preparar comparação Before / After…";
  try {
    const mixedBlob = await dataUrlToBlob(getVariantData(project, "mixed"));
    const blob = await createMasteredBlob(project);
    const [beforeMetrics, afterMetrics] = await Promise.all([measureLufsFromBlob(mixedBlob), measureLufsFromBlob(blob)]);
    masteringPreviewUrl = await blobToDataUrl(blob);
    producerPreviewAudio?.pause();
    producerPreviewAudio = new Audio(masteringPreviewUrl);
    producerPreviewAudio.playsInline = true;
    producerPreviewAudio.onended = () => { producerPreviewAudio = null; };
    masteringBefore.textContent = `Before · Mixed · ${formatMasteringLufs(beforeMetrics)}`;
    masteringAfter.textContent = `After · ${masteringParameters().preset} · ${formatMasteringLufs(afterMetrics)}`;
    await producerPreviewAudio.play();
    if (masteringStatus) masteringStatus.textContent = "After em reprodução · o Mixed permanece intacto.";
  } catch (error) {
    if (masteringStatus) masteringStatus.textContent = error instanceof Error ? error.message : "Não foi possível preparar o preview.";
    showToast(error instanceof Error ? error.message : "Preview de Mastering falhou.");
  } finally {
    if (masteringPreview) masteringPreview.disabled = false;
  }
}

async function applyMasteringFromUi() {
  const project = currentTimelineProject();
  if (!project || !getVariantData(project, "mixed")) return showToast("Cria primeiro um Mixed através do Mixdown local.");
  if (masteringApply) masteringApply.disabled = true;
  if (masteringStatus) masteringStatus.textContent = "A aplicar cadeia Mastering local…";
  try {
    const parameters = masteringParameters();
    const mixedBlob = await dataUrlToBlob(getVariantData(project, "mixed"));
    const blob = await createMasteredBlob(project);
    const [beforeMetrics, afterMetrics] = await Promise.all([measureLufsFromBlob(mixedBlob), measureLufsFromBlob(blob)]);
    const data = await blobToDataUrl(blob);
    const updated = readProjects().map((item) => item.id === project.id ? {
      ...item,
      audioVariants: { ...(item.audioVariants || {}), mastered: { data, mimeType: "audio/wav", bytes: blob.size, source: "local-mastering", parameters, sourceVariant: "mixed", updatedAt: new Date().toISOString() } },
      masteringApplied: true,
      masteringParameters: parameters,
      status: "Mastered WAV disponível",
    } : item);
    saveProjects(updated);
    if (await indexedDbAvailable()) await Promise.all([
      putAudioBlob(project.id, "mastered", blob),
      putEffect({ id: `${project.id}:mastering`, projectId: project.id, type: "mastering-local", parameters, createdAt: new Date().toISOString() }),
      putProject(updated.find((item) => item.id === project.id)),
    ]);
    masteringBefore.textContent = `Before · Mixed · ${formatMasteringLufs(beforeMetrics)}`;
    masteringAfter.textContent = `After · ${parameters.preset} aplicado · ${formatMasteringLufs(afterMetrics)}`;
    if (masteringStatus) masteringStatus.textContent = "Mastering aplicado · variante reversível guardada localmente.";
    renderProjects();
    renderProducerStudio();
    updateABMeters();
    showToast("Mastering local aplicado. O Mixed e o Original continuam preservados.");
  } catch (error) {
    if (masteringStatus) masteringStatus.textContent = error instanceof Error ? error.message : "Não foi possível aplicar o Mastering.";
    showToast(error instanceof Error ? error.message : "Mastering local falhou.");
  } finally {
    if (masteringApply) masteringApply.disabled = !Boolean(getVariantData(currentTimelineProject(), "mixed"));
  }
}

async function resetMastering() {
  const project = currentTimelineProject();
  if (!project) return;
  const updated = readProjects().map((item) => {
    if (item.id !== project.id) return item;
    const variants = { ...(item.audioVariants || {}) };
    delete variants.mastered;
    return { ...item, audioVariants: variants, masteringApplied: false, masteringParameters: null, status: "Mastering revertido; Mixed preservado" };
  });
  saveProjects(updated);
  try {
    if (await indexedDbAvailable()) await Promise.all([deleteAudioBlob(project.id, "mastered"), deleteEffect(project.id, "mastering"), putProject(updated.find((item) => item.id === project.id))]);
  } catch { showToast("A variante Mastered foi removida localmente; a limpeza IndexedDB será tentada novamente."); }
  masteringBefore.textContent = "Before · Mixed";
  masteringAfter.textContent = "After · Ainda não aplicado";
  if (masteringStatus) masteringStatus.textContent = "Mastering revertido · Mixed preservado.";
  renderProjects();
  renderProducerStudio();
  showToast("Mastering revertido. O Mixed e o Original continuam disponíveis.");
}

async function mixImportedBeatWithVocal() {
  const project = currentTimelineProject();
  const beat = project?.importedBeat;
  const vocalVariant = getVariantData(project, "harmony") ? "harmony" : (getVariantData(project, "pitchCorrected") ? "pitchCorrected" : (getVariantData(project, "enhanced") ? "enhanced" : "original"));
  const vocalData = getVariantData(project, vocalVariant);
  const beatBlob = project ? await resolveBeatBlob(project) : null;
  if (!project || !beatBlob || !vocalData) return showToast("Precisas de uma take vocal e de um beat importado.");
  producerVocalBeatMix.disabled = true;
  producerBeatStatus.textContent = "A preparar Vocal + beat local…";
  try {
    const vocalKey = `${project.id}:${vocalVariant === "harmony" ? "harmony" : vocalVariant === "pitchCorrected" ? "pitch-corrected" : vocalVariant}`;
    const beatKey = `${project.id}:imported-beat`;
    let arrangement = normalizeProject({ ...project, tracks: [] });
    arrangement = addTrack(arrangement, { id: `${project.id}-vocal`, name: "Vocal processado", type: "audio", color: "#f06aa8" });
    arrangement = addTrack(arrangement, { id: `${project.id}-beat`, name: `Beat · ${beat.name}`, type: "audio", color: "#62d6c7" });
    arrangement = addClip(arrangement, `${project.id}-vocal`, { id: `${project.id}-vocal-clip`, blobKey: vocalKey, name: `Vocal · ${vocalVariant === "harmony" ? "Harmony" : vocalVariant}`, duration: Number(project.duration || 0), mimeType: "audio/wav", gain: 1 });
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
    showToast(`Vocal ${vocalVariant === "harmony" ? "Harmony" : vocalVariant} + beat misturados localmente. A faixa final está pronta para exportar; Original e variantes continuam reversíveis.`);
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
  restorePianoRollEdits();
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
  if (clip?.audioData) return clip.audioData;
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

function renderControlRoomTracks(project) {
  if (!controlRoomTrackList) return;
  const tracks = Array.isArray(project?.tracks) ? project.tracks : [];
  const clipCount = tracks.reduce((total, track) => total + (Array.isArray(track.clips) ? track.clips.length : 0), 0);
  const duration = getTimelineDuration(project);
  if (instrumentSessionSummary) instrumentSessionSummary.textContent = project ? `${tracks.length} Audio Track${tracks.length === 1 ? "" : "s"} · ${clipCount} clip${clipCount === 1 ? "" : "s"} · ${duration.toFixed(1)}s · persistência local activa.` : "Abre uma sessão para materializar sons.";
  if (instrumentSessionTracks) instrumentSessionTracks.textContent = tracks.length ? tracks.map((track) => track.name || "Track").join(" · ") : "Ainda sem Audio Tracks.";
  if (!tracks.length) {
    controlRoomTrackList.innerHTML = '<div class="control-room-track-row"><div class="track-identity"><span class="track-color fx"></span><div><strong>Sessão sem tracks</strong><small>Cria um instrumental ou grava uma take</small></div></div><div class="track-lane track-lane-fx"><span>O áudio materializado aparecerá aqui.</span></div><div class="track-actions"><button class="mini-button" type="button" data-studio-area="instrument-lab">Abrir Sons</button></div></div>';
    return;
  }
  const colorFor = (track) => track.type === "vocal" ? "vocal" : ["drums", "beat", "instrument"].includes(track.type) ? "beat" : "fx";
  controlRoomTrackList.innerHTML = project.tracks.map((track) => {
    const clips = Array.isArray(track.clips) ? track.clips : [];
    const duration = clips.reduce((max, clip) => Math.max(max, Number(clip.start || 0) + Number(clip.duration || 0)), 0);
    const clipSummary = clips.length ? clips.map((clip) => `${escapeHtml(clip.name || "Clip") } · ${Number(clip.duration || 0).toFixed(1)}s`).join(" · ") : "Sem clips nesta faixa";
    const laneClass = colorFor(track) === "beat" ? " track-lane-beat" : colorFor(track) === "fx" ? " track-lane-fx" : "";
    return `<div class="control-room-track-row" data-control-room-track="${escapeHtml(track.id)}"><div class="track-identity"><span class="track-color ${colorFor(track)}"></span><div><strong>${escapeHtml(track.name || "Track")}</strong><small>${escapeHtml(track.type || "audio")} · ${clips.length} clip${clips.length === 1 ? "" : "s"} · ${duration.toFixed(1)}s</small></div></div><div class="track-lane${laneClass}"><span>${clipSummary}</span></div><div class="track-actions"><button class="mini-button" type="button" data-studio-area="mixer-panel">Abrir Mix</button></div></div>`;
  }).join("");
}

function renderTimeline() {
  refreshSamplerSources();
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
  renderControlRoomTracks(normalized);
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
      return `<div class="timeline-clip" style="left:${left}%;width:${width}%" title="${escapeHtml(clip.name)}"><strong>${escapeHtml(clip.name)}</strong><small>${clip.duration.toFixed(1)}s · ${clip.gain.toFixed(2)}x · offset ${clip.sourceOffset.toFixed(1)}s</small><div class="clip-actions"><button class="mini-button" type="button" data-clip-action="move-left" data-clip-key="${key}">←</button><button class="mini-button" type="button" data-clip-action="move-right" data-clip-key="${key}">→</button><button class="mini-button" type="button" data-clip-action="trim" data-clip-key="${key}">Trim</button><button class="mini-button" type="button" data-clip-action="split" data-clip-key="${key}">Split</button><button class="mini-button" type="button" data-clip-action="shorter" data-clip-key="${key}">−Len</button><button class="mini-button" type="button" data-clip-action="longer" data-clip-key="${key}">+Len</button><button class="mini-button" type="button" data-clip-action="fade" data-clip-key="${key}">Fade</button><button class="mini-button" type="button" data-clip-action="gain" data-clip-key="${key}">Gain</button><button class="mini-button" type="button" data-copy-clip="${key}">Copiar</button><button class="mini-button" type="button" data-paste-clip="${key}">Colar</button><button class="mini-button" type="button" data-duplicate-clip="${key}">Duplicar</button><button class="mini-button danger" type="button" data-delete-clip="${key}">Apagar</button></div></div>`;
    }).join("");
    const selected = track.id === selectedMixerTrackId ? " is-selected" : "";
    return `<div class="timeline-track timeline-track--${origin}${selected}" data-track-origin="${origin}" data-timeline-track="${escapeHtml(track.id)}" tabindex="0" aria-label="${escapeHtml(track.name)} · ${originDescription}"><div class="timeline-track-label"><div class="timeline-track-name"><span>${escapeHtml(track.name)}</span><span class="timeline-origin-badge timeline-origin-badge--${origin}" title="${originDescription}">${originLabel}</span></div><small>${escapeHtml(track.type)} · ${originDescription}</small><div class="timeline-track-switches" role="group" aria-label="Controlos de ${escapeHtml(track.name)}"><button class="track-switch${track.muted ? " active" : ""}" type="button" data-timeline-field="muted" data-track-id="${escapeHtml(track.id)}" aria-pressed="${track.muted ? "true" : "false"}">${track.muted ? "M" : "M"}</button><button class="track-switch${track.solo ? " active" : ""}" type="button" data-timeline-field="solo" data-track-id="${escapeHtml(track.id)}" aria-pressed="${track.solo ? "true" : "false"}">S</button><button class="track-switch${track.recordArmed ? " active" : ""}" type="button" data-timeline-field="recordArmed" data-track-id="${escapeHtml(track.id)}" aria-pressed="${track.recordArmed ? "true" : "false"}">R</button></div></div><div class="timeline-lane">${clips || '<span class="empty">Sem clips</span>'}</div></div>`;
  }).join("");
  if (timelineUndoButton) timelineUndoButton.disabled = !canUndo(timelineHistory);
  if (timelineRedoButton) timelineRedoButton.disabled = !canRedo(timelineHistory);
  renderMixer(normalized);
  updateTransportUI();
}
function renderMasterControls(project) {
  const master = project?.master || { gain: 1, pan: 0, limiter: 1, bypass: false };
  const gainDb = linearToDb(Number(master.gain) || 1);
  if (mixerMasterGain) mixerMasterGain.value = String(Math.max(-24, Math.min(6, gainDb)));
  if (mixerMasterGainValue) mixerMasterGainValue.textContent = `${gainDb >= 0 ? "+" : ""}${gainDb.toFixed(1)} dB`;
  if (mixerMasterPan) mixerMasterPan.value = String(Number(master.pan) || 0);
  if (mixerMasterPanValue) mixerMasterPanValue.textContent = (Number(master.pan) || 0).toFixed(2);
  if (mixerMasterLimiter) mixerMasterLimiter.value = String(Number(master.limiter) || 1);
  if (mixerMasterLimiterValue) mixerMasterLimiterValue.textContent = `${Math.round((Number(master.limiter) || 1) * 100)}%`;
  if (mixerMasterBypass) { mixerMasterBypass.setAttribute("aria-pressed", String(Boolean(master.bypass))); mixerMasterBypass.textContent = master.bypass ? "Master activo" : "Bypass Master"; }
  if (mixerMasterPeak) {
    const meter = estimateMasterMeter(project || {});
    mixerMasterPeak.textContent = `Peak ${meter.peakDb <= -59.9 ? "−∞" : meter.peakDb.toFixed(1)} dBFS · ${meter.state === "clip" ? "CLIP" : meter.state === "idle" ? "Idle" : "Signal"}`;
    mixerMasterPeak.dataset.meterState = meter.state;
    mixerMasterPeak.setAttribute("aria-label", `Peak Master: ${meter.peakDb.toFixed(1)} dBFS`);
  }
}

function renderMixerChannel(track, soloActive) {
  const volume = Number(track.volume ?? 1);
  const meter = estimateTrackMeter(track, { soloActive });
  const selected = track.id === selectedMixerTrackId ? " is-selected" : "";
  const meterLabel = meter.state === "clip" ? "CLIP" : meter.state === "muted" ? "Muted" : meter.state === "idle" ? "Idle" : "Signal";
  return `<div class="mixer-track${selected}" data-mixer-track="${escapeHtml(track.id)}" tabindex="0"><div class="mixer-track-title"><strong>${escapeHtml(track.name)}</strong><span>${escapeHtml(track.type)}</span></div><div class="mixer-channel-meter" data-mixer-meter="${escapeHtml(track.id)}" data-meter-state="${meter.state}" aria-label="Peak do canal ${escapeHtml(track.name)}: ${meter.peakDb.toFixed(1)} dBFS"><div class="mixer-meter-head"><span>Peak</span><output data-meter-peak="${escapeHtml(track.id)}">${meter.peakDb <= -59.9 ? "−∞" : meter.peakDb.toFixed(1)} dBFS</output></div><div class="mixer-meter-bar" role="meter" aria-valuemin="-60" aria-valuemax="0" aria-valuenow="${meter.peakDb.toFixed(1)}" aria-label="Peak de ${escapeHtml(track.name)}"><span style="width:${meter.peakPercent.toFixed(1)}%"></span></div><small>${meterLabel} · RMS ${meter.rmsDb <= -59.9 ? "−∞" : meter.rmsDb.toFixed(1)} dBFS</small></div><label><span>Ganho <output data-mixer-output="volume">${formatGainDb(volume)}</output></span><span class="control-hint">−∞ a +6 dB</span><input type="range" min="-60" max="6" step="0.5" value="${Math.max(-60, Math.min(6, linearToDb(volume)))}" data-mixer-field="volume" data-track-id="${escapeHtml(track.id)}" aria-label="Ganho em decibéis de ${escapeHtml(track.name)}"></label><label><span>Pan <output data-mixer-output="pan">${Number(track.pan ?? 0).toFixed(2)}</output></span><span class="control-hint">L · C · R</span><input type="range" min="-1" max="1" step="0.01" value="${Number(track.pan ?? 0)}" data-mixer-field="pan" data-track-id="${escapeHtml(track.id)}" aria-label="Pan de ${escapeHtml(track.name)}"></label><label><span>Input</span><select data-mixer-field="input" data-track-id="${escapeHtml(track.id)}" aria-label="Input de ${escapeHtml(track.name)}"><option value="default" ${track.input === "default" || !track.input ? "selected" : ""}>Microfone predefinido</option><option value="mic-1" ${track.input === "mic-1" ? "selected" : ""}>Microfone 1</option><option value="line-in" ${track.input === "line-in" ? "selected" : ""}>Line In</option></select></label><div class="mixer-switches"><button class="mini-button ${track.muted ? "active" : ""}" type="button" data-mixer-field="muted" data-track-id="${escapeHtml(track.id)}" aria-pressed="${track.muted ? "true" : "false"}" aria-label="${track.muted ? "Reactivar" : "Silenciar"} ${escapeHtml(track.name)}">${track.muted ? "Unmute" : "Mute"}</button><button class="mini-button ${track.solo ? "active" : ""}" type="button" data-mixer-field="solo" data-track-id="${escapeHtml(track.id)}" aria-pressed="${track.solo ? "true" : "false"}" aria-label="${track.solo ? "Desactivar solo" : "Activar solo"} ${escapeHtml(track.name)}">${track.solo ? "Unsolo" : "Solo"}</button><button class="mini-button ${track.recordArmed ? "active" : ""}" type="button" data-mixer-field="recordArmed" aria-pressed="${track.recordArmed ? "true" : "false"}">${track.recordArmed ? "Armed" : "Arm REC"}</button></div></div>`;
}
function renderAutomationMarkup(track) {
  const automation = normalizeTrackAutomation(track?.automation);
  const lanes = automation.lanes || [];
  const rows = lanes.flatMap((lane) => lane.points.map((point) => `<li><span>${escapeHtml(lane.target === "fx" ? `FX ${Number(lane.fxIndex) + 1}` : lane.target)} · ${point.time.toFixed(2)}s · ${lane.target === "volume" ? formatGainDb(point.value) : lane.target === "pan" ? point.value.toFixed(2) : `${Math.round(point.value * 100)}%`}</span><button class="mini-button danger" type="button" data-automation-remove data-automation-target="${lane.target}" data-automation-fx-index="${lane.fxIndex ?? 0}" data-automation-time="${point.time}">×</button></li>`)).join("");
  return `<section class="mixer-automation" aria-label="Automação da faixa"><div class="mixer-fx-heading"><strong>Automação</strong><label><span>Alvo</span><select data-automation-field="target">${AUTOMATION_TARGETS_LIST.map((target) => `<option value="${target}">${target === "volume" ? "Volume" : target === "pan" ? "Pan" : "Intensidade FX"}</option>`).join("")}</select></label></div><div class="automation-inputs"><label><span>Tempo (s)</span><input type="number" min="0" step="0.01" value="0" data-automation-field="time" aria-label="Tempo do ponto de automação"></label><label><span>Valor</span><input type="number" min="0" max="2" step="0.01" value="1" data-automation-field="value" aria-label="Valor do ponto de automação"></label><label><span>FX</span><input type="number" min="1" step="1" value="1" data-automation-field="fx-index" aria-label="Número do FX para automação"></label><button class="mini-button primary" type="button" data-automation-add>Adicionar ponto</button></div><label class="automation-toggle"><input type="checkbox" data-automation-enabled ${automation.enabled ? "checked" : ""}> <span>Reproduzir lanes durante Mixdown</span></label>${rows ? `<ul class="automation-points">${rows}</ul>` : `<span class="empty">Sem pontos. Adicione volume, pan ou intensidade FX.</span>`}</section>`;
}
function renderMixer(project) {
  renderMasterControls(project);
  if (!mixerTracks) return;
  if (!project?.tracks?.length) {
    mixerTracks.innerHTML = '<div class="empty">Abre uma sessão para ver as tracks.</div>';
    if (mixerHeadroom) mixerHeadroom.textContent = "Headroom 0 dB";
    if (mixerInspector) mixerInspector.innerHTML = "<strong>Inspector de track</strong><span>Selecciona uma faixa para ver os seus clips e origem.</span>";
    return;
  }
  if (!project.tracks.some((track) => track.id === selectedMixerTrackId)) selectedMixerTrackId = project.tracks[0].id;
  const soloActive = project.tracks.some((track) => track.solo);
  mixerTracks.innerHTML = project.tracks.map((track) => renderMixerChannel(track, soloActive)).join("");
  const selected = project.tracks.find((track) => track.id === selectedMixerTrackId) || project.tracks[0];
  const origin = trackOrigin(selected);
  const fxTypes = ["compressor", "limiter", "eq", "chorus", "flanger", "saturation", "de-esser", "gate"];
  const effects = Array.isArray(selected.effects) ? selected.effects : [];
  const fxMarkup = effects.length ? effects.map((effect, index) => `<div class="mixer-fx-row"><label><span>FX ${index + 1}</span><select data-mixer-fx-field="type" data-fx-index="${index}">${fxTypes.map((type) => `<option value="${type}" ${effect.type === type ? "selected" : ""}>${type}</option>`).join("")}</select></label><label><span>Intensidade <output data-fx-output="intensity" data-fx-index="${index}">${Math.round(Number(effect.intensity ?? 0.5) * 100)}%</output></span><input type="range" min="0" max="1" step="0.01" value="${Number(effect.intensity ?? 0.5)}" data-mixer-fx-field="intensity" data-fx-index="${index}" aria-label="Intensidade do FX ${index + 1}"></label><button class="mini-button ${effect.bypass ? "active" : ""}" type="button" data-mixer-fx-bypass="${index}" aria-pressed="${effect.bypass ? "true" : "false"}">${effect.bypass ? "Activar" : "Bypass"}</button><button class="mini-button" type="button" data-mixer-fx-remove="${index}">Remover</button></div>`).join("") : "<span class=\"empty\">Sem FX nesta faixa.</span>";
  if (mixerInspector) mixerInspector.innerHTML = `<strong>${escapeHtml(selected.name)}</strong><span>${escapeHtml(selected.type)} · ${origin === "producer-plan" ? "Producer Plan" : "Manual"}</span><small>${selected.clips.length} clip${selected.clips.length === 1 ? "" : "s"} · ${effects.length} efeito${effects.length === 1 ? "" : "s"}</small><div class="mixer-inspector-clips">${selected.clips.length ? selected.clips.map((clip) => `<span>${escapeHtml(clip.name)} · ${Number(clip.duration || 0).toFixed(1)}s</span>`).join("") : "<span>Sem clips nesta faixa.</span>"}</div><section class="mixer-fx-rack" aria-label="Efeitos da faixa"><div class="mixer-fx-heading"><strong>Rack FX</strong><button class="mini-button primary" type="button" data-mixer-fx-add>＋ Adicionar FX</button></div>${fxMarkup}</section>${renderAutomationMarkup(selected)}`;
  const active = project.tracks.filter((track) => !track.muted);
  const estimatedPeak = active.reduce((sum, track) => sum + Number(track.volume ?? 1), 0);
  const headroomDb = estimatedPeak > 0 ? 20 * Math.log10(Math.max(0.0001, 0.98 / estimatedPeak)) : 0;
  if (mixerHeadroom) mixerHeadroom.textContent = `Headroom ${headroomDb.toFixed(1)} dB`;
}
function scheduleCloudAutosave(project) {
  if (!project || !isFirebaseSignedIn()) return;
  clearTimeout(cloudAutosaveTimer);
  if (cloudSyncStatus) cloudSyncStatus.textContent = "Sincronizando…";
  cloudAutosaveTimer = setTimeout(async () => {
    try {
      await saveCloudProject(project);
      saveProjects(readProjects().map((item) => item.id === project.id ? { ...item, cloudSynced: true, cloudSyncState: "synced", cloudSavedAt: new Date().toISOString() } : item));
      if (cloudSyncStatus) cloudSyncStatus.textContent = "Salvo agora · Sincronizado";
    } catch (error) {
      if (cloudSyncStatus) cloudSyncStatus.textContent = error.message || "Sincronização pendente";
    }
  }, 1200);
}

async function persistTimelineProjects(projects) {
  let useIndexedDb = false;
  try { useIndexedDb = await indexedDbAvailable(); } catch { useIndexedDb = false; }
  if (!useIndexedDb) {
    saveProjects(projects);
    return projects;
  }
  const compacted = [];
  for (const project of projects) {
    const nextProject = normalizeProject({ ...project, tracks: project.tracks.map((track) => ({ ...track, clips: track.clips.map((clip) => ({ ...clip })) })) });
    for (const track of nextProject.tracks) {
      for (const clip of track.clips) {
        if (!clip.audioData || !clip.blobKey?.startsWith(`${project.id}:instrument-`)) continue;
        const kind = clip.blobKey.slice(`${project.id}:`.length);
        try {
          await putAudioBlob(project.id, kind, await dataUrlToBlob(clip.audioData));
          delete clip.audioData;
        } catch (error) {
          console.warn("WAV do clip mantido inline; IndexedDB indisponível", error);
        }
      }
    }
    compacted.push(nextProject);
  }
  saveProjects(compacted);
  try {
    const active = compacted.find((project) => project.id === activeTimelineId);
    if (active) await putProject(active);
  } catch (error) {
    console.warn("Manifesto IndexedDB indisponível; localStorage continua activo", error);
  }
  return compacted;
}

async function commitTimelineProject(nextProject) {
  const currentRevision = Number(timelineHistory?.present?.revision || 0);
  const nextRevision = currentRevision + 1;
  const normalized = normalizeProject({ ...nextProject, revision: nextRevision, versionHistory: [...(timelineHistory?.present?.versionHistory || []), { revision: nextRevision, savedAt: new Date().toISOString(), label: `Revisão ${nextRevision}` }].slice(-20), cloudSyncState: "pending" });
  timelineHistory = commitHistory(timelineHistory, normalized);
  const projects = readProjects().map((project) => project.id === activeTimelineId ? timelineHistory.present : project);
  await persistTimelineProjects(projects);
  renderProjects();
  scheduleCloudAutosave(timelineHistory.present);
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
      const instrumentKind = clip.blobKey?.startsWith(`${project.id}:instrument-`) ? clip.blobKey.slice(`${project.id}:`.length) : null;
      try {
        if (clip.metadata?.origin === "my-sounds" && clip.metadata.mySoundId) {
          blob = await getMySoundBlob(clip.metadata.mySoundId);
        } else if (await indexedDbAvailable() && clip.blobKey) {
          blob = await getAudioBlob(project.id, instrumentKind || blobKindForVariant(variant));
        }
      } catch {}
      const variantData = clip.audioData || getVariantData(project, variant) || sourceData;
      if (!blob && variantData && (clip.blobKey?.startsWith(`${project.id}:`) || clip.blobKey === null || clip.metadata?.origin === "my-sounds")) {
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

async function materializeInstrumentAudio(project) {
  const nextProject = normalizeProject({ ...project, tracks: project.tracks.map((track) => ({ ...track, clips: track.clips.map((clip) => ({ ...clip })) })) });
  for (const track of nextProject.tracks) {
    for (const clip of track.clips) {
      if (!isInstrumentClip(clip) || clip.audioData) continue;
      const rendered = renderInstrumentClip(clip, { sampleRate: 44100, tempo: Number(nextProject.tempo) || 100 });
      const audioBuffer = { numberOfChannels: 1, sampleRate: 44100, length: rendered.length, getChannelData: () => rendered };
      const wav = audioBufferToWav(audioBuffer);
      const kind = `instrument-${clip.id}`;
      clip.blobKey = `${nextProject.id}:${kind}`;
      clip.audioData = await blobToDataUrl(wav);
      clip.mimeType = "audio/wav";
      try {
        if (await indexedDbAvailable()) await putAudioBlob(nextProject.id, kind, wav);
      } catch (error) {
        // O WAV inline já foi materializado; uma falha de IndexedDB não pode
        // apagar o arranjo nem deixar o Producer Plan sem áudio reproduzível.
        console.warn("WAV instrumental mantido inline; IndexedDB indisponível", error);
      }
    }
  }
  return nextProject;
}

async function insertInstrumentClip({ name, type, duration = 4, metadata = {}, start = null, audioData = "", blobKey = null }) {
  const project = currentTimelineProject() || ensureProductionSession("Beat Studio");
  if (!project) {
    showToast("Não foi possível abrir uma sessão de produção.");
    return false;
  }
  let nextProject = normalizeProject(project);
  let track = nextProject.tracks.find((item) => item.type === type);
  if (!track) {
    nextProject = addTrack(nextProject, { name, type, color: type === "drums" ? "#f4b860" : type === "guitar" ? "#9c8cff" : "#62d6c7" });
    track = nextProject.tracks[nextProject.tracks.length - 1];
  }
  const end = track.clips.reduce((latest, clip) => Math.max(latest, Number(clip.start || 0) + Number(clip.duration || 0)), 0);
  const clipStart = Number.isFinite(Number(start)) ? Math.max(0, Number(start)) : end;
  const clipId = `${project.id}-instrument-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const rendered = audioData ? null : renderInstrumentClip({ name, type, duration, start: clipStart, metadata, event: metadata }, { sampleRate: 44100, tempo: Number(project.tempo) || 100 });
  const audioBuffer = rendered ? { numberOfChannels: 1, sampleRate: 44100, length: rendered.length, getChannelData: () => rendered } : null;
  const wav = audioBuffer ? audioBufferToWav(audioBuffer) : null;
  const kind = `instrument-${clipId}`;
  const resolvedBlobKey = blobKey || `${project.id}:${kind}`;
  const resolvedAudioData = audioData || await blobToDataUrl(wav);
  nextProject = addClip(nextProject, track.id, {
    id: clipId,
    name,
    start: clipStart,
    duration,
    sourceOffset: 0,
    blobKey: resolvedBlobKey,
    audioData: resolvedAudioData,
    mimeType: "audio/wav",
    event: metadata,
    gain: 1,
  });
  nextProject = normalizeProject({ ...nextProject, duration: Math.max(Number(nextProject.duration || 0), clipStart + Number(duration || 0)), status: "Instrumental materializado", updatedAt: new Date().toISOString() });
  await commitTimelineProject(nextProject);
  try {
    if (wav && await indexedDbAvailable()) await putAudioBlob(project.id, kind, wav);
  } catch {
    showToast("O instrumental entrou na timeline, mas a cópia IndexedDB falhou; o WAV inline permanece disponível.");
  }
  activeTimelineId = project.id;
  timelineHistory = createHistoryState(nextProject);
  renderTimeline();
  renderMixer();
  renderProjects();
  await refreshStorageStatus();
  showToast(`${name} materializado como Audio Track WAV e guardado localmente.`);
  return true;
}

const SOUND_FAVORITES_KEY = "fernando-lucoco-sound-favorites-v1";
let soundLibraryFavorites = new Set();
let soundLibraryFilters = { query: "", category: "", genre: "", mood: "", favoritesOnly: false };
function loadSoundLibraryFavorites() {
  try {
    const raw = JSON.parse(localStorage.getItem(SOUND_FAVORITES_KEY) || "[]");
    soundLibraryFavorites = new Set(Array.isArray(raw) ? raw.filter((id) => getSoundLibraryItem(id)) : []);
  } catch { soundLibraryFavorites = new Set(); }
}
function persistSoundLibraryFavorites() {
  try { localStorage.setItem(SOUND_FAVORITES_KEY, JSON.stringify([...soundLibraryFavorites])); } catch { /* localStorage pode estar indisponível */ }
}
function toggleSoundLibraryFavorite(id) {
  if (soundLibraryFavorites.has(id)) soundLibraryFavorites.delete(id);
  else soundLibraryFavorites.add(id);
  persistSoundLibraryFavorites();
  renderSoundLibrary();
}
function renderSoundLibrary() {
  if (!soundLibraryGrid) return;
  const items = filterSoundLibrary(SOUND_LIBRARY, { ...soundLibraryFilters, favoriteIds: [...soundLibraryFavorites] });
  soundLibraryFavoritesOnly?.setAttribute("aria-pressed", String(soundLibraryFilters.favoritesOnly));
  soundLibraryFavoritesOnly?.classList.toggle("is-active", soundLibraryFilters.favoritesOnly);
  soundLibraryGrid.innerHTML = items.length ? items.map((item) => {
    const favorite = soundLibraryFavorites.has(item.id);
    return `<article class="sound-library-card" draggable="true" data-sound-id="${escapeHtml(item.id)}" tabindex="0" aria-label="${escapeHtml(item.name)}">
      <div class="sound-library-card-top"><span class="sound-library-swatch" style="background:${escapeHtml(item.color)}" aria-hidden="true"></span><span class="sound-library-type">${escapeHtml(item.category)} · ${escapeHtml(item.genre)}</span><button class="sound-library-favorite${favorite ? " is-active" : ""}" type="button" data-sound-favorite="${escapeHtml(item.id)}" aria-label="${favorite ? "Remover" : "Adicionar"} ${escapeHtml(item.name)} ${favorite ? "dos" : "aos"} favoritos" aria-pressed="${favorite}">${favorite ? "★" : "☆"}</button></div>
      <strong>${escapeHtml(item.name)}</strong><small>${item.duration}s · ${item.bpm} BPM · ${escapeHtml(item.key)} · ${escapeHtml(item.mood)}</small>
      <div class="sound-library-actions"><button class="mini-button" type="button" data-sound-preview="${escapeHtml(item.id)}">▶ Ouvir</button><button class="mini-button primary" type="button" data-sound-add="${escapeHtml(item.id)}">＋ Timeline</button></div>
    </article>`;
  }).join("") : `<div class="sound-library-empty">Nenhum som corresponde aos filtros. Ajusta a pesquisa ou cria um favorito a partir do catálogo base.</div>`;
  if (soundLibraryStatus) soundLibraryStatus.textContent = `${items.length} ${items.length === 1 ? "som disponível" : "sons disponíveis"} · pré-escuta local e arrastar para a timeline.`;
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

async function addSoundLibraryItem(item, start = null) {
  if (!item) return false;
  const clip = soundLibraryClip(item, start);
  const added = await insertInstrumentClip({ name: clip.name, type: item.type, duration: clip.duration, start: clip.start, metadata: clip.event });
  if (added && soundLibraryStatus) soundLibraryStatus.textContent = `${item.name} adicionado à timeline na posição ${clip.start.toFixed(1)}s.`;
  return added;
}

let mySoundsItems = [];
let mySoundsFilters = { query: "", folder: "", favoritesOnly: false };
function mySoundCard(item) {
  const favorite = Boolean(item.favorite);
  return `<article class="sound-library-card" data-my-sound-id="${escapeHtml(item.id)}" tabindex="0" aria-label="${escapeHtml(item.name)}"><div class="sound-library-card-top"><span class="sound-library-swatch" style="background:#ff765c" aria-hidden="true"></span><span class="sound-library-type">${escapeHtml(item.folder)} · ${escapeHtml(item.mimeType.replace("audio/", ""))}</span><button class="sound-library-favorite${favorite ? " is-active" : ""}" type="button" data-my-sound-favorite="${escapeHtml(item.id)}" aria-label="${favorite ? "Remover" : "Adicionar"} ${escapeHtml(item.name)} ${favorite ? "dos" : "aos"} favoritos" aria-pressed="${favorite}">${favorite ? "★" : "☆"}</button></div><strong>${escapeHtml(item.name)}</strong><small>${(item.size / 1048576).toFixed(2)} MB · ${escapeHtml((item.tags || []).join(" · ") || "sem tags")}</small><div class="sound-library-actions"><button class="mini-button" type="button" data-my-sound-preview="${escapeHtml(item.id)}">▶ Ouvir</button><button class="mini-button primary" type="button" data-my-sound-add="${escapeHtml(item.id)}">＋ Timeline</button><button class="mini-button" type="button" data-my-sound-edit="${escapeHtml(item.id)}">Editar</button><button class="mini-button danger" type="button" data-my-sound-delete="${escapeHtml(item.id)}">Apagar</button></div></article>`;
}
function renderStudioLiveStatus() {
  if (!studioLiveProjectCount) return;
  const projects = readProjects();
  const clipCount = projects.reduce((total, project) => total + (project.tracks || []).reduce((trackTotal, track) => trackTotal + (track.clips || []).length, 0), 0);
  const audioProject = projects.find((project) => getVariantData(project, "original"));
  studioLiveProjectCount.textContent = String(projects.length);
  studioLiveClipCount.textContent = String(clipCount);
  studioLiveSoundCount.textContent = String(mySoundsItems.length);
  studioLiveAudioState.textContent = audioProject ? "Áudio real" : "Pronto";
  studioLiveStatusLabel.textContent = projects.length || mySoundsItems.length ? "Activo" : "Pronto";
  studioLiveStatusDetail.textContent = projects.length || mySoundsItems.length
    ? `Dados locais confirmados: ${projects.length} ${projects.length === 1 ? "sessão" : "sessões"}, ${clipCount} ${clipCount === 1 ? "clip" : "clips"} e ${mySoundsItems.length} ${mySoundsItems.length === 1 ? "som privado" : "sons privados"}.`
    : "Ainda não existem sessões ou My Sounds neste dispositivo. Cria uma sessão ou importa um som para veres os dados a aparecerem aqui.";
}

function renderMySounds() {
  if (!mySoundsGrid) return;
  const folders = [...new Set(mySoundsItems.map((item) => item.folder).filter(Boolean))].sort();
  if (mySoundsFolderFilter) {
    const current = mySoundsFolderFilter.value;
    mySoundsFolderFilter.innerHTML = `<option value="">Todas as pastas</option>${folders.map((folder) => `<option value="${escapeHtml(folder)}">${escapeHtml(folder)}</option>`).join("")}`;
    mySoundsFolderFilter.value = folders.includes(current) ? current : "";
  }
  const items = filterMySounds(mySoundsItems, mySoundsFilters);
  mySoundsGrid.innerHTML = items.length ? items.map(mySoundCard).join("") : `<div class="sound-library-empty">Ainda não há sons privados com estes filtros. Escolhe um áudio acima para criar a tua biblioteca.</div>`;
  if (mySoundsStatus) mySoundsStatus.textContent = `${items.length} de ${mySoundsItems.length} ${mySoundsItems.length === 1 ? "som privado" : "sons privados"} · IndexedDB neste dispositivo.`;
  renderStudioLiveStatus();
}
async function refreshMySounds() {
  try { mySoundsItems = await listMySounds(); renderMySounds(); }
  catch (error) { if (mySoundsStatus) mySoundsStatus.textContent = error instanceof Error ? error.message : "My Sounds indisponível neste navegador."; }
}
async function editMySoundMetadata(id) {
  const item = mySoundsItems.find((candidate) => candidate.id === id);
  if (!item) throw new Error("Som não encontrado na biblioteca local.");
  const name = globalThis.prompt?.("Nome do som", item.name);
  if (name === null || name === undefined) return;
  const folder = globalThis.prompt?.("Pasta", item.folder || "Raiz");
  if (folder === null || folder === undefined) return;
  const tags = globalThis.prompt?.("Tags separadas por vírgulas", (item.tags || []).join(", "));
  if (tags === null || tags === undefined) return;
  await updateMySound(id, { name, folder, tags });
  await refreshMySounds();
  if (mySoundsStatus) mySoundsStatus.textContent = `${String(name).trim() || item.name}: metadados actualizados localmente.`;
}
async function previewMySound(id) {
  const blob = await getMySoundBlob(id);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  await audio.play();
  if (mySoundsStatus) mySoundsStatus.textContent = "Pré-escuta local a tocar.";
}
async function addMySoundToTimeline(id) {
  const item = mySoundsItems.find((candidate) => candidate.id === id);
  if (!item) return;
  try {
    const blob = await getMySoundBlob(id);
    if (!blob) throw new Error("O blob privado deste som não foi encontrado no IndexedDB.");
    const audioData = await blobToDataUrl(blob);
    const inserted = await insertInstrumentClip({
      name: item.name,
      type: "sample",
      duration: item.duration || 4,
      audioData,
      blobKey: `my-sound:${id}`,
      metadata: { origin: "my-sounds", mySoundId: id, folder: item.folder, tags: item.tags, mimeType: item.mimeType },
    });
    if (!inserted) throw new Error("Não foi possível abrir a sessão para inserir este som.");
    if (mySoundsStatus) mySoundsStatus.textContent = `${item.name} adicionado à timeline com áudio real; o original permanece privado no IndexedDB.`;
  } catch (error) {
    if (mySoundsStatus) mySoundsStatus.textContent = error instanceof Error ? error.message : "Não foi possível adicionar o som à timeline.";
  }
}
mySoundsCloudUpload?.addEventListener("click", async () => {
  const file = mySoundsFile?.files?.[0];
  try {
    if (!auth.currentUser) throw new Error("Inicia sessão para sincronizar media.");
    const uploaded = await uploadUserMedia(auth.currentUser, file, {
      name: mySoundsName?.value,
      folder: mySoundsFolder?.value,
      tags: mySoundsTags?.value,
    });
    if (mySoundsStatus) mySoundsStatus.textContent = `Sincronizado no Firebase Storage: ${uploaded.name}`;
  } catch (error) {
    if (mySoundsStatus) mySoundsStatus.textContent = error instanceof Error ? error.message : "Não foi possível sincronizar a media.";
  }
});
mySoundsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = mySoundsFile?.files?.[0];
  try {
    await putMySound(file, { name: mySoundsName?.value, folder: mySoundsFolder?.value, tags: mySoundsTags?.value });
    mySoundsForm.reset();
    if (mySoundsFolder) mySoundsFolder.value = "Raiz";
    await refreshMySounds();
  } catch (error) { if (mySoundsStatus) mySoundsStatus.textContent = error instanceof Error ? error.message : "Não foi possível guardar o áudio."; }
});
mySoundsQuery?.addEventListener("input", () => { mySoundsFilters.query = mySoundsQuery.value; renderMySounds(); });
mySoundsFolderFilter?.addEventListener("change", () => { mySoundsFilters.folder = mySoundsFolderFilter.value; renderMySounds(); });
mySoundsFavoritesOnly?.addEventListener("click", () => { mySoundsFilters.favoritesOnly = !mySoundsFilters.favoritesOnly; mySoundsFavoritesOnly.setAttribute("aria-pressed", String(mySoundsFilters.favoritesOnly)); mySoundsFavoritesOnly.classList.toggle("is-active", mySoundsFilters.favoritesOnly); renderMySounds(); });
mySoundsGrid?.addEventListener("click", async (event) => {
  const id = event.target.closest("[data-my-sound-id]")?.dataset.mySoundId;
  if (!id) return;
  try {
    if (event.target.closest("[data-my-sound-favorite]")) { const next = await updateMySound(id, { favorite: !mySoundsItems.find((item) => item.id === id)?.favorite }); await refreshMySounds(); return next; }
    if (event.target.closest("[data-my-sound-edit]")) { await editMySoundMetadata(id); return; }
    if (event.target.closest("[data-my-sound-delete]")) { await deleteMySound(id); await refreshMySounds(); return; }
    if (event.target.closest("[data-my-sound-preview]")) { await previewMySound(id); return; }
    if (event.target.closest("[data-my-sound-add]")) addMySoundToTimeline(id);
  } catch (error) { if (mySoundsStatus) mySoundsStatus.textContent = error instanceof Error ? error.message : "Não foi possível concluir a acção."; }
});
refreshMySounds();

const AUTOMIX_GENRE_MAP = { "Hip-Hop": "Hip-Hop", "R&B": "R&B", Afrobeats: "Afrobeat", House: "Afro House", "Lo-fi": "R&B", Pop: "Afrobeat", Amapiano: "Amapiano" };
let automixSnapshot = null;

function buildAutoMixProposal(project = currentTimelineProject()) {
  if (!project) return null;
  const label = automixGenre?.value || "Hip-Hop";
  const genre = AUTOMIX_GENRE_MAP[label] || "Hip-Hop";
  const plan = buildProducerPlan({ genre, tempo: project.tempo || 100, key: project.key || "C", duration: getTimelineDuration(project), brief: label });
  const panByType = { audio: 0, vocal: -0.08, drums: 0.04, instrument: 0.08, guitar: -0.1, bus: 0, fx: 0.12 };
  const adjusted = applyProducerMix(normalizeProject(project), plan);
  const next = { ...adjusted, tracks: adjusted.tracks.map((track) => ({ ...track, pan: panByType[track.type] ?? track.pan ?? 0, automixGenre: label })) };
  return { label, genre, plan, next };
}

function renderAutoMixProposal(proposal = buildAutoMixProposal()) {
  if (!proposal || !automixSummary) return;
  const mixText = proposal.plan?.mix ? `Bass ${proposal.plan.mix.bassDb} dB · Instrumental ${proposal.plan.mix.instrumentalDb} dB` : "equilíbrio por género";
  automixSummary.textContent = `${proposal.label}: ${mixText}. Vocal centrado; bateria e instrumentos recebem panorama leve.`;
}

function previewAutoMix() {
  const proposal = buildAutoMixProposal();
  if (!proposal) { if (automixStatus) automixStatus.textContent = "Abre um projecto antes de gerar AutoMix."; return; }
  renderAutoMixProposal(proposal);
  if (automixStatus) automixStatus.textContent = `Preview ${proposal.label} pronto; o projecto ainda não foi alterado.`;
}

async function applyAutoMix() {
  const project = currentTimelineProject();
  const proposal = buildAutoMixProposal(project);
  if (!project || !proposal) { if (automixStatus) automixStatus.textContent = "Abre um projecto antes de aplicar AutoMix."; return; }
  if (!automixSnapshot) automixSnapshot = normalizeProject(project);
  await commitTimelineProject(proposal.next);
  renderAutoMixProposal(proposal);
  if (automixStatus) automixStatus.textContent = `AutoMix ${proposal.label} aplicado. Volumes e panorama foram ajustados de forma reversível.`;
  if (automixReset) automixReset.disabled = false;
}

async function resetAutoMix() {
  if (!automixSnapshot) { if (automixStatus) automixStatus.textContent = "Não existe um AutoMix para reverter."; return; }
  await commitTimelineProject(automixSnapshot);
  automixSnapshot = null;
  if (automixStatus) automixStatus.textContent = "AutoMix revertido; os valores anteriores foram restaurados.";
  if (automixReset) automixReset.disabled = true;
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
    let next = materializeProducerPlan(plannedProject, plan, {
      duration: source.duration,
        onStep: ({ index, total }) => setProductionPhase(id, PRODUCTION_STATES.ARRANGING, `${isAiPlan ? "A IA materializa a faixa do produtor" : "A criar arranjo local"} · ${index}/${total}`, 25 + Math.round((index / total) * 45), renderProjects),
    });
    try {
      next = await materializeInstrumentAudio(next);
    } catch (error) {
      console.warn("Materialização WAV do Producer Plan falhou; os eventos continuam disponíveis para re-renderização local.", error);
    }
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

async function executeProducerAction(action) {
  const project = currentTimelineProject();
  if (!project) throw new Error("Abre ou cria uma sessão antes de usar o AI Producer.");
  const label = producerActionLabel(action);
  if (producerCommandStatus) producerCommandStatus.textContent = `${label}: a preparar…`;
  const sourceData = getVariantData(project, "original");
  if (["analyze-vocal", "mix-vocals", "master-track"].includes(action) && !sourceData && !project.tracks?.some((track) => track.type === "vocal" && track.clips?.length)) {
    throw new Error(`${label} precisa de uma gravação vocal real na sessão.`);
  }
  if (action === "analyze-vocal") {
    if (!sourceData) throw new Error("Não encontrei o áudio vocal original para analisar.");
    const analysis = await analyzeAudioDataUrl(sourceData);
    const updated = readProjects().map((item) => item.id === project.id ? { ...item, analysis, status: "Vocal analisado pelo AI Producer" } : item);
    saveProjects(updated);
    try { if (await indexedDbAvailable()) await putProject(updated.find((item) => item.id === project.id)); } catch {}
    renderProjects();
    if (producerCommandStatus) producerCommandStatus.textContent = `Analyze vocal concluído · ${analysis.bpm || "BPM não detectado"} BPM · confiança ${Math.round((analysis.confidence || 0) * 100)}%.`;
    return;
  }
  if (["generate-drums", "create-bassline", "improve-arrangement"].includes(action)) {
    const basePlan = buildProducerPlan({ genre: project.genre || "Afrobeat", tempo: project.tempo || 100, key: project.key || "C", duration: getTimelineDuration(project), brief: project.productionBrief || label, analysis: project.analysis || null, preferAnalysis: Boolean(project.analysis?.hasAudio) });
    const actionPlan = buildProducerActionPlan(basePlan, action);
    await runProducerPlan(project.id, { planOverride: actionPlan, sourceLabel: label });
    if (producerCommandStatus) producerCommandStatus.textContent = `${label} concluído · clips instrumentais reais materializados na timeline.`;
    return;
  }
  if (action === "mix-vocals") {
    await mixdownActiveTimeline();
    if (producerCommandStatus) producerCommandStatus.textContent = "Mix vocals concluído · Mixed WAV real guardado na sessão.";
    return;
  }
  if (action === "master-track") {
    const latest = currentTimelineProject();
    if (!getVariantData(latest, "mixed")) throw new Error("Cria primeiro o Mixed WAV com Mix vocals.");
    await applyMasteringFromUi();
    if (producerCommandStatus) producerCommandStatus.textContent = "Master track concluído · variante Mastered real guardada.";
  }
}
function bindProducerActionButtons() {
  producerActionButtons.forEach((button) => button.addEventListener("click", async () => {
    const action = button.dataset.producerAction;
    if (!action) return;
    producerActionButtons.forEach((item) => { item.disabled = true; item.setAttribute("aria-busy", "true"); });
    try { await executeProducerAction(action); }
    catch (error) {
      const message = error instanceof Error ? error.message : "A acção do AI Producer falhou.";
      if (producerCommandStatus) producerCommandStatus.textContent = `${producerActionLabel(action)}: ${message}`;
      showToast(message);
    }
    finally { producerActionButtons.forEach((item) => { item.disabled = false; item.removeAttribute("aria-busy"); }); }
  }));
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
  if (masteringStatus && state.hasMix && !project.masteringApplied) masteringStatus.textContent = "Mixed pronto · escolhe um preset e faz Preview ou Aplicar.";
  if (masteringApply) masteringApply.disabled = !state.hasMix;
  if (masteringReset) masteringReset.disabled = !Boolean(project.audioVariants?.mastered);
  if (masteringPreview) masteringPreview.disabled = !state.hasMix;
  if (masteringAfter && project.audioVariants?.mastered) masteringAfter.textContent = `After · ${project.masteringParameters?.preset || "Mastered"} aplicado`;
  if (producerFinalStatus) producerFinalStatus.textContent = state.hasMix ? (project.audioVariants?.mastered ? "Mastered disponível · exporta a versão final quando estiver pronta." : "Compara Original e Mixed antes de exportar.") : "Cria um Mixed para comparar versões.";
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

function takeGroupKey(project) { return project.takeGroupId || `takes-${String(project.name || project.id).toLocaleLowerCase("pt-PT")}`; }
function renderCompedControl(groupProjects) {
  if (groupProjects.length < 2) return "";
  const options = groupProjects.map((take) => `<option value="${escapeHtml(take.id)}">${escapeHtml(take.takeLabel || `Take ${take.takeNumber || 1}`)}</option>`).join("");
  return `<fieldset class="comped-control"><legend>Comped Vocal · escolher takes por secção</legend><div class="comped-grid">${["Intro", "Verso", "Refrão", "Outro"].map((segment) => `<label>${segment}<select data-comp-segment="${segment}" data-comp-group="${escapeHtml(takeGroupKey(groupProjects[0]))}">${options}</select></label>`).join("")}</div><button class="mini-button primary" type="button" data-create-comped="${escapeHtml(takeGroupKey(groupProjects[0]))}">Criar Comped Vocal</button></fieldset>`;
}
async function createCompedVocal(groupId, container) {
  const projects = readProjects().filter((item) => takeGroupKey(item) === groupId);
  if (projects.length < 2) return showToast("Grava pelo menos duas takes da mesma sessão.");
  const selections = [...container.querySelectorAll(`[data-comp-group="${CSS.escape(groupId)}"]`)].map((select) => ({ segment: select.dataset.compSegment, takeId: select.value }));
  const primary = projects.find((item) => item.id === selections[0]?.takeId) || projects[0];
  const comped = normalizeProject({ ...primary, id: makeProjectId(), name: `${primary.name} · Comped Vocal`, takeLabel: "Comped Vocal", takeGroupId: `${groupId}-comped`, takeNumber: 1, compSelections: selections, status: "Comped Vocal criada", createdAt: new Date().toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" }) });
  saveProjects([comped, ...readProjects()]);
  renderProjects();
  showToast(`“${comped.name}” criada a partir de ${projects.length} takes.`);
}
function renderProjectsHub(projects) {
  if (!projectsHubList) return;
  const query = projectsHubSearch?.value.trim().toLocaleLowerCase("pt-PT") || "";
  const filter = document.querySelector("[data-projects-hub-filter].is-active")?.dataset.projectsHubFilter || "all";
  const visible = projects.filter((project) => {
    const matchesQuery = !query || [project.name, project.genre, project.status].some((value) => String(value || "").toLocaleLowerCase("pt-PT").includes(query));
    const matchesFilter = filter === "all" || (filter === "archived" ? project.archived : !project.archived);
    return matchesQuery && matchesFilter;
  });
  if (!visible.length) {
    projectsHubList.innerHTML = `<div class="studio-recent-empty"><span>♪</span><div><strong>${projects.length ? "Nenhum projecto encontrado" : "Ainda não há projectos"}</strong><p>${projects.length ? "Experimenta outro termo ou filtro." : "Cria a tua primeira sessão para começar a biblioteca."}</p></div><button class="mini-button" type="button" data-studio-area="recording-workspace">＋ Novo projecto</button></div>`;
    return;
  }
  projectsHubList.innerHTML = visible.map((project) => {
    const tracks = Array.isArray(project.tracks) ? project.tracks.length : (project.originalAudioData ? 1 : 0);
    const version = getVariantData(project, "mixed") ? "Mixed" : "Original";
    return `<article class="projects-hub-card${project.archived ? " is-archived" : ""}"><div class="projects-hub-card-icon" aria-hidden="true">${escapeHtml(project.coverGlyph || "♫")}</div><div class="projects-hub-card-body"><div class="projects-hub-card-top"><span class="section-kicker">${escapeHtml(project.genre || "Demo vocal")}</span><span class="pill">${escapeHtml(project.archived ? "Arquivado" : project.status || "Guardado localmente")}</span></div><h3>${escapeHtml(project.name || "Sessão sem título")}</h3><p>${escapeHtml(project.createdAt || "Sem data")} · ${tracks} track${tracks === 1 ? "" : "s"} · ${version}</p><div class="projects-hub-card-actions"><button class="mini-button primary" type="button" data-open-project="${escapeHtml(project.id)}" data-studio-area="timeline">Abrir Studio →</button><button class="mini-button" type="button" data-projects-hub-action="archive" data-archive-id="${escapeHtml(project.id)}">${project.archived ? "Restaurar" : "Arquivar"}</button></div></div></article>`;
  }).join("");
}

function renderProjects() {
  loadSoundLibraryFavorites();
  renderSoundLibrary();
  const projects = readProjects();
  renderStudioLiveStatus();
  renderRecentProjects(projects);
  renderProjectsHub(projects);
  const query = projectSearch?.value.trim().toLocaleLowerCase("pt-PT") || "";
  const filter = projectFilter?.value || "all";
  const visibleProjects = projects.filter((project) => {
    const matchesQuery = !query || [project.name, project.genre, project.status].some((value) => String(value || "").toLocaleLowerCase("pt-PT").includes(query));
    const matchesFilter = filter === "all" || (filter === "archived" ? project.archived : !project.archived);
    return matchesQuery && matchesFilter;
  });
  if (!projects.length) {
    list.innerHTML = '<div class="empty">Ainda não há takes guardadas. A tua próxima ideia pode começar aqui.</div>';
    renderProducerStudio();
    renderTimeline();
    return;
  }
  if (!visibleProjects.length) {
    list.innerHTML = '<div class="empty">Nenhuma sessão corresponde à pesquisa actual.</div>';
    renderProducerStudio();
    renderTimeline();
    return;
  }
  list.innerHTML = visibleProjects.map((project) => {
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
    const projectArtist = project.artist || "Fernando Lucoco";
    const projectVersion = project.version || (getVariantData(project, "mixed") ? "Mixed" : "Original");
    const trackCount = Array.isArray(project.tracks) ? project.tracks.length : (project.originalAudioData ? 1 : 0);
    const coverGlyph = project.coverGlyph || "♫";
    const groupProjects = visibleProjects.filter((item) => takeGroupKey(item) === takeGroupKey(project));
    const takeMeta = project.takeLabel || (project.takeNumber ? `Take ${project.takeNumber}` : "Take 1");
    const compedControl = groupProjects[0]?.id === project.id ? renderCompedControl(groupProjects) : "";
    const archiveButton = project.archived
      ? `<button class="mini-button" type="button" data-archive-id="${escapeHtml(project.id)}">Restaurar</button>`
      : `<button class="mini-button" type="button" data-archive-id="${escapeHtml(project.id)}">Arquivar</button>`;
    const resetEffects = (processedData || variantBlocks.includes("audio-version"))
      ? `<button class="mini-button" type="button" data-reset-effects-id="${escapeHtml(project.id)}">Repor variantes</button>`
      : "";
    const mixedExport = getVariantData(project, "mixed")
      ? `<button class="mini-button primary" type="button" data-export-mixed-id="${escapeHtml(project.id)}">Exportar Mixed WAV</button>`
      : "";
    return `<div class="project${project.archived ? " is-archived" : ""}"><div class="project-cover" aria-hidden="true">${escapeHtml(coverGlyph)}</div><div class="project-content"><strong>${escapeHtml(project.name)} <span class="take-label">${escapeHtml(takeMeta)}</span></strong><small>${escapeHtml(projectArtist)} · ${escapeHtml(project.createdAt)} · ${escapeHtml(project.durationLabel || "duração não registada")}</small><small class="project-specs">${escapeHtml(String(project.tempo || 100))} BPM · ${escapeHtml(project.key || "C")} · ${trackCount} track${trackCount === 1 ? "" : "s"} · versão ${escapeHtml(projectVersion)}</small><div class="project-audio-stack">${original}${processed}${variantBlocks}${legacyNotice}${brief}${compedControl}</div><div class="project-actions">${gain}${fade}${normalize}${compressor}${vocalEnhancement}${pitchAssist}${mixedExport}${resetEffects}${process}${archiveButton}<button class="mini-button" type="button" data-rename-id="${escapeHtml(project.id)}">Renomear</button><button class="mini-button" type="button" data-duplicate-id="${escapeHtml(project.id)}">Duplicar</button><button class="mini-button danger" type="button" data-delete-id="${escapeHtml(project.id)}">Apagar</button></div></div><span class="pill">${escapeHtml(project.status)}</span></div>`;
    }).join("");
  renderProducerStudio();
  renderTimeline();
}
async function saveRecording({ blob, mimeType, seconds }) {
  const name = nameInput.value.trim() || `Take ${String(readProjects().length + 1).padStart(2, "0")}`;
  const activeSession = currentTimelineProject();
  const originalAudioData = await blobToDataUrl(blob);
  const now = Date.now();
  const clipKind = `recording-${now}`;
  const clipKey = `${activeSession?.id || "new"}:${clipKind}`;

  try {
    if (activeSession && timelineHistory?.present?.id === activeSession.id) {
      const project = normalizeProject(activeSession);
      const vocalTrack = project.tracks.find((track) => track.type === "audio" && /vocal|voz|take/i.test(track.name))
        || project.tracks.find((track) => track.type === "audio")
        || null;
      let nextProject = project;
      let trackId = vocalTrack?.id;
      if (!trackId) {
        nextProject = addTrack(nextProject, { name: "Lead Vocal", type: "audio", color: "#f06aa8" });
        trackId = nextProject.tracks[nextProject.tracks.length - 1].id;
      }
      const start = nextProject.tracks.find((track) => track.id === trackId)?.clips.reduce((end, clip) => Math.max(end, Number(clip.start || 0) + Number(clip.duration || 0)), 0) || 0;
      const recordingClipId = `${project.id}-recording-${now}`;
      nextProject = addClip(nextProject, trackId, {
        id: recordingClipId,
        blobKey: clipKey,
        start,
        duration: Number(seconds || 0),
        sourceOffset: 0,
        name,
        mimeType,
        gain: 1,
      });
      nextProject = normalizeProject({
        ...nextProject,
        status: "Vocal gravado na sessão",
        duration: Math.max(Number(project.duration || 0), start + Number(seconds || 0)),
        bytes: Number(project.bytes || 0) + Number(blob.size || 0),
        updatedAt: new Date().toISOString(),
      });
      await commitTimelineProject(nextProject);
      let persistedInIndexedDb = false;
      try {
        if (await indexedDbAvailable()) {
          await Promise.all([
            putAudioBlob(project.id, clipKind, blob),
            putTake({ id: `${project.id}:${clipKind}`, projectId: project.id, audioBlobKind: clipKind, originalAudioData: true, processedAudioData: false }),
          ]);
          persistedInIndexedDb = true;
        }
      } catch {
        persistedInIndexedDb = false;
      }
      if (!persistedInIndexedDb) {
        const fallbackProject = normalizeProject({
          ...nextProject,
          tracks: nextProject.tracks.map((track) => ({
            ...track,
            clips: track.clips.map((clip) => clip.id === recordingClipId ? { ...clip, audioData: originalAudioData } : clip),
          })),
          status: "Vocal gravado na sessão · fallback local",
        });
        await commitTimelineProject(fallbackProject);
        nextProject = fallbackProject;
        showToast("A gravação entrou na sessão; o fallback inline mantém playback e exportação locais.");
      }
      activeTimelineId = project.id;
      timelineHistory = createHistoryState(normalizeProject(nextProject));
      renderTimeline();
      renderMixer();
      renderProjects();
      await refreshStorageStatus();
      showToast(`“${name}” foi adicionada à Audio Track da sessão.`);
    } else {
      const projectId = makeProjectId();
      const takeGroupId = `takes-${name.toLocaleLowerCase("pt-PT").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || projectId}`;
      const takeNumber = readProjects().filter((item) => item.takeGroupId === takeGroupId || (!item.takeGroupId && item.name === name)).length + 1;
      const project = normalizeProject({ id: projectId, name, takeGroupId, takeNumber, takeLabel: `Take ${takeNumber}`, tempo: 100, key: "C", preset: presetInput.value, genre: genreInput.value, productionBrief: productionBriefInput?.value.trim() || "", duration: seconds, durationLabel: `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`, status: "Guardada localmente", createdAt: new Date().toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" }), bytes: blob.size, mimeType, originalMimeType: mimeType, originalAudioData, processedAudioData: null, processedMimeType: null, audioVariants: {} });
      const projects = readProjects();
      projects.unshift(project);
      saveProjects(projects);
      if (await indexedDbAvailable()) await Promise.all([putProject({ ...project, storageVersion: "indexeddb-v2" }), putTake({ id: project.id, projectId: project.id, originalAudioData: true, processedAudioData: false }), putAudioBlob(project.id, "original", blob)]);
      renderProjects();
      await refreshStorageStatus();
      showToast(`“${name}” foi guardada como nova sessão.`);
    }
  } catch (error) {
    console.error("Gravação não foi integrada na sessão", error);
    showToast(error instanceof Error ? `Não foi possível guardar a gravação: ${error.message}` : "Não foi possível guardar a gravação.");
  }
  nameInput.value = "";
  if (productionBriefInput) productionBriefInput.value = "";
}

async function applyLocalEffect(id, effectName, processor, successMessage, variant = "processed", sourceResolver = null) {
  const project = readProjects().find((item) => item.id === id);
  const sourceData = sourceResolver ? await sourceResolver(project) : getVariantData(project, "original");
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
async function applyLocalVoiceCleaner(id, options = {}) {
  return applyLocalEffect(id, "voiceCleanerApplied", (blob) => applyVoiceCleanerLocal(blob, options), "Voice Cleaner local aplicado. O original continua preservado.", "cleaned", resolveVocalSourceData);
}
async function applyLocalVoiceChanger(id, character = "deep") {
  return applyLocalEffect(id, "voiceChangerApplied", (blob) => applyVoiceChangerLocal(blob, { character }), "Voice Changer local aplicado. O original continua preservado.", "voiceChanged");
}
async function applyLocalHarmony(id, intensity = 0.35) {
  return applyLocalEffect(id, "harmonyApplied", (blob) => applyHarmonyLocal(blob, { intensity }), "Harmony local aplicado. O original continua preservado.", "harmony");
}
function harmonyLevel() { return Math.max(0, Math.min(1, Number(harmonyIntensity?.value || 35) / 100)); }
function setHarmonyStatus(message, state = "") {
  if (harmonyStatus) { harmonyStatus.textContent = message; harmonyStatus.dataset.state = state; }
}
async function previewHarmony() {
  const project = currentTimelineProject();
  const sourceData = getVariantData(project, "original");
  if (!project || !sourceData) { setHarmonyStatus("Abre ou grava uma sessão vocal antes da pré-escuta.", "error"); return; }
  try {
    const processed = await applyHarmonyLocal(await dataUrlToBlob(sourceData), { intensity: harmonyLevel() });
    if (voiceCleanerPreviewUrl) URL.revokeObjectURL(voiceCleanerPreviewUrl);
    voiceCleanerPreviewUrl = URL.createObjectURL(processed);
    const player = new Audio(voiceCleanerPreviewUrl);
    player.onended = () => URL.revokeObjectURL(voiceCleanerPreviewUrl);
    await player.play();
    setHarmonyStatus(`Pré-escuta Harmony: ${Math.round(harmonyLevel() * 100)}% em reprodução.`, "success");
  } catch (error) { setHarmonyStatus(`Pré-escuta indisponível: ${error instanceof Error ? error.message : "erro desconhecido"}.`, "error"); }
}
async function applyHarmonyFromUi() {
  const project = currentTimelineProject();
  if (!project) { setHarmonyStatus("Abre ou grava uma sessão vocal antes de aplicar.", "error"); return; }
  await applyLocalHarmony(project.id, harmonyLevel());
  setHarmonyStatus("Harmony aplicado como variante reversível.", "success");
  renderProducerStudio();
}
async function resetLocalHarmony() {
  const project = currentTimelineProject();
  if (!project) return;
  const updated = readProjects().map((item) => item.id === project.id ? { ...item, audioVariants: Object.fromEntries(Object.entries(item.audioVariants || {}).filter(([key]) => key !== "harmony")), harmonyApplied: false, status: "Harmony revertido; vocal anterior preservado" } : item);
  saveProjects(updated);
  try { if (await indexedDbAvailable()) await Promise.all([deleteAudioBlob(project.id, "harmony"), putProject(updated.find((item) => item.id === project.id))]); } catch { showToast("A variante Harmony foi revertida localmente; o reset IndexedDB será tentado novamente."); }
  setHarmonyStatus("Harmony revertido; Original preservado.", "success");
  renderProjects();
  renderProducerStudio();
}
function voiceChangerCharacterValue() { return voiceChangerCharacter?.value || "deep"; }
function voiceCharacterLevel() { return Math.max(0, Math.min(1, Number(voiceCharacterIntensity?.value || 65) / 100)); }
function setVoiceCharacterStatus(message, state = "") { if (voiceCharacterStatus) { voiceCharacterStatus.textContent = message; voiceCharacterStatus.dataset.state = state; } }
async function previewVoiceCharacter() {
  const project = currentTimelineProject();
  const sourceData = getVariantData(project, "original");
  if (!project || !sourceData) { setVoiceCharacterStatus("Abre ou grava uma sessão vocal antes da pré-escuta.", "error"); return; }
  try {
    const processed = await applyVoiceCharacterLocal(await dataUrlToBlob(sourceData), { character: voiceCharacterProfile?.value || "natural", intensity: voiceCharacterLevel() });
    if (voiceCleanerPreviewUrl) URL.revokeObjectURL(voiceCleanerPreviewUrl);
    voiceCleanerPreviewUrl = URL.createObjectURL(processed);
    const player = new Audio(voiceCleanerPreviewUrl);
    player.onended = () => URL.revokeObjectURL(voiceCleanerPreviewUrl);
    await player.play();
    setVoiceCharacterStatus(`Pré-escuta ${voiceCharacterProfile?.value || "natural"}: ${Math.round(voiceCharacterLevel() * 100)}%.`, "success");
  } catch (error) { setVoiceCharacterStatus(`Pré-escuta indisponível: ${error instanceof Error ? error.message : "erro desconhecido"}.`, "error"); }
}
async function applyLocalVoiceCharacter(id, character = "natural", intensity = 0.65) {
  return applyLocalEffect(id, "voiceCharacterApplied", (blob) => applyVoiceCharacterLocal(blob, { character, intensity }), "Voice Character local aplicado. O original continua preservado.", "voiceCharacter");
}
async function applyVoiceCharacterFromUi() {
  const project = currentTimelineProject();
  if (!project) { setVoiceCharacterStatus("Abre ou grava uma sessão vocal antes de aplicar.", "error"); return; }
  await applyLocalVoiceCharacter(project.id, voiceCharacterProfile?.value || "natural", voiceCharacterLevel());
  setVoiceCharacterStatus("Voice Character aplicado como variante reversível.", "success");
  renderProducerStudio();
}
async function resetVoiceCharacter() {
  const project = currentTimelineProject();
  if (!project) return;
  const updated = readProjects().map((item) => item.id === project.id ? { ...item, audioVariants: Object.fromEntries(Object.entries(item.audioVariants || {}).filter(([key]) => key !== "voiceCharacter")), voiceCharacterApplied: false, status: "Voice Character revertido; vocal anterior preservado" } : item);
  saveProjects(updated);
  try { if (await indexedDbAvailable()) await Promise.all([deleteAudioBlob(project.id, "voiceCharacter"), putProject(updated.find((item) => item.id === project.id))]); } catch { showToast("A variante Voice Character foi revertida localmente; o reset IndexedDB será tentado novamente."); }
  setVoiceCharacterStatus("Voice Character revertido; Original preservado.", "success");
  renderProjects();
  renderProducerStudio();
}
function setVoiceChangerStatus(message, state = "") {
  if (voiceChangerStatus) { voiceChangerStatus.textContent = message; voiceChangerStatus.dataset.state = state; }
}
async function previewVoiceChanger() {
  const project = currentTimelineProject();
  const sourceData = getVariantData(project, "original");
  if (!project || !sourceData) { setVoiceChangerStatus("Abre ou grava uma sessão vocal antes da pré-escuta.", "error"); return; }
  try {
    const processed = await applyVoiceChangerLocal(await dataUrlToBlob(sourceData), { character: voiceChangerCharacterValue() });
    if (voiceCleanerPreviewUrl) URL.revokeObjectURL(voiceCleanerPreviewUrl);
    voiceCleanerPreviewUrl = URL.createObjectURL(processed);
    const player = new Audio(voiceCleanerPreviewUrl);
    player.onended = () => URL.revokeObjectURL(voiceCleanerPreviewUrl);
    await player.play();
    setVoiceChangerStatus(`Pré-escuta ${voiceChangerCharacterValue()} em reprodução.`, "success");
  } catch (error) { setVoiceChangerStatus(`Pré-escuta indisponível: ${error instanceof Error ? error.message : "erro desconhecido"}.`, "error"); }
}
async function applyVoiceChangerFromUi() {
  const project = currentTimelineProject();
  if (!project) { setVoiceChangerStatus("Abre ou grava uma sessão vocal antes de aplicar.", "error"); return; }
  await applyLocalVoiceChanger(project.id, voiceChangerCharacterValue());
  setVoiceChangerStatus("Voice Changer aplicado como variante reversível.", "success");
  renderProducerStudio();
}
async function resetLocalVoiceChanger() {
  const project = currentTimelineProject();
  if (!project) return;
  const updated = readProjects().map((item) => item.id === project.id ? { ...item, audioVariants: Object.fromEntries(Object.entries(item.audioVariants || {}).filter(([key]) => key !== "voiceChanged")), voiceChangerApplied: false, status: "Voice Changer revertido; vocal anterior preservado" } : item);
  saveProjects(updated);
  try { if (await indexedDbAvailable()) await Promise.all([deleteAudioBlob(project.id, "voiceChanged"), putProject(updated.find((item) => item.id === project.id))]); } catch { showToast("A variante foi revertida localmente; o reset IndexedDB será tentado novamente."); }
  setVoiceChangerStatus("Voice Changer revertido; Original preservado.", "success");
  renderProjects();
  renderProducerStudio();
}
function applyLocalPitchAssist(id) {
  return applyLocalEffect(id, "pitchCorrectionApplied", applyPitchCorrectionAssist, "Pitch correction assistida aplicada localmente. O original continua preservado.", "pitchCorrected");
}
function voiceCleanerOptions() {
  return { noiseRemoval: Boolean(voiceCleanerNoise?.checked), dereverb: Boolean(voiceCleanerDereverb?.checked), autoEq: Boolean(voiceCleanerAutoEq?.checked) };
}
function setVoiceCleanerStatus(message, state = "") {
  if (voiceCleanerStatus) { voiceCleanerStatus.textContent = message; voiceCleanerStatus.dataset.state = state; }
}
async function analyzeVoiceCleaner() {
  const project = currentTimelineProject();
  const sourceData = await resolveVocalSourceData(project);
  if (!project || !sourceData) { setVoiceCleanerStatus("Adiciona ou grava um clip vocal antes de analisar.", "error"); return; }
  try {
    const analysis = await analyzeAudioDataUrl(sourceData);
    const peakDb = analysis.vocal?.peakDb ?? analysis.peakDb;
    const rmsDb = analysis.vocal?.rmsDb ?? analysis.rmsDb;
    const peak = Number.isFinite(peakDb) ? `${peakDb.toFixed(1)} dBFS` : "indisponível";
    const rms = Number.isFinite(rmsDb) ? `${rmsDb.toFixed(1)} dBFS` : "indisponível";
    if (voiceCleanerAnalysis) voiceCleanerAnalysis.textContent = `Análise local: ${Number(analysis.duration ?? analysis.durationSeconds ?? 0).toFixed(2)} s · pico ${peak} · loudness RMS ${rms}. Os módulos seleccionados serão processados de forma reversível.`;
    setVoiceCleanerStatus("Análise concluída localmente.", "success");
  } catch (error) { setVoiceCleanerStatus(`Não foi possível analisar o vocal: ${error instanceof Error ? error.message : "erro desconhecido"}.`, "error"); }
}
async function previewVoiceCleaner() {
  const project = currentTimelineProject();
  const sourceData = await resolveVocalSourceData(project);
  if (!project || !sourceData) { setVoiceCleanerStatus("Adiciona ou grava um clip vocal antes da pré-escuta.", "error"); return; }
  try {
    const processed = await applyVoiceCleanerLocal(await dataUrlToBlob(sourceData), voiceCleanerOptions());
    if (voiceCleanerPreviewUrl) URL.revokeObjectURL(voiceCleanerPreviewUrl);
    voiceCleanerPreviewUrl = URL.createObjectURL(processed);
    const player = new Audio(voiceCleanerPreviewUrl);
    player.onended = () => URL.revokeObjectURL(voiceCleanerPreviewUrl);
    await player.play();
    setVoiceCleanerStatus("Pré-escuta Voice Cleaner em reprodução.", "success");
  } catch (error) { setVoiceCleanerStatus(`Pré-escuta indisponível: ${error instanceof Error ? error.message : "erro desconhecido"}.`, "error"); }
}
async function applyVoiceCleanerFromUi() {
  const project = currentTimelineProject();
  if (!project) { setVoiceCleanerStatus("Abre ou grava uma sessão vocal antes de aplicar.", "error"); return; }
  await applyLocalVoiceCleaner(project.id, voiceCleanerOptions());
  setVoiceCleanerStatus("Voice Cleaner aplicado como variante reversível.", "success");
  renderProducerStudio();
}
async function resetLocalVoiceCleaner() {
  const project = currentTimelineProject();
  if (!project) return;
  const updated = readProjects().map((item) => item.id === project.id ? { ...item, audioVariants: Object.fromEntries(Object.entries(item.audioVariants || {}).filter(([key]) => key !== "cleaned")), voiceCleanerApplied: false, status: "Voice Cleaner revertido; vocal anterior preservado" } : item);
  saveProjects(updated);
  try { if (await indexedDbAvailable()) await Promise.all([deleteAudioBlob(project.id, "cleaned"), putProject(updated.find((item) => item.id === project.id))]); } catch { showToast("A variante foi revertida localmente; a limpeza IndexedDB será tentada novamente."); }
  setVoiceCleanerStatus("Voice Cleaner revertido; Original preservado.", "success");
  renderProjects();
  renderProducerStudio();
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

const recorder = createRecorderController({ onStateChange: setRecordingUI, onMetrics: setRecordingMetrics, getInputDeviceId: () => recordInputDevice?.value || "default", onComplete: async (payload) => { await saveRecording(payload); await loadRecordInputDevices(); }, showToast });
loadRecordInputDevices();
recordMonitorToggle?.addEventListener("change", () => recorder.setMonitoring({ enabled: recordMonitorToggle.checked, volume: Number(recordMonitorVolume?.value || 35) / 100 }));
recordMonitorVolume?.addEventListener("input", () => { if (recordMonitorVolumeValue) recordMonitorVolumeValue.textContent = `${recordMonitorVolume.value}%`; recorder.setMonitoring({ enabled: recordMonitorToggle?.checked, volume: Number(recordMonitorVolume.value) / 100 }); });

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
      const providerLabel = result.provider || result.providerName || "provider server-side";
      producerAiStatus.dataset.state = "success";
      producerAiStatus.textContent = `${advice.summary} · ${providerLabel} respondeu. Cadeia: ${advice.chain.join(" → ")} · confiança ${advice.confidence}. O motor local vai materializar o arranjo de forma reversível.`;
    }
    await runProducerPlan(project.id, { planOverride: recommendationPlan, sourceLabel: "ai" });
  } catch (error) {
    const status = error.status || "provider_unavailable";
    const fallbackPlan = buildProducerPlan({
      genre: project.genre || "Afrobeat",
      tempo: project.tempo || 100,
      key: project.key || "C",
      duration: Number(project.duration || 60),
      brief: project.productionBrief || "",
      analysis: project.analysis || null,
      preferAnalysis: Boolean(project.analysis?.hasAudio),
    });
    const fallbackAdvice = {
      summary: "O provider generativo está indisponível; o assistente local preparou uma direcção reversível.",
      chain: ["Arranjo local", "Instrumental local", "Mix local", "Master local"],
      confidence: "medium",
      source: "local-fallback",
      providerStatus: status,
    };
    const fallbackProjects = readProjects().map((item) => item.id === project.id
      ? { ...item, aiRecommendation: fallbackAdvice, aiRecommendedPlan: fallbackPlan, aiRecommendationSource: "local-fallback" }
      : item);
    saveProjects(fallbackProjects);
    if (producerAiStatus) {
      producerAiStatus.dataset.state = "fallback";
      producerAiStatus.textContent = `${error.message || "Recomendação IA indisponível."} O Assistente local aplicará agora um plano reversível; isto não é uma resposta generativa do provider.`;
    }
    try {
      await runProducerPlan(project.id, { planOverride: fallbackPlan, sourceLabel: "local-fallback" });
      if (producerAiStatus) producerAiStatus.textContent += " Plano local aplicado à timeline.";
    } catch (fallbackError) {
      if (producerAiStatus) producerAiStatus.textContent += ` O fallback local também falhou: ${fallbackError.message || "erro desconhecido"}.`;
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
voiceCleanerAnalyze?.addEventListener("click", analyzeVoiceCleaner);
voiceCleanerPreview?.addEventListener("click", previewVoiceCleaner);
voiceCleanerApply?.addEventListener("click", applyVoiceCleanerFromUi);
voiceCleanerReset?.addEventListener("click", resetLocalVoiceCleaner);
voiceChangerPreview?.addEventListener("click", previewVoiceChanger);
voiceChangerApply?.addEventListener("click", applyVoiceChangerFromUi);
voiceChangerReset?.addEventListener("click", resetLocalVoiceChanger);
harmonyIntensity?.addEventListener("input", () => { if (harmonyIntensityValue) harmonyIntensityValue.textContent = `${harmonyIntensity.value}%`; });
harmonyPreview?.addEventListener("click", previewHarmony);
harmonyApply?.addEventListener("click", applyHarmonyFromUi);
harmonyReset?.addEventListener("click", resetLocalHarmony);
voiceCharacterIntensity?.addEventListener("input", () => { if (voiceCharacterIntensityValue) voiceCharacterIntensityValue.textContent = `${voiceCharacterIntensity.value}%`; });
voiceCharacterPreview?.addEventListener("click", previewVoiceCharacter);
voiceCharacterApply?.addEventListener("click", applyVoiceCharacterFromUi);
voiceCharacterReset?.addEventListener("click", resetVoiceCharacter);
producerApplyAutoTune?.addEventListener("click", applyLocalAutoTune);
producerResetAutoTune?.addEventListener("click", resetLocalAutoTune);
producerApplySpace?.addEventListener("click", applyLocalSpaceEffects);
producerResetSpace?.addEventListener("click", resetLocalSpaceEffects);
producerReverbIntensity?.addEventListener("input", () => { if (producerReverbValue) producerReverbValue.textContent = `${producerReverbIntensity.value}%`; });
producerDelayIntensity?.addEventListener("input", () => { if (producerDelayValue) producerDelayValue.textContent = `${producerDelayIntensity.value}%`; });
producerVocalBeatMix?.addEventListener("click", mixImportedBeatWithVocal);
[[producerBypassAutoTune, "autoTune"], [producerBypassReverb, "reverb"], [producerBypassDelay, "delay"]].forEach(([button, key]) => button?.addEventListener("click", () => { effectBypassState[key] = !effectBypassState[key]; updateIndividualBypassUI(); }));
automixGenre?.addEventListener("change", () => { renderAutoMixProposal(); if (automixStatus) automixStatus.textContent = "Nova proposta AutoMix pronta para preview."; });
automixPreview?.addEventListener("click", previewAutoMix);
automixApply?.addEventListener("click", applyAutoMix);
automixReset?.addEventListener("click", resetAutoMix);
masteringPreset?.addEventListener("change", () => { updateMasteringControls(); if (masteringStatus) masteringStatus.textContent = `Preset ${masteringPreset.value} seleccionado · pronto para preview.`; });
[masteringIntensity, masteringLoudness, masteringDynamics, masteringStereo, masteringEq].forEach((input) => input?.addEventListener("input", () => { updateMasteringControls(); if (masteringStatus) masteringStatus.textContent = "Parâmetros Mastering alterados · faz Preview para comparar."; }));
masteringPreview?.addEventListener("click", previewMastering);
masteringApply?.addEventListener("click", applyMasteringFromUi);
masteringReset?.addEventListener("click", resetMastering);

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
  if (cloudSyncStatus) cloudSyncStatus.textContent = "Sincronizando…";
  try {
    await saveCloudProject(project);
    saveProjects(readProjects().map((item) => item.id === project.id ? { ...item, cloudSynced: true, status: "Manifesto cloud guardado · áudio local" } : item));
    renderProjects();
    if (cloudSyncStatus) cloudSyncStatus.textContent = "Salvo agora · Sincronizado. O áudio permanece neste dispositivo.";
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
projectSearch?.addEventListener("input", renderProjects);
projectFilter?.addEventListener("change", renderProjects);
projectsHubSearch?.addEventListener("input", renderProjects);
document.querySelectorAll("[data-projects-hub-filter]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-projects-hub-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
  renderProjects();
}));
window.addEventListener("fernando-authenticated", () => { syncCloudProjects(); });
window.addEventListener("firebase-signed-out", () => {
  if (saveCloudProjectButton) saveCloudProjectButton.disabled = true;
  if (cloudSyncStatus) cloudSyncStatus.textContent = "Sessão terminada. Os projectos locais continuam disponíveis.";
});

updateIndividualBypassUI();
updateEffectPresetOptions();
updateABMeters();
updateMasteringControls();

function openProjectFromCard(openButton) {
  activeTimelineId = openButton.dataset.openProject || null;
  renderTimeline();
  renderProducerStudio();
}

recentProjects?.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-project]");
  if (!openButton) return;
  openProjectFromCard(openButton);
});

projectsHubList?.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-project]");
  if (openButton) openProjectFromCard(openButton);
  const archiveButton = event.target.closest("[data-archive-id]");
  if (archiveButton) {
    const id = archiveButton.dataset.archiveId;
    saveProjects(readProjects().map((project) => project.id === id ? { ...project, archived: !project.archived, status: project.archived ? "Restaurada localmente" : "Arquivada localmente" } : project));
    renderProjects();
    showToast("Estado do projecto actualizado.");
  }
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
  const compedButton = event.target.closest("[data-create-comped]");
  if (compedButton) createCompedVocal(compedButton.dataset.createComped, compedButton.closest(".project"));
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
  if (field === "input") {
    const trackId = trackNode.dataset.mixerTrack;
    commitTimelineProject(updateTrack(timelineHistory.present, trackId, { input: control.value }));
    return;
  }
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
  if (field !== "muted" && field !== "solo" && field !== "recordArmed") return;
  const trackId = trackNode.dataset.mixerTrack;
  const track = timelineHistory.present.tracks.find((item) => item.id === trackId);
  if (track) commitTimelineProject(updateTrack(timelineHistory.present, trackId, { [field]: !track[field] }));
});

mixerMasterGain?.addEventListener("input", (event) => {
  if (!timelineHistory) return;
  const gainDb = Number(event.target.value) || 0;
  const gain = Math.pow(10, gainDb / 20);
  if (mixerMasterGainValue) mixerMasterGainValue.textContent = `${gainDb >= 0 ? "+" : ""}${gainDb.toFixed(1)} dB`;
  commitTimelineProject({ ...timelineHistory.present, master: { ...(timelineHistory.present.master || {}), gain } });
});
mixerMasterPan?.addEventListener("input", (event) => {
  if (!timelineHistory) return;
  const pan = Math.max(-1, Math.min(1, Number(event.target.value) || 0));
  if (mixerMasterPanValue) mixerMasterPanValue.textContent = pan.toFixed(2);
  commitTimelineProject({ ...timelineHistory.present, master: { ...(timelineHistory.present.master || {}), pan } });
});
mixerMasterLimiter?.addEventListener("input", (event) => {
  if (!timelineHistory) return;
  const limiter = Math.max(0.1, Math.min(1, Number(event.target.value) || 1));
  if (mixerMasterLimiterValue) mixerMasterLimiterValue.textContent = `${Math.round(limiter * 100)}%`;
  commitTimelineProject({ ...timelineHistory.present, master: { ...(timelineHistory.present.master || {}), limiter } });
});
mixerMasterBypass?.addEventListener("click", () => {
  if (!timelineHistory) return;
  const master = timelineHistory.present.master || {};
  commitTimelineProject({ ...timelineHistory.present, master: { ...master, bypass: !master.bypass } });
});

mixerInspector?.addEventListener("click", (event) => {
  if (!timelineHistory || !selectedMixerTrackId) return;
  const track = timelineHistory.present.tracks.find((item) => item.id === selectedMixerTrackId);
  if (!track) return;
  const effects = Array.isArray(track.effects) ? [...track.effects] : [];
  const addButton = event.target.closest("[data-mixer-fx-add]");
  const bypassButton = event.target.closest("[data-mixer-fx-bypass]");
  const removeButton = event.target.closest("[data-mixer-fx-remove]");
  if (addButton) effects.push({ type: "compressor", intensity: 0.5, bypass: false });
  else if (bypassButton) { const index = Number(bypassButton.dataset.mixerFxBypass); if (effects[index]) effects[index] = { ...effects[index], bypass: !effects[index].bypass }; }
  else if (removeButton) effects.splice(Number(removeButton.dataset.mixerFxRemove), 1);
  else return;
  commitTimelineProject(updateTrack(timelineHistory.present, selectedMixerTrackId, { effects }));
});
mixerInspector?.addEventListener("input", (event) => {
  if (!timelineHistory || !selectedMixerTrackId) return;
  const control = event.target.closest("[data-mixer-fx-field]");
  if (!control) return;
  const track = timelineHistory.present.tracks.find((item) => item.id === selectedMixerTrackId);
  if (!track) return;
  const effects = Array.isArray(track.effects) ? [...track.effects] : [];
  const index = Number(control.dataset.fxIndex);
  if (!effects[index]) return;
  if (control.dataset.mixerFxField === "type") effects[index] = { ...effects[index], type: control.value };
  if (control.dataset.mixerFxField === "intensity") {
    const intensity = Math.max(0, Math.min(1, Number(control.value) || 0));
    effects[index] = { ...effects[index], intensity };
    const output = mixerInspector.querySelector(`[data-fx-output="intensity"][data-fx-index="${index}"]`);
    if (output) output.textContent = `${Math.round(intensity * 100)}%`;
  }
  commitTimelineProject(updateTrack(timelineHistory.present, selectedMixerTrackId, { effects }));
});
mixerInspector?.addEventListener("click", (event) => {
  if (!timelineHistory || !selectedMixerTrackId) return;
  const remove = event.target.closest("[data-automation-remove]");
  const add = event.target.closest("[data-automation-add]");
  if (!remove && !add) return;
  const track = timelineHistory.present.tracks.find((item) => item.id === selectedMixerTrackId);
  if (!track) return;
  if (remove) {
    const nextAutomation = removeAutomationPoint(track.automation, remove.dataset.automationTarget, Number(remove.dataset.automationTime), Number(remove.dataset.automationFxIndex));
    commitTimelineProject(updateTrack(timelineHistory.present, selectedMixerTrackId, { automation: nextAutomation }));
    return;
  }
  const target = mixerInspector.querySelector('[data-automation-field="target"]')?.value || "volume";
  const time = Number(mixerInspector.querySelector('[data-automation-field="time"]')?.value || 0);
  const value = Number(mixerInspector.querySelector('[data-automation-field="value"]')?.value || 0);
  const fxIndex = Math.max(0, Number(mixerInspector.querySelector('[data-automation-field="fx-index"]')?.value || 1) - 1);
  const nextAutomation = upsertAutomationPoint(track.automation, target, { time, value }, fxIndex);
  commitTimelineProject(updateTrack(timelineHistory.present, selectedMixerTrackId, { automation: nextAutomation }));
});
mixerInspector?.addEventListener("change", (event) => {
  if (!timelineHistory || !selectedMixerTrackId || !event.target.matches("[data-automation-enabled]")) return;
  const track = timelineHistory.present.tracks.find((item) => item.id === selectedMixerTrackId);
  if (!track) return;
  const automation = normalizeTrackAutomation(track.automation);
  commitTimelineProject(updateTrack(timelineHistory.present, selectedMixerTrackId, { automation: { ...automation, enabled: event.target.checked } }));
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
  const [trackId, clipId] = (button.dataset.clipKey || button.dataset.duplicateClip || button.dataset.deleteClip || button.dataset.copyClip || button.dataset.pasteClip || "").split(":");
  if (!trackId || !clipId) return;
  const sourceClip = timelineHistory.present.tracks.flatMap((track) => track.clips).find((item) => item.id === clipId);
  if (button.dataset.copyClip) { timelineClipboard = sourceClip ? JSON.parse(JSON.stringify(sourceClip)) : null; showToast(timelineClipboard ? `“${timelineClipboard.name}” copiado.` : "Não foi possível copiar o clip."); return; }
  const actionName = button.dataset.clipAction;
  let next = timelineHistory.present;
  if (button.dataset.pasteClip) {
    if (!timelineClipboard) return showToast("Copia primeiro um clip para colar.");
    const targetTrack = timelineHistory.present.tracks.find((track) => track.id === trackId);
    const targetClip = targetTrack?.clips.find((clip) => clip.id === clipId);
    const pasted = { ...JSON.parse(JSON.stringify(timelineClipboard)), id: `${timelineClipboard.id}-paste-${Date.now()}`, start: Math.max(0, Number(targetClip?.start || 0) + Number(targetClip?.duration || 0)) };
    next = { ...timelineHistory.present, tracks: timelineHistory.present.tracks.map((track) => track.id === trackId ? { ...track, clips: [...track.clips, pasted] } : track) };
  } else if (button.dataset.duplicateClip) next = duplicateClip(next, trackId, clipId);
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
timelineSaveButton?.addEventListener("click", () => { saveCurrentProjectToCloud(); });
timelineShareButton?.addEventListener("click", () => { shareFinalTrack(); });
timelineExportButton?.addEventListener("click", () => { const project = currentTimelineProject(); if (project) exportMixedVersion(project.id); else showToast("Abre ou grava uma sessão antes de exportar."); });

addTrackButton?.addEventListener("click", () => {
  const project = ensureProductionSession("Nova sessão de produção");
  if (!project || !timelineHistory) return showToast("Não foi possível abrir a sessão de produção.");
  const type = addTrackType?.value || "audio";
  const labels = { audio: "Audio", midi: "MIDI", instrument: "Instrument", drums: "Drum", vocal: "Vocal", bus: "Bus", fx: "FX" };
  const colors = { audio: "#62d6c7", midi: "#9c8cff", instrument: "#9c8cff", drums: "#f4b860", vocal: "#f06aa8", bus: "#6ea8fe", fx: "#d68cff" };
  const name = window.prompt("Nome da track", `${labels[type]} track`);
  if (name) commitTimelineProject(addTrack(timelineHistory.present, { name, type, color: colors[type] || colors.audio }));
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
async function playTimeline() {
  try { await ensureAudioContextRunning(); } catch (error) { showToast(error instanceof Error ? error.message : "Não foi possível activar o áudio."); return; }
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
const keyboardPhysicalMap = { a: "C", w: "C#", s: "D", e: "D#", d: "E", f: "F", t: "F#", g: "G", y: "G#", h: "A", u: "A#", j: "B" };
async function refreshSamplerSources() {
  if (!samplerSource || !activeTimelineId || !timelineHistory?.present) return;
  const project = timelineHistory.present;
  const variants = Object.keys(VOCAL_VARIANTS).filter((variant) => getVariantData(project, variant) || variant === "original");
  const current = samplerSource.value;
  samplerSource.innerHTML = `<option value="">Seleccionar áudio da sessão</option>${variants.map((variant) => `<option value="${variant}">${VOCAL_VARIANTS[variant].label}</option>`).join("")}`;
  samplerSource.value = variants.includes(current) ? current : (variants.includes("mastered") ? "mastered" : "original");
}
async function loadSamplerBuffer(sourceId = samplerSource?.value) {
  if (!sourceId || !activeTimelineId || !timelineHistory?.present) return null;
  if (samplerBuffers.has(sourceId)) return samplerBuffers.get(sourceId);
  const project = timelineHistory.present;
  const variant = canonicalVariant(sourceId);
  let blob = null;
  try { if (await indexedDbAvailable()) blob = await getAudioBlob(activeTimelineId, blobKindForVariant(variant)); } catch {}
  if (!blob) {
    const data = getVariantData(project, variant);
    if (data) blob = await dataUrlToBlob(data, getVariantMime(project, variant));
  }
  if (!blob) throw new Error("A fonte seleccionada ainda não tem áudio persistido.");
  const buffer = await getAudioContext().decodeAudioData(await blob.arrayBuffer());
  samplerBuffers.set(sourceId, buffer);
  samplerState = updateSamplerState(samplerState, { sourceId, duration: buffer.duration, start: 0, end: buffer.duration, loopStart: 0, loopEnd: buffer.duration });
  if (samplerStart) { samplerStart.max = String(buffer.duration); samplerStart.value = "0"; }
  if (samplerEnd) { samplerEnd.max = String(buffer.duration); samplerEnd.value = String(buffer.duration); }
  if (samplerStartValue) samplerStartValue.value = "0.00s";
  if (samplerEndValue) samplerEndValue.value = `${buffer.duration.toFixed(2)}s`;
  if (samplerStatus) samplerStatus.textContent = `${VOCAL_VARIANTS[variant]?.label || variant} · ${buffer.duration.toFixed(2)}s`;
  return buffer;
}
function updateSamplerFromControls() {
  const patch = {
    sourceId: samplerSource?.value || null,
    start: Number(samplerStart?.value || 0),
    end: Number(samplerEnd?.value || samplerState.duration),
    pitch: Number(samplerPitch?.value || 0),
    reverse: Boolean(samplerReverse?.checked),
    loop: Boolean(samplerLoop?.checked),
    filterType: samplerFilter?.value || "lowpass",
  };
  if (patch.end < patch.start) patch.end = patch.start + 0.01;
  samplerState = updateSamplerState(samplerState, patch);
  if (samplerStartValue) samplerStartValue.value = `${samplerState.start.toFixed(2)}s`;
  if (samplerEndValue) samplerEndValue.value = `${samplerState.end.toFixed(2)}s`;
  if (samplerPitchValue) samplerPitchValue.value = `${samplerState.pitch > 0 ? "+" : ""}${samplerState.pitch} st`;
}
async function previewSampler(noteName = "C4") {
  const buffer = await loadSamplerBuffer(samplerSource?.value);
  if (!buffer) throw new Error("Selecciona uma fonte do Sampler.");
  updateSamplerFromControls();
  await playSamplerVoice(getAudioContext(), buffer, samplerState, { pitch: 0, velocity: Number(keyboardVelocity?.value || 0.82) });
}
function updateLooperFromControls() {
  looperState = createLooperState({
    ...looperState,
    duration: Number(looperDuration?.value || looperState.duration),
    quantize: looperQuantize?.value || looperState.quantize,
    overdub: looperOverdub?.checked !== false,
  });
  if (looperDuration) looperDuration.value = String(looperState.duration);
  return looperState;
}
function renderLooperLayers() {
  if (!looperLayers) return;
  const summary = looperSummary(looperState);
  looperLayers.innerHTML = looperState.layers.length ? looperState.layers.map((layer) => `<div class="looper-layer ${layer.muted ? "is-muted" : ""}" data-looper-layer="${escapeHtml(layer.id)}"><span><strong>${escapeHtml(layer.name)}</strong><small>${layer.events.length} eventos · ganho ${Math.round(layer.gain * 100)}%</small></span><button type="button" class="mini-button" data-looper-mute="${escapeHtml(layer.id)}" aria-pressed="${layer.muted}">${layer.muted ? "Activar" : "Silenciar"}</button></div>`).join("") : `<span class="instrument-note">Nenhuma camada criada.</span>`;
  if (looperStatus) looperStatus.textContent = `${summary.activeLayers}/${summary.layers} camadas activas · ${summary.duration.toFixed(2)}s · ${summary.quantize}`;
}
function createLooperLayerFromInput() {
  updateLooperFromControls();
  const events = keyboardMidiRecording?.events?.length ? keyboardMidiRecording.events.map((event) => ({ type: "midi", time: event.time, duration: event.duration, value: event.velocity })) : [];
  if (!events.length && !samplerSource?.value) {
    showToast("Grava notas no teclado ou selecciona uma fonte Sampler antes de adicionar uma camada.");
    return;
  }
  const source = events.length ? "keyboard-midi" : samplerSource.value;
  const layer = { name: `Layer ${looperState.layers.length + 1}`, source, events: events.length ? events : [{ type: "audio-source", time: 0, duration: looperState.duration, value: 1 }] };
  looperState = addLooperLayer(looperState, layer);
  renderLooperLayers();
  showToast(`${layer.name} adicionada ao Looper.`);
}
async function materializeLooperToTimeline() {
  updateLooperFromControls();
  if (!looperState.layers.length) return showToast("Adiciona pelo menos uma camada ao Looper.");
  const clip = materializeLooperClip(looperState, { name: `Looper · ${looperState.layers.length} camadas` });
  const added = await insertInstrumentClip({ name: clip.name, type: "instrument", duration: clip.duration, metadata: clip.event });
  if (added && looperStatus) looperStatus.textContent = "Looper materializado na timeline · clip reversível.";
}
looperDuration?.addEventListener("input", () => { updateLooperFromControls(); renderLooperLayers(); });
looperQuantize?.addEventListener("change", () => { updateLooperFromControls(); renderLooperLayers(); });
looperOverdub?.addEventListener("change", () => { updateLooperFromControls(); renderLooperLayers(); });
looperAddLayer?.addEventListener("click", createLooperLayerFromInput);
looperUndoLayer?.addEventListener("click", () => { looperState = removeLastLooperLayer(looperState); renderLooperLayers(); showToast("Última camada removida sem alterar as fontes."); });
looperMaterialize?.addEventListener("click", materializeLooperToTimeline);
looperLayers?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-looper-mute]");
  if (!button) return;
  looperState = toggleLooperLayerMute(looperState, button.dataset.looperMute);
  renderLooperLayers();
});
renderLooperLayers();
async function previewKeyboardNote(noteName) {
  const octave = Number(keyboardOctave?.value || 4);
  const velocity = Math.max(0.1, Math.min(1, Number(keyboardVelocity?.value || 0.82)));
  const duration = keyboardSustain?.checked ? 1.25 : 0.42;
  const note = `${noteName}${octave}`;
  const button = keyboardNotes?.querySelector(`[data-note-name="${noteName}"]`);
  if (button) { flashControl(button); button.classList.add("is-active"); }
  if (keyboardMidiRecording) {
    const elapsed = Math.max(0, (performance.now() - keyboardMidiRecording.startedAt) / 1000);
    const grid = { "1/4": 0.5, "1/8": 0.25, "1/16": 0.125, "1/32": 0.0625, triplet: 1 / 6 }[keyboardQuantize?.value || "1/16"];
    const time = keyboardQuantize?.value ? Math.round(elapsed / grid) * grid : elapsed;
    keyboardMidiRecording.events.push({ note, time, duration, velocity, instrument: "piano" });
    if (keyboardMidiStatus) keyboardMidiStatus.textContent = `${keyboardMidiRecording.events.length} notas gravadas · ${time.toFixed(2)}s`;
  }
  try {
    if (samplerSource?.value) await previewSampler(note);
    else await playNote(note, { duration, volume: velocity * 0.18 });
  }
  catch (error) { showToast(error.message); }
  finally { window.setTimeout(() => button?.classList.remove("is-active"), duration * 1000); }
}
keyboardNotes?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-note-name]");
  if (!button) return;
  await previewKeyboardNote(button.dataset.noteName);
});
keyboardVelocity?.addEventListener("input", () => { if (keyboardVelocityValue) keyboardVelocityValue.value = `${Math.round(Number(keyboardVelocity.value) * 100)}%`; });
[samplerSource, samplerStart, samplerEnd, samplerPitch, samplerReverse, samplerLoop, samplerFilter].forEach((control) => control?.addEventListener("input", updateSamplerFromControls));
samplerSource?.addEventListener("change", async () => { samplerBuffers.delete(samplerSource.value); try { await loadSamplerBuffer(samplerSource.value); } catch (error) { if (samplerStatus) samplerStatus.textContent = error.message; } });
samplerPreview?.addEventListener("click", async () => { try { await previewSampler("C4"); } catch (error) { if (samplerStatus) samplerStatus.textContent = error.message; } });
keyboardQuantize?.addEventListener("change", () => showToast(`Quantização do teclado: ${keyboardQuantize.value}.`));
keyboardMidiRecord?.addEventListener("click", async () => {
  if (!keyboardMidiRecording) {
    keyboardMidiRecording = { startedAt: performance.now(), events: [] };
    keyboardMidiRecord.setAttribute("aria-pressed", "true");
    keyboardMidiRecord.textContent = "■ Parar MIDI";
    if (keyboardMidiStatus) keyboardMidiStatus.textContent = "A gravar notas do teclado…";
    return;
  }
  const events = keyboardMidiRecording.events;
  keyboardMidiRecording = null;
  keyboardMidiRecord.setAttribute("aria-pressed", "false");
  keyboardMidiRecord.textContent = "● Gravar MIDI";
  if (!events.length) { if (keyboardMidiStatus) keyboardMidiStatus.textContent = "Nenhuma nota gravada."; return; }
  const duration = Math.max(0.25, events.reduce((latest, event) => Math.max(latest, event.time + event.duration), 0));
  const added = await insertInstrumentClip({ name: "Teclado · take MIDI", type: "midi", duration, metadata: { instrument: "piano", events, sequence: "keyboard-recording", quantize: keyboardQuantize?.value || null } });
  if (keyboardMidiStatus) keyboardMidiStatus.textContent = added ? `${events.length} notas inseridas na timeline.` : "Abre uma sessão para inserir o MIDI.";
});
document.addEventListener("keydown", async (event) => {
  if (event.repeat || event.target.matches("input, textarea, select, button")) return;
  const noteName = keyboardPhysicalMap[event.key.toLowerCase()];
  if (noteName) { event.preventDefault(); await previewKeyboardNote(noteName); }
});
playChordButton?.addEventListener("click", async () => {
  try { await playChord(chordSelect?.value || "C"); } catch (error) { showToast(error.message); }
});
addChordTimeline?.addEventListener("click", async () => {
  await insertInstrumentClip({ name: `Piano · ${chordSelect?.value || "C"}`, type: "instrument", metadata: { instrument: "piano", chord: chordSelect?.value || "C" } });
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
    const added = await insertInstrumentClip({ name: `${instrument === "strings" ? "Cordas" : "Synth Pad"} · ${chord}`, type: "instrument", duration: instrument === "strings" ? 1.2 : 0.9, metadata: { instrument, chord } });
    if (added) showToast(`${instrument === "strings" ? "Cordas" : "Synth Pad"} preparado localmente.`);
  } catch (error) { showToast(error.message); }
});
addGuitarTimeline?.addEventListener("click", async () => {
  await insertInstrumentClip({ name: `Guitarra · ${chordSelect?.value || "C"}`, type: "guitar", metadata: { instrument: "guitar", chord: chordSelect?.value || "C" } });
});
function pianoRollEvents() {
  const bpm = Math.max(40, Math.min(240, Number(projectTempo?.value) || 100));
  const stepDuration = 60 / bpm / 2;
  return [...(pianoRoll?.querySelectorAll("[data-piano-note].is-active") || [])].map((button) => ({
    note: button.dataset.pianoNote,
    time: Number(button.dataset.pianoStep || 0) * stepDuration,
    duration: stepDuration * Math.max(0.25, Math.min(2, Number(button.dataset.pianoDuration || 0.9))),
    velocity: Math.max(0.1, Math.min(1, Number(button.dataset.pianoVelocity || 0.82))),
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
async function addPianoRollToTimeline() {
  const events = pianoRollEvents();
  if (!events.length) return showToast("Activa pelo menos um passo no Piano Roll.");
  const duration = Math.max(0.25, events.reduce((latest, event) => Math.max(latest, event.time + event.duration), 0));
  const added = await insertInstrumentClip({ name: "Piano Roll · sequência", type: "instrument", duration, metadata: { instrument: "piano", events, sequence: "piano-roll", bpm: Number(projectTempo?.value) || 100 } });
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
function beatMachineOptions() {
  const swing = Number(beatSwing?.value) || 0;
  const velocity = Number(beatVelocity?.value) || 0.8;
  const loop = Boolean(beatLoop?.checked);
  const loopCount = Math.max(1, Math.min(32, Number(beatLoopCount?.value) || 1));
  if (beatSwingValue) beatSwingValue.textContent = `${swing}%`;
  if (beatVelocityValue) beatVelocityValue.textContent = `${Math.round(velocity * 100)}%`;
  return { kit: beatKit?.value || "Acoustic", swing, velocity, loop, loopCount };
}
[beatSwing, beatVelocity, beatLoop, beatLoopCount].forEach((control) => control?.addEventListener("input", beatMachineOptions));
addBeatTimeline?.addEventListener("click", async () => {
  const preset = getBeatPreset(beatPreset?.value || "Afrobeat");
  const options = beatMachineOptions();
  const sequence = createGridEvents({ channels: preset.channels, bpm: Number(projectTempo?.value) || preset.bpm, ...options });
  await insertInstrumentClip({ name: `Beat · ${preset.name} · ${options.kit}`, type: "drums", duration: sequence.duration, metadata: { instrument: "drums", preset: preset.name, bpm: preset.bpm, channels: preset.channels, ...options, events: sequence.events } });
});
playBeatSequence?.addEventListener("click", async () => {
  const preset = getBeatPreset(beatPreset?.value || "Afrobeat");
  const channels = Object.fromEntries(["kick", "snare", "clap", "hihat", "percussion", "bass"].map((channel) => [
    channel,
    [...(beatGrid?.querySelectorAll(`[data-beat-channel="${channel}"].is-active`) || [])].map((button) => Number(button.dataset.beatStep)),
  ]));
  const sequence = createGridEvents({ channels, bpm: Number(projectTempo?.value) || preset.bpm, ...beatMachineOptions() });
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
  try { await playDrumHit(channel, { velocity: (Number(beatVelocity?.value) || 0.8) * (channel === "hihat" ? 0.9 : 1) }); } catch (error) { showToast(error.message); }
});
const pianoEditableNotes = ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5"];
pianoRoll?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-piano-note]");
  if (!button) return;
  if (event.altKey) {
    button.dataset.pianoVelocity = (Math.min(1, Number(button.dataset.pianoVelocity || 0.82) + 0.1)).toFixed(2);
    button.title = `${button.dataset.pianoNote} · velocity ${button.dataset.pianoVelocity}`;
  } else if (event.shiftKey) {
    button.dataset.pianoDuration = (Math.min(2, Number(button.dataset.pianoDuration || 0.9) + 0.25)).toFixed(2);
    button.title = `${button.dataset.pianoNote} · duração ${button.dataset.pianoDuration}`;
  } else {
    button.classList.toggle("is-active");
  }
  flashControl(button);
  savePianoRollEdits();
  if (pianoRollStatus) pianoRollStatus.textContent = `${pianoRollEvents().length} passos activos · ${button.dataset.pianoNote} · velocity ${button.dataset.pianoVelocity} · duração ${button.dataset.pianoDuration}`;
  try { await playNote(button.dataset.pianoNote, { type: "triangle", duration: 0.28, volume: Number(button.dataset.pianoVelocity) * 0.14 }); } catch (error) { showToast(error.message); }
});
pianoRoll?.addEventListener("dblclick", (event) => {
  const button = event.target.closest("[data-piano-note]");
  if (!button) return;
  const current = pianoEditableNotes.indexOf(button.dataset.pianoNote);
  button.dataset.pianoNote = pianoEditableNotes[(current + 1) % pianoEditableNotes.length];
  button.textContent = button.dataset.pianoNote.replace(/[0-9]/g, "");
  button.title = `${button.dataset.pianoNote} · duplo clique para mudar altura`;
  savePianoRollEdits();
  if (pianoRollStatus) pianoRollStatus.textContent = `Nota editada: ${button.dataset.pianoNote}.`;
});
playPianoSequence?.addEventListener("click", previewPianoRollSequence);
addPianoTimeline?.addEventListener("click", addPianoRollToTimeline);
soundLibraryGrid?.addEventListener("click", async (event) => {
  const favorite = event.target.closest("[data-sound-favorite]");
  if (favorite) { toggleSoundLibraryFavorite(favorite.dataset.soundFavorite); return; }
  const preview = event.target.closest("[data-sound-preview]");
  const add = event.target.closest("[data-sound-add]");
  if (!preview && !add) return;
  const item = getSoundLibraryItem((preview || add).dataset.soundPreview || (preview || add).dataset.soundAdd);
  if (preview) await previewSoundLibraryItem(item);
  else await addSoundLibraryItem(item);
});
function syncSoundLibraryFilters() {
  soundLibraryFilters = { query: soundLibraryQuery?.value || "", category: soundLibraryCategory?.value || "", genre: soundLibraryGenre?.value || "", mood: soundLibraryMood?.value || "", favoritesOnly: Boolean(soundLibraryFavoritesOnly?.getAttribute("aria-pressed") === "true") };
  renderSoundLibrary();
}
[soundLibraryQuery, soundLibraryCategory, soundLibraryGenre, soundLibraryMood].forEach((control) => control?.addEventListener("input", syncSoundLibraryFilters));
[soundLibraryCategory, soundLibraryGenre, soundLibraryMood].forEach((control) => control?.addEventListener("change", syncSoundLibraryFilters));
soundLibraryFavoritesOnly?.addEventListener("click", () => { soundLibraryFavoritesOnly.setAttribute("aria-pressed", String(soundLibraryFavoritesOnly.getAttribute("aria-pressed") !== "true")); syncSoundLibraryFilters(); });
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
timelineGrid?.addEventListener("drop", async (event) => {
  event.preventDefault();
  timelineGrid.classList.remove("is-drop-target");
  const id = event.dataTransfer?.getData("text/fernando-lucoco-sound");
  const item = getSoundLibraryItem(id);
  if (!item || !timelineGrid) return;
  const rect = timelineGrid.getBoundingClientRect();
  const start = Math.max(0, Math.min(39, ((event.clientX - rect.left) / Math.max(1, rect.width)) * 40));
  await addSoundLibraryItem(item, start);
});
playPatternButton?.addEventListener("click", async () => {
  try {
    await ensureAudioContextRunning();
    const result = await playPattern(patternSelect?.value || "Afrobeat", { bpm: Number(projectTempo?.value) || 100 });
    showToast(`${patternSelect?.value || "Groove"}: ${result.steps} eventos locais agendados · áudio activo.`);
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Não foi possível tocar o groove.");
  }
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

bindProducerActionButtons();
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

// Timeline track header controls share the same project state as the Mixer.
timelineGrid?.addEventListener("click", (event) => {
  const control = event.target.closest("[data-timeline-field]");
  if (!control || !timelineHistory) return;
  event.preventDefault();
  event.stopPropagation();
  const trackId = control.dataset.trackId;
  const field = control.dataset.timelineField;
  if (!trackId || !["muted", "solo", "recordArmed"].includes(field)) return;
  const track = timelineHistory.present.tracks.find((item) => item.id === trackId);
  if (!track) return;
  selectedMixerTrackId = trackId;
  commitTimelineProject(updateTrack(timelineHistory.present, trackId, { [field]: !track[field] }));
});


// Control Room: proxies para os controlos reais da sessão, sem duplicar o motor de áudio.
document.querySelectorAll("[data-proxy-click]").forEach((proxy) => {
  proxy.addEventListener("click", () => {
    const targetId = proxy.getAttribute("data-proxy-click");
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) {
      const state = document.getElementById("control-room-save-state");
      if (state) state.textContent = "Controlo indisponível";
      return;
    }
    target.click();
    proxy.classList.add("is-fired");
    window.setTimeout(() => proxy.classList.remove("is-fired"), 180);
  });
});

const controlRoomClock = document.getElementById("control-room-clock");
if (controlRoomClock && transportClock) {
  const syncControlRoomClock = () => {
    controlRoomClock.textContent = transportClock.textContent || "00:00.000";
  };
  syncControlRoomClock();
  window.setInterval(syncControlRoomClock, 120);
}
