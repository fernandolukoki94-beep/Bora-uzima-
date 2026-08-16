import test from "node:test";
import assert from "node:assert/strict";
import { BEAT_PRESETS, CHORDS, DRUM_PATTERNS, createNote, createPatternSequence, getBeatPreset, midiToFrequency, noteToFrequency, quantizeNote } from "../src/js/studio/instruments.js";

test("calcula frequências de notas e acordes base", () => {
  assert.ok(Math.abs(noteToFrequency("A4") - 440) < 0.00001);
  assert.ok(Math.abs(midiToFrequency(60) - 261.625565) < 0.001);
  assert.deepEqual(CHORDS.C, ["C4", "E4", "G4"]);
});

test("cria nota com limites de MIDI e velocity", () => {
  const note = createNote({ pitch: 200, start: -2, duration: 0, velocity: 2 });
  assert.equal(note.pitch, 127);
  assert.equal(note.start, 0);
  assert.equal(note.duration, 0.25);
  assert.equal(note.velocity, 1);
});

test("quantiza notas numa grelha temporal", () => {
  assert.equal(quantizeNote({ pitch: 60, start: 0.37, duration: 1, velocity: 0.8 }, 0.25).start, 0.25);
});

test("disponibiliza padrões de bateria para os cinco estilos", () => {
  for (const name of ["Afrobeat", "Amapiano", "Kuduro", "Afro House", "Rumba"]) {
    assert.equal(DRUM_PATTERNS[name].steps, 16);
    assert.ok(createPatternSequence(name, 2).length > 0);
  }
});

test("gera presets reproduzíveis com BPM e canais independentes", () => {
  for (const name of Object.keys(BEAT_PRESETS)) {
    const preset = getBeatPreset(name);
    assert.ok(preset.bpm >= 40 && preset.bpm <= 240);
    assert.equal(preset.steps, 16);
    assert.deepEqual(Object.keys(preset.channels), ["kick", "snare", "clap", "hihat", "percussion", "bass"]);
  }
  const first = getBeatPreset("Afrobeat");
  const second = getBeatPreset("Afrobeat");
  first.channels.kick.push(15);
  assert.notDeepEqual(first.channels.kick, second.channels.kick);
});
