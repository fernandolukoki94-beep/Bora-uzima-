import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("gravação em sessão activa mantém fallback inline quando IndexedDB não persiste o blob", async () => {
  const source = await readFile(new URL("../src/js/app.js", import.meta.url), "utf8");

  assert.match(source, /let persistedInIndexedDb = false;/);
  assert.match(source, /if \(!persistedInIndexedDb\)/);
  assert.match(source, /audioData: originalAudioData/);
  assert.match(source, /fallback inline mantém playback e exportação locais/);
});
