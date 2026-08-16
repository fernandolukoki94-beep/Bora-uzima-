import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import {
  INDEXED_DB_SCHEMA,
  STORAGE_POLICY,
  clearIndexedDb,
  deleteProjectData,
  getAudioBlob,
  getBeatBlob,
  getMetadata,
  getProject,
  getTake,
  getStorageHealth,
  indexedDbAvailable,
  migrateLocalStorageProjects,
  putAudioBlob,
  putBeatBlob,
  putEffect,
  putProject,
  putTake,
  resetProjectEffects,
} from "../src/js/indexeddb-storage.js";

const storage = new Map();
globalThis.window = { indexedDB };
globalThis.indexedDB = indexedDB;
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { storage: { estimate: async () => ({ usage: 1024, quota: 1024 * 1024 }) } },
});

test.beforeEach(async () => {
  storage.clear();
  await clearIndexedDb().catch(() => {});
});

test.after(async () => {
  await clearIndexedDb().catch(() => {});
});

test("diagnostica armazenamento dual e quota disponível", async () => {
  const health = await getStorageHealth();
  assert.equal(health.mode, "dual-write");
  assert.equal(health.localStorageWritable, true);
  assert.equal(health.indexedDbAvailable, true);
  assert.equal(health.quotaRemaining, 1024 * 1024 - 1024);
  assert.equal(health.privateMode, "unknown");
});

test("cria o schema IndexedDB v2 e confirma disponibilidade", async () => {
  assert.equal(STORAGE_POLICY.status, "internal-beta");
  assert.equal(STORAGE_POLICY.primaryRead, "localStorage");
  assert.equal(STORAGE_POLICY.dualWrite, true);
  assert.deepEqual(INDEXED_DB_SCHEMA.stores, ["projects", "takes", "blobs", "metadata", "effects", "beats"]);
  assert.equal(INDEXED_DB_SCHEMA.dedicatedBeatStore, "beats");
  assert.equal(await indexedDbAvailable(), true);
});

test("persiste projecto, take, blob original/processado e histórico de efeito", async () => {
  const project = { id: "project-1", name: "Refrão", storageVersion: "indexeddb-v2" };
  const original = new Blob(["original"], { type: "audio/webm" });
  const processed = new Blob(["processed"], { type: "audio/wav" });
  await putProject(project);
  await putTake({ id: project.id, projectId: project.id, originalAudioData: true, processedAudioData: true });
  await putAudioBlob(project.id, "original", original);
  await putAudioBlob(project.id, "processed", processed);
  await putEffect({ id: "project-1:gain", projectId: project.id, type: "gain", parameters: { decibels: 3 } });

  const persistedProject = await getProject(project.id);
  assert.equal(persistedProject.id, project.id);
  assert.equal(persistedProject.name, project.name);
  assert.equal(persistedProject.storageVersion, project.storageVersion);
  assert.equal(persistedProject.schemaVersion, 3);
  assert.equal(persistedProject.tempo, 100);
  assert.equal(persistedProject.key, "C");
  assert.equal(persistedProject.tracks.length, 1);
  assert.equal((await getTake(project.id)).processedAudioData, true);
  assert.equal(await (await getAudioBlob(project.id, "original")).text(), "original");
  assert.equal(await (await getAudioBlob(project.id, "processed")).text(), "processed");
});

test("persiste beat numa store dedicada sem o converter em data URL", async () => {
  const beat = new Blob(["beat-audio"], { type: "audio/wav" });
  await putBeatBlob("beat-project", "beat-1", beat, { name: "instrumental.wav" });
  const record = await getBeatBlob("beat-project", "beat-1");
  assert.equal(await record.blob.text(), "beat-audio");
  assert.equal(record.name, "instrumental.wav");
  assert.equal(record.bytes, beat.size);
  assert.equal(record.mimeType, "audio/wav");
});

test("persiste variantes vocais nomeadas sem confundir a origem", async () => {
  const project = { id: "variants-1", name: "Pipeline reversível", audioVariants: { enhanced: { mimeType: "audio/wav", bytes: 8 } } };
  await putProject(project);
  await putAudioBlob(project.id, "original", new Blob(["original"], { type: "audio/webm" }));
  await putAudioBlob(project.id, "enhanced", new Blob(["enhanced"], { type: "audio/wav" }));
  await putAudioBlob(project.id, "pitch-corrected", new Blob(["pitch"], { type: "audio/wav" }));
  await putAudioBlob(project.id, "mixed", new Blob(["mixed"], { type: "audio/wav" }));

  assert.equal(await (await getAudioBlob(project.id, "original")).text(), "original");
  assert.equal(await (await getAudioBlob(project.id, "enhanced")).text(), "enhanced");
  assert.equal(await (await getAudioBlob(project.id, "pitch-corrected")).text(), "pitch");
  assert.equal(await (await getAudioBlob(project.id, "mixed")).text(), "mixed");
  assert.deepEqual((await getProject(project.id)).audioVariants, project.audioVariants);
});

test("reset de efeitos remove variantes processadas e preserva o projecto base", async () => {
  const project = { id: "reset-variants", name: "Reset seguro", originalAudioData: "data:audio/webm;base64,b3JpZ2luYWw=" };
  await putProject(project);
  await putTake({ id: project.id, projectId: project.id, originalAudioData: true });
  for (const kind of ["original", "enhanced", "pitch-corrected", "mixed"]) await putAudioBlob(project.id, kind, new Blob([kind]));
  await putEffect({ id: `${project.id}:enhanced`, projectId: project.id, type: "enhancement" });
  await resetProjectEffects(project.id);

  assert.equal(await (await getAudioBlob(project.id, "original")).text(), "original");
  assert.equal(await getAudioBlob(project.id, "enhanced"), null);
  assert.equal(await getAudioBlob(project.id, "pitch-corrected"), null);
  assert.equal(await getAudioBlob(project.id, "mixed"), null);
  const reset = await getProject(project.id);
  assert.deepEqual(reset.audioVariants, {});
  assert.equal(reset.originalAudioData, project.originalAudioData);
});

test("migra localStorage para IndexedDB sem apagar os dados de origem", async () => {
  const project = {
    id: "legacy-1",
    name: "Take antiga",
    originalAudioData: "data:audio/webm;base64,b3JpZ2luYWw=",
    processedAudioData: "data:audio/wav;base64,cHJvY2Vzc2Vk",
  };
  localStorage.setItem("fernando-lucoco-music-projects", JSON.stringify([project]));

  const result = await migrateLocalStorageProjects();
  assert.deepEqual(result, { migrated: true, reason: "completed", count: 1, failed: 0 });
  assert.deepEqual(JSON.parse(localStorage.getItem("fernando-lucoco-music-projects")), [project]);
  assert.equal((await getProject(project.id)).storageVersion, "indexeddb-v2");
  assert.equal(await (await getAudioBlob(project.id, "original")).text(), "original");
  assert.equal(await (await getAudioBlob(project.id, "processed")).text(), "processed");
  assert.equal((await getMetadata("lastMigration")).count, 1);
});

test("migração inválida não apaga localStorage e relata falha controlada", async () => {
  const project = { name: "Sem ID", originalAudioData: "data:audio/webm;base64,b3JpZ2luYWw=" };
  const raw = JSON.stringify([project]);
  localStorage.setItem("fernando-lucoco-music-projects", raw);

  const result = await migrateLocalStorageProjects();
  assert.equal(result.migrated, false);
  assert.equal(result.failed, 1);
  assert.equal(localStorage.getItem("fernando-lucoco-music-projects"), raw);
});

test("fallback é diagnosticado quando localStorage fica bloqueado", async () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => { throw new Error("QuotaExceededError"); },
    removeItem: () => {},
  };
  const health = await getStorageHealth();
  assert.equal(health.localStorageWritable, false);
  assert.equal(health.mode, "unavailable");
  globalThis.localStorage = original;
});

test("remove projecto elimina blobs, take e projecto IndexedDB", async () => {
  await putProject({ id: "delete-me", name: "Apagar" });
  await putTake({ id: "delete-me", projectId: "delete-me" });
  await putAudioBlob("delete-me", "original", new Blob(["audio"]));
  await putAudioBlob("delete-me", "enhanced", new Blob(["enhanced"]));
  await putAudioBlob("delete-me", "pitch-corrected", new Blob(["pitch"]));
  await putAudioBlob("delete-me", "mixed", new Blob(["mixed"]));
  await putBeatBlob("delete-me", "beat-1", new Blob(["beat"]), { name: "beat.wav" });
  await deleteProjectData("delete-me");
  assert.equal(await getProject("delete-me"), undefined);
  assert.equal(await getTake("delete-me"), undefined);
  assert.equal(await getAudioBlob("delete-me", "original"), null);
  assert.equal(await getAudioBlob("delete-me", "enhanced"), null);
  assert.equal(await getAudioBlob("delete-me", "pitch-corrected"), null);
  assert.equal(await getAudioBlob("delete-me", "mixed"), null);
  assert.equal(await getBeatBlob("delete-me", "beat-1"), null);
});
