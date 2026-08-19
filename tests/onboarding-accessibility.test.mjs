import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/js/onboarding.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("onboarding mantém foco previsível, escape e restauração do foco", () => {
  assert.match(source, /previousFocus/);
  assert.match(source, /focusStep/);
  assert.match(source, /target\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /previousFocus\?\.isConnected/);
});

test("onboarding expõe resumo de erro acessível e campos obrigatórios", () => {
  assert.match(html, /id="onboarding-summary"/);
  assert.match(source, /summary\.setAttribute\("role", "alert"\)/);
  assert.match(source, /Preenche nome, username e nome artístico/);
  assert.match(source, /firstInvalid/);
});
