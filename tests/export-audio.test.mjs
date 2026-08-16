import test from "node:test";
import assert from "node:assert/strict";
import { downloadBlob, mixedExportFilename } from "../src/js/export-audio.js";

test("mixedExportFilename cria um nome WAV seguro e legível", () => {
  assert.equal(mixedExportFilename("Fernando / Take 01"), "Fernando - Take 01-mixed.wav");
  assert.equal(mixedExportFilename(""), "sessao-mixed.wav");
});

test("downloadBlob cria, activa e revoga o link de exportação", () => {
  const calls = [];
  const link = {
    style: {},
    click() { calls.push("click"); },
    remove() { calls.push("remove"); },
  };
  const documentRef = {
    body: { appendChild(node) { calls.push(["append", node]); } },
    createElement(tag) { calls.push(["create", tag]); return link; },
  };
  const urlApi = {
    createObjectURL(blob) { calls.push(["create-url", blob]); return "blob:test-mixed"; },
    revokeObjectURL(url) { calls.push(["revoke-url", url]); },
  };
  const previousTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (callback) => { callback(); return 0; };
  try {
    const blob = new Blob(["RIFF"], { type: "audio/wav" });
    const objectUrl = downloadBlob(blob, "take-mixed.wav", { documentRef, urlApi });
    assert.equal(objectUrl, "blob:test-mixed");
    assert.equal(link.href, "blob:test-mixed");
    assert.equal(link.download, "take-mixed.wav");
    assert.deepEqual(calls.map((entry) => Array.isArray(entry) ? entry[0] : entry), ["create-url", "create", "append", "click", "remove", "revoke-url"]);
  } finally {
    globalThis.setTimeout = previousTimeout;
  }
});
