import test from "node:test";
import assert from "node:assert/strict";

import { dataUrlToBlob } from "../src/js/storage.js";

test("dataUrlToBlob converte uma Data URL base64 em Blob com MIME preservado", async () => {
  const blob = await dataUrlToBlob("data:audio/wav;base64,AAAA");
  assert.equal(blob.type, "audio/wav");
  assert.equal(blob.size, 3);
});

test("dataUrlToBlob aceita MIME de MediaRecorder com parâmetro de codec", async () => {
  const blob = await dataUrlToBlob("data:audio/webm;codecs=opus;base64,AAAA");
  assert.equal(blob.type, "audio/webm");
  assert.equal(blob.size, 3);
});

test("dataUrlToBlob rejeita uma origem persistida inválida", async () => {
  await assert.rejects(() => dataUrlToBlob("audio-not-a-data-url"), /Data URL de áudio inválido/);
});

test("dataUrlToBlob aceita Blob directamente para não duplicar dados", async () => {
  const source = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
  assert.strictEqual(await dataUrlToBlob(source), source);
});
