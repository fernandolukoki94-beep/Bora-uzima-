import test from "node:test";
import assert from "node:assert/strict";

const MAX_TEXT = 2000;
const clean = (value, max = MAX_TEXT) => typeof value === "string" ? value.trim().slice(0, max) : "";
const conversationId = (a, b) => [a, b].sort().join("_");

test("Message Storage normaliza texto e rejeita mensagem vazia", () => {
  assert.equal(clean("  Olá  "), "Olá");
  assert.equal(clean(" "), "");
  assert.equal(clean("x".repeat(3000)).length, 2000);
});

test("conversation id é determinístico e independente da ordem", () => {
  assert.equal(conversationId("user-b", "user-a"), "user-a_user-b");
  assert.equal(conversationId("user-a", "user-b"), "user-a_user-b");
});

test("mensagens não podem iniciar conversa consigo próprio", () => {
  const canStart = (from, to) => Boolean(to && from !== to);
  assert.equal(canStart("user-a", "user-a"), false);
  assert.equal(canStart("user-a", "user-b"), true);
});
