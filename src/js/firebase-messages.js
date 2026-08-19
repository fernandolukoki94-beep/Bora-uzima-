import { auth, db } from "./firebase-client.js";
import { addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const MAX_TEXT = 2000;
const MAX_ITEMS = 50;

function requireUser() {
  if (!auth.currentUser?.uid) throw new Error("Inicia sessão para usar Messages.");
  return auth.currentUser;
}
function clean(value, max = MAX_TEXT) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function conversationId(a, b) { return [a, b].sort().join("_"); }

export async function startConversation(targetUid, targetProfile = {}) {
  const user = requireUser();
  if (!targetUid || targetUid === user.uid) throw new Error("Destinatário inválido.");
  const id = conversationId(user.uid, targetUid);
  await setDoc(doc(db, "conversations", id), {
    id, participantIds: [user.uid, targetUid],
    participantProfiles: { [user.uid]: { displayName: user.displayName || "Artista" }, [targetUid]: targetProfile },
    updatedAt: serverTimestamp(), updatedAtMs: Date.now(),
  }, { merge: true });
  return id;
}

export async function listMyConversations() {
  const user = requireUser();
  const snapshot = await getDocs(query(collection(db, "conversations"), where("participantIds", "array-contains", user.uid), orderBy("updatedAtMs", "desc"), limit(MAX_ITEMS)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function listConversationMessages(conversationIdValue) {
  const user = requireUser();
  if (!conversationIdValue) throw new Error("Conversa inválida.");
  const conversation = await getDocs(query(collection(db, "conversations"), where("participantIds", "array-contains", user.uid), limit(MAX_ITEMS)));
  if (!conversation.docs.some((item) => item.id === conversationIdValue)) throw new Error("Não tens acesso a esta conversa.");
  const snapshot = await getDocs(query(collection(db, "conversations", conversationIdValue, "messages"), orderBy("createdAtMs", "asc"), limit(MAX_ITEMS)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function sendPrivateMessage(conversationIdValue, body) {
  const user = requireUser();
  const text = clean(body);
  if (!conversationIdValue || !text) throw new Error("Escreve uma mensagem.");
  const conversation = await getDocs(query(collection(db, "conversations"), where("participantIds", "array-contains", user.uid), limit(MAX_ITEMS)));
  if (!conversation.docs.some((item) => item.id === conversationIdValue)) throw new Error("Não tens acesso a esta conversa.");
  const message = { senderId: user.uid, body: text, createdAt: serverTimestamp(), createdAtMs: Date.now() };
  const created = await addDoc(collection(db, "conversations", conversationIdValue, "messages"), message);
  await setDoc(doc(db, "conversations", conversationIdValue), { lastMessage: text, updatedAt: serverTimestamp(), updatedAtMs: Date.now() }, { merge: true });
  return { id: created.id, ...message };
}

export const MESSAGE_LIMITS = Object.freeze({ maxText: MAX_TEXT, maxItems: MAX_ITEMS });
