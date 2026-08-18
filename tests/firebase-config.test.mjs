import test from "node:test";
import assert from "node:assert/strict";
import { firebaseConfig, isFirebaseConfigComplete } from "../src/js/firebase-config.js";

test("Firebase Web config identifica a aplicação sem credenciais administrativas", () => {
  assert.equal(isFirebaseConfigComplete(), true);
  assert.equal(firebaseConfig.projectId, "fernando-lucoco-music");
  assert.equal("privateKey" in firebaseConfig, false);
  assert.equal("clientEmail" in firebaseConfig, false);
});
