import { auth, db, ensureUserProfile } from "./firebase-client.js";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const MAX_TEXT = 500;
const MAX_TITLE = 120;
const MAX_ITEMS = 40;

function requireUser() {
  if (!auth.currentUser?.uid) throw new Error("Inicia sessão para entrar na Community.");
  return auth.currentUser;
}

function clean(value, max = MAX_TEXT) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normaliseType(value) {
  return ["song", "project", "beat", "video", "clip"].includes(value) ? value : "song";
}

function publicProfile(user, profile = {}) {
  return {
    uid: user.uid,
    displayName: clean(profile.artistName || profile.name || user.displayName || "Artista", 80) || "Artista",
    username: clean(profile.username || user.email?.split("@")[0] || "artista", 32).replace(/^@/, ""),
    bio: clean(profile.bio, 240),
    genres: Array.isArray(profile.genres) ? profile.genres.map((item) => clean(item, 32)).filter(Boolean).slice(0, 8) : [],
    location: clean(profile.location, 80),
    avatarUrl: clean(profile.avatarUrl, 500),
  };
}

export async function getMyCommunityProfile() {
  const user = requireUser();
  const snapshot = await getDoc(doc(db, "users", user.uid));
  const data = snapshot.exists() ? snapshot.data() : {};
  return publicProfile(user, data.profile || {});
}

export async function saveCommunityProfile(profile = {}) {
  const user = requireUser();
  const next = publicProfile(user, profile);
  await ensureUserProfile(user, next.displayName);
  await setDoc(doc(db, "users", user.uid), {
    displayName: next.displayName,
    profile: next,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return next;
}

export async function createCommunityPost({ type = "song", title = "", body = "", projectId = "", projectName = "", visibility = "public" } = {}) {
  const user = requireUser();
  const profile = await getMyCommunityProfile();
  const postId = `${user.uid}-${Date.now()}`;
  const post = {
    id: postId,
    authorId: user.uid,
    author: profile,
    type: normaliseType(type),
    title: clean(title, MAX_TITLE) || "Sem título",
    body: clean(body),
    projectId: clean(projectId, 128),
    projectName: clean(projectName, 120),
    visibility: visibility === "unlisted" ? "unlisted" : "public",
    likeIds: [],
    commentCount: 0,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  };
  await setDoc(doc(db, "posts", postId), post);
  return { ...post, createdAt: post.createdAtMs };
}

export async function listCommunityPosts({ mode = "new", type = "all" } = {}) {
  requireUser();
  const snapshot = await getDocs(query(collection(db, "posts"), limit(MAX_ITEMS)));
  const posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    .filter((post) => post.visibility !== "private")
    .filter((post) => type === "all" || post.type === type)
    .sort((a, b) => {
      if (mode === "trending") return (b.likeIds?.length || 0) - (a.likeIds?.length || 0) || (b.createdAtMs || 0) - (a.createdAtMs || 0);
      return (b.createdAtMs || 0) - (a.createdAtMs || 0);
    });
  return posts;
}

export async function toggleCommunityLike(postId, liked) {
  const user = requireUser();
  if (!postId) throw new Error("Publicação inválida.");
  await updateDoc(doc(db, "posts", postId), {
    likeIds: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
  });
  return !liked;
}

export async function addCommunityComment(postId, body) {
  const user = requireUser();
  const text = clean(body);
  if (!postId || !text) throw new Error("Escreve um comentário antes de publicar.");
  const profile = await getMyCommunityProfile();
  const commentId = `${user.uid}-${Date.now()}`;
  await setDoc(doc(db, "posts", postId, "comments", commentId), {
    id: commentId,
    authorId: user.uid,
    author: profile,
    body: text,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  });
  return { id: commentId, authorId: user.uid, author: profile, body: text, createdAtMs: Date.now() };
}

export async function followCommunityUser(targetUid, following) {
  const user = requireUser();
  if (!targetUid || targetUid === user.uid) return false;
  const followId = `${user.uid}_${targetUid}`;
  if (following) {
    await setDoc(doc(db, "follows", followId), {
      followerId: user.uid,
      followingId: targetUid,
      createdAt: serverTimestamp(),
    });
  } else {
    await updateDoc(doc(db, "follows", followId), { active: false });
  }
  return !following;
}

export const COMMUNITY_LIMITS = Object.freeze({ maxText: MAX_TEXT, maxItems: MAX_ITEMS });
