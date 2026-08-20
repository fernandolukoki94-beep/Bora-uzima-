import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { filterMySounds, normalizeMySoundMetadata, validateMySoundFile } from "../src/js/studio/my-sounds.js";

test("My Sounds valida ficheiro áudio e limite de tamanho", () => {
  assert.equal(validateMySoundFile({ type: "audio/wav", size: 1024 }).ok, true);
  assert.equal(validateMySoundFile({ type: "image/png", size: 1024 }).ok, false);
  assert.equal(validateMySoundFile({ type: "audio/wav", size: 81 * 1024 * 1024 }).ok, false);
});

test("My Sounds normaliza pastas e tags sem duplicados", () => {
  const item = normalizeMySoundMetadata({ name: "  Beat  ", folder: " Beats ", tags: "Afrobeat, warm, afrobeat" });
  assert.equal(item.name, "Beat");
  assert.equal(item.folder, "Beats");
  assert.deepEqual(item.tags, ["afrobeat", "warm"]);
});

test("My Sounds liga o blob privado real à timeline e ao mixdown", () => {
  const appSource = fs.readFileSync(new URL("../src/js/app.js", import.meta.url), "utf8");
  assert.match(appSource, /const blob = await getMySoundBlob\(id\)/);
  assert.match(appSource, /blobKey: `my-sound:\$\{id\}`/);
  assert.match(appSource, /clip\.metadata\?\.origin === "my-sounds"/);
  assert.match(appSource, /blob = await getMySoundBlob\(clip\.metadata\.mySoundId\)/);
});

test("My Sounds filtra por pesquisa, pasta e favoritos", () => {
  const items = [
    { id: "a", name: "Afro vocal", folder: "Vocals", tags: ["warm"], favorite: true },
    { id: "b", name: "Amapiano loop", folder: "Loops", tags: ["dance"], favorite: false },
  ];
  assert.deepEqual(filterMySounds(items, { query: "warm" }).map((item) => item.id), ["a"]);
  assert.deepEqual(filterMySounds(items, { folder: "Loops" }).map((item) => item.id), ["b"]);
  assert.deepEqual(filterMySounds(items, { favoritesOnly: true }).map((item) => item.id), ["a"]);
});

test("My Sounds expõe edição persistente de metadados sem substituir o blob", () => {
  const appSource = fs.readFileSync(new URL("../src/js/app.js", import.meta.url), "utf8");
  assert.match(appSource, /data-my-sound-edit/);
  assert.match(appSource, /async function editMySoundMetadata\(id\)/);
  assert.match(appSource, /await updateMySound\(id, \{ name, folder, tags \}\)/);
});
