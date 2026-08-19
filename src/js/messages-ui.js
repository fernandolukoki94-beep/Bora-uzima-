import { auth } from "./firebase-client.js";
import { listMyConversations, listConversationMessages, sendPrivateMessage } from "./firebase-messages.js";

const conversationsEl = document.getElementById("messages-conversations");
const itemsEl = document.getElementById("messages-items");
const titleEl = document.getElementById("messages-thread-title");
const statusEl = document.getElementById("messages-status");
const form = document.getElementById("messages-form");
const input = document.getElementById("messages-input");
const submit = form?.querySelector("button");
let conversations = [];
let activeConversation = "";

function setStatus(text, tone = "") { if (statusEl) { statusEl.textContent = text; statusEl.dataset.tone = tone; } }
function otherProfile(item) {
  const otherId = (item.participantIds || []).find((id) => id !== auth.currentUser?.uid) || "Artista";
  return { id: otherId, ...(item.participantProfiles?.[otherId] || {}) };
}
function renderConversations() {
  if (!conversationsEl) return;
  if (!conversations.length) { conversationsEl.innerHTML = '<div class="empty">Ainda não tens conversas. Encontra um artista na Community para começar.</div>'; return; }
  conversationsEl.innerHTML = conversations.map((item) => { const profile = otherProfile(item); return `<button class="messages-conversation ${item.id === activeConversation ? "is-active" : ""}" type="button" data-conversation-id="${item.id}"><strong>${profile.displayName || "Artista"}</strong><span>${item.lastMessage || "Nova conversa"}</span></button>`; }).join("");
}
function renderMessages(messages) {
  if (!itemsEl) return;
  itemsEl.innerHTML = messages.length ? messages.map((item) => `<div class="message-bubble ${item.senderId === auth.currentUser?.uid ? "is-own" : ""}">${item.body}</div>`).join("") : '<div class="empty">Ainda não há mensagens nesta conversa.</div>';
  itemsEl.scrollTop = itemsEl.scrollHeight;
}
async function openConversation(id) {
  activeConversation = id;
  const item = conversations.find((candidate) => candidate.id === id);
  const profile = item ? otherProfile(item) : {};
  if (titleEl) titleEl.textContent = profile.displayName || "Conversa privada";
  if (input) input.disabled = false;
  if (submit) submit.disabled = false;
  renderConversations();
  try { setStatus("A carregar conversa…"); renderMessages(await listConversationMessages(id)); setStatus("Sincronizado"); } catch (error) { setStatus(error instanceof Error ? error.message : "Erro ao carregar conversa", "error"); }
}
async function refreshMessages() {
  if (!auth.currentUser) { setStatus("Sessão necessária"); return; }
  try { setStatus("A sincronizar…"); conversations = await listMyConversations(); renderConversations(); setStatus("Sincronizado"); } catch (error) { setStatus(error instanceof Error ? error.message : "Não foi possível carregar Messages", "error"); }
}
conversationsEl?.addEventListener("click", (event) => { const id = event.target.closest("[data-conversation-id]")?.dataset.conversationId; if (id) openConversation(id); });
form?.addEventListener("submit", async (event) => { event.preventDefault(); if (!activeConversation || !input?.value.trim()) return; const body = input.value; input.value = ""; try { await sendPrivateMessage(activeConversation, body); await openConversation(activeConversation); await refreshMessages(); } catch (error) { setStatus(error instanceof Error ? error.message : "Não foi possível enviar", "error"); } });
window.addEventListener("firebase-auth-ready", refreshMessages);
refreshMessages();
