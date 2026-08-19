import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/js/firebase-media.js", import.meta.url), "utf8");

test("Firebase media contract allows audio, video and image paths", () => {
  assert.match(source, /audio\//);
  assert.match(source, /video\//);
  assert.match(source, /image\//);
  assert.match(source, /users\/\$\{user\.uid\}\/media/);
});

test("Firebase media contract enforces the 80 MB upload ceiling", () => {
  assert.match(source, /80 \* 1024 \* 1024/);
  assert.match(source, /excede o limite/);
});

test("Firebase media contract persists Storage URL and Firestore metadata", () => {
  assert.match(source, /uploadBytes\(objectRef, file/);
  assert.match(source, /getDownloadURL\(objectRef\)/);
  assert.match(source, /collection\(db, "users", user\.uid, "media"\)/);
  assert.match(source, /storagePath: objectRef\.fullPath/);
});
