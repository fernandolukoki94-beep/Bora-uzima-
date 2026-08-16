import test from "node:test";
import assert from "node:assert/strict";
import { MAX_BEAT_BYTES, createImportedBeat, validateBeatFile } from "../src/js/beat-import.js";

test("beat import aceita áudio válido e cria metadados locais", () => {
  const file = new Blob(["RIFF"], { type: "audio/wav" });
  Object.defineProperty(file, "name", { value: "afrobeat.wav" });
  const beat = createImportedBeat(file, "blob:test");
  assert.equal(beat.name, "afrobeat.wav");
  assert.equal(beat.type, "audio/wav");
  assert.equal(beat.source, "device");
  assert.equal(beat.url, "blob:test");
});

test("beat import aceita extensão quando o browser omite o MIME", () => {
  const file = { name: "beat.mp3", type: "", size: 128 };
  assert.equal(validateBeatFile(file), true);
});

test("beat import rejeita formato desconhecido", () => {
  assert.throws(() => validateBeatFile({ name: "notes.txt", type: "text/plain", size: 10 }), /Formato não suportado/);
});

test("beat import rejeita ficheiro acima do limite local", () => {
  assert.throws(() => validateBeatFile({ name: "big.wav", type: "audio/wav", size: MAX_BEAT_BYTES + 1 }), /80 MB/);
});
