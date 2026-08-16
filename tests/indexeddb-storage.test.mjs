import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import {
  INDEXED_DB_SCHEMA,
  clearIndexedDb,
  deleteProjectData,
  getAudioBlob,
  getMetadata,
  getProject,
  getTake,
  indexedDbAvailable,
  migrateLocalStorageProjects,
  putAudioBlob,
  putEffect,
  putProject,
  putTake,
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

test("cria o schema IndexedDB v2 e confirma disponibilidade", async () => {
  assert.deepEqual(INDEXED_DB_SCHEMA.stores, ["projects", "takes", "blobs", "metadata", "effects"]);
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

  assert.deepEqual(await getProject(project.id), project);
  assert.equal((await getTake(project.id)).processedAudioData, true);
  assert.equal(await (await getAudioBlob(project.id, "original")).text(), "original");
  assert.equal(await (await getAudioBlob(project.id, "processed")).text(), "processed");
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

test("remover projecto elimina blobs, take e projecto IndexedDB", async () => {
  await putProject({ id: "delete-me", name: "Apagar" });
  await putTake({ id: "delete-me", projectId: "delete-me" });
  await putAudioBlob("delete-me", "original", new Blob(["audio"]));
  await deleteProjectData("delete-me");
  assert.equal(await getProject("delete-me"), undefined);
  assert.equal(await getTake("delete-me"), undefined);
  assert.equal(await getAudioBlob("delete-me", "original"), null);
});
