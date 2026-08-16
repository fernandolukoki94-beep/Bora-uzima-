import { getBeatPreset } from "./studio/instruments.js";

const GENRE_PRESETS = {
  Afrobeat: { beat: "Afrobeat", instruments: ["drums", "bass", "guitar", "piano"] },
  Amapiano: { beat: "Amapiano", instruments: ["drums", "bass", "piano", "synth"] },
  "Afro House": { beat: "Afro House", instruments: ["drums", "bass", "synth"] },
  "R&B": { beat: "Afrobeat", instruments: ["drums", "bass", "piano", "strings"] },
  "Hip-Hop": { beat: "Kuduro", instruments: ["drums", "bass", "piano"] },
  Gospel: { beat: "Rumba", instruments: ["drums", "piano", "strings"] },
  Soukous: { beat: "Afrobeat", instruments: ["drums", "bass", "guitar"] },
  Ndombolo: { beat: "Kuduro", instruments: ["drums", "bass", "guitar"] },
  Dancehall: { beat: "Afrobeat", instruments: ["drums", "bass", "synth"] },
};

const ALL_PRODUCER_INSTRUMENTS = Object.freeze(["drums", "bass", "piano", "guitar", "strings", "synth"]);

const VOCAL_CHAIN = Object.freeze({
  noiseReduction: true,
  eq: "warm",
  compression: "medium",
  reverb: "small_room",
});

function safeTempo(value) {
  return Math.max(60, Math.min(180, Math.round(Number(value) || 100)));
}

function structureForDuration(seconds) {
  const duration = Math.max(0, Number(seconds) || 0);
  if (duration <= 45) return ["intro", "verse", "chorus", "outro"];
  return ["intro", "verse", "chorus", "verse", "chorus", "outro"];
}

function linearFromDb(db) {
  return 10 ** (Number(db) / 20);
}

const BRIEF_GENRE_HINTS = [
  ["afrobeat", "Afrobeat"],
  ["afro house", "Afro House"],
  ["amapiano", "Amapiano"],
  ["r&b", "R&B"],
  ["rnb", "R&B"],
  ["hip hop", "Hip-Hop"],
  ["hip-hop", "Hip-Hop"],
  ["gospel", "Gospel"],
  ["soukous", "Soukous"],
  ["ndombolo", "Ndombolo"],
  ["dancehall", "Dancehall"],
];

export function interpretProductionBrief(brief = "", fallbackGenre = "Afrobeat") {
  const text = String(brief || "").trim().toLowerCase();
  const genre = BRIEF_GENRE_HINTS.find(([hint]) => text.includes(hint))?.[1] || fallbackGenre;
  const requestedInstruments = [
    ["piano", "piano"], ["teclado", "piano"], ["guitarra", "guitar"],
    ["violão", "guitar"], ["cordas", "strings"], ["strings", "strings"],
    ["synth", "synth"], ["pad", "synth"], ["bass", "bass"], ["baixo", "bass"],
  ].filter(([hint]) => text.includes(hint)).map(([, value]) => value);
  const requestedProcessing = {
    pitchCorrection: /auto.?tune|afinação|afinacao|pitch/.test(text),
    vocalEnhancement: /melhorar voz|voz melhor|vocal|clareza|brilho/.test(text),
    mastering: /master|masterização|masterizacao|finalizar/.test(text),
  };
  const energy = /forte|energético|energetico|dançante|dancante|agressivo/.test(text) ? "high" : /calmo|suave|íntimo|intimo/.test(text) ? "low" : "medium";
  return { text: String(brief || "").trim(), genre, requestedInstruments: [...new Set(requestedInstruments)], requestedProcessing, energy };
}

export function buildProducerPlan({ genre = "Afrobeat", tempo = 100, key = "C", duration = 60, brief = "", analysis = null, preferAnalysis = false } = {}) {
  const interpretation = interpretProductionBrief(brief, genre);
  const selectedGenre = interpretation.genre;
  const profile = GENRE_PRESETS[selectedGenre] || GENRE_PRESETS.Afrobeat;
  const beat = getBeatPreset(profile.beat);
  const analyzedBpm = preferAnalysis && analysis?.hasAudio && analysis?.bpmConfidence >= 0.2 ? analysis.bpm : tempo;
  const analyzedKey = preferAnalysis && analysis?.hasAudio && analysis?.keyConfidence >= 0.2 ? analysis.key : key;
  const bpm = safeTempo(analyzedBpm || beat.bpm);
  return {
    version: "producer-plan-v1",
    genre: GENRE_PRESETS[selectedGenre] ? selectedGenre : "Afrobeat",
    brief: interpretation.text,
    briefInterpretation: interpretation,
    bpm,
    key: analyzedKey || "C",
    analysis: analysis ? { ...analysis } : null,
    structure: structureForDuration(duration),
    // V2 file requirement: every local voice-production plan must materialise the complete
    // starter palette in the timeline. Genre presets still determine the beat and defaults,
    // while the six local instruments remain available for the user to edit or remove.
    instruments: [...ALL_PRODUCER_INSTRUMENTS],
    beat: {
      preset: beat.name,
      bpm: beat.bpm,
      channels: beat.channels,
    },
    vocal: { ...VOCAL_CHAIN },
    mix: {
      vocalPriority: "high",
      bassDb: -2,
      instrumentalDb: -4,
      masterHeadroomDb: -1,
    },
    execution: {
      localOnly: true,
      originalPreserved: true,
      generatedAt: new Date().toISOString(),
    },
  };
}

export function producerPlanClipSpecs(plan, duration = 8) {
  const safeDuration = Math.max(1, Math.min(32, Number(duration) || 8));
  const specs = [];
  const has = (name) => plan.instruments.includes(name);
  if (has("drums")) specs.push({ name: `Beat · ${plan.beat.preset}`, type: "drums", duration: safeDuration, metadata: { instrument: "drums", preset: plan.beat.preset, bpm: plan.beat.bpm, channels: plan.beat.channels, producerPlan: true } });
  if (has("bass")) specs.push({ name: "Bass · Producer Plan", type: "instrument", duration: safeDuration, metadata: { instrument: "bass", note: "A2", producerPlan: true } });
  if (has("piano")) specs.push({ name: `Piano · ${plan.key}`, type: "instrument", duration: safeDuration, metadata: { instrument: "piano", chord: "C", producerPlan: true } });
  if (has("guitar")) specs.push({ name: `Guitarra · ${plan.key}`, type: "guitar", duration: safeDuration, metadata: { instrument: "guitar", chord: "C", producerPlan: true } });
  if (has("strings")) specs.push({ name: `Cordas · ${plan.key}`, type: "instrument", duration: safeDuration, metadata: { instrument: "strings", chord: "C", producerPlan: true } });
  if (has("synth")) specs.push({ name: `Synth Pad · ${plan.key}`, type: "instrument", duration: safeDuration, metadata: { instrument: "synth", chord: "C", producerPlan: true } });
  return specs;
}

export function applyProducerMix(project, plan) {
  const normalized = { ...project, tempo: plan.bpm, key: plan.key, producerPlan: plan };
  return {
    ...normalized,
    tracks: (normalized.tracks || []).map((track) => {
      if (track.type === "audio") return { ...track, volume: 1 };
      if (track.type === "drums" || track.type === "guitar" || track.type === "instrument") {
        return { ...track, volume: linearFromDb(plan.mix.instrumentalDb) };
      }
      return track;
    }),
    updatedAt: new Date().toISOString(),
  };
}

export const PRODUCER_GENRES = Object.freeze(Object.keys(GENRE_PRESETS));
