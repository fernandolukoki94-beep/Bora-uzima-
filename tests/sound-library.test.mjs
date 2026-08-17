import test from "node:test";
import assert from "node:assert/strict";
import { SOUND_LIBRARY, getSoundLibraryItem, soundLibraryClip } from "../src/js/studio/sound-library.js";

test("Sound Library expõe catálogo local com ids únicos", () => {
  assert.ok(SOUND_LIBRARY.length >= 6);
  assert.equal(new Set(SOUND_LIBRARY.map((item) => item.id)).size, SOUND_LIBRARY.length);
  assert.ok(SOUND_LIBRARY.every((item) => item.metadata.origin === "sound-library"));
});

test("Sound Library cria clip de evento numa posição não negativa", () => {
  const item = getSoundLibraryItem("drums-afrobeat");
  const clip = soundLibraryClip(item, -3);
  assert.deepEqual({ name: clip.name, start: clip.start, duration: clip.duration, mimeType: clip.mimeType }, { name: "Drums · Afrobeat", start: 0, duration: 4, mimeType: "application/x-fernando-lucoco-event" });
  assert.deepEqual(clip.event, { instrument: "drums", pattern: "Afrobeat", origin: "sound-library", soundId: "drums-afrobeat" });
});

test("Sound Library devolve null para sons desconhecidos", () => {
  assert.equal(getSoundLibraryItem("missing-sound"), null);
  assert.equal(soundLibraryClip(null), null);
});
