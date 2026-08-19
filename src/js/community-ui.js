import {
  addCommunityComment,
  createCommunityPost,
  getMyCommunityProfile,
  listCommunityPosts,
  listCommunityProfiles,
  listCommunityFollowing,
  followCommunityUser,
  saveCommunityProfile,
  toggleCommunityLike,
} from "./firebase-community.js";

const $ = (id) => document.getElementById(id);
const state = { mode: "new", type: "all", posts: [], profiles: [], following: new Set() };

const els = {
  status: $("community-status"),
  feed: $("community-feed"),
  postForm: $("community-post-form"),
  postType: $("community-post-type"),
  postTitle: $("community-post-title"),
  postBody: $("community-post-body"),
  postVisibility: $("community-post-visibility"),
  typeFilter: $("community-type-filter"),
  profileForm: $("community-profile-form"),
  profileStatus: $("profile-status"),
  artistName: $("profile-artist-name"),
  username: $("profile-username"),
  bio: $("profile-bio"),
  genres: $("profile-genres"),
  location: $("profile-location"),
  profileSearch: $("community-profile-search"),
  profileResults: $("community-profile-results"),
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function setStatus(element, text, stateName = "") {
  if (!element) return;
  element.textContent = text;
  if (stateName) element.dataset.state = stateName;
}

function postCard(post) {
  const liked = Array.isArray(post.likeIds) && window.firebaseCommunityUid && post.likeIds.includes(window.firebaseCommunityUid);
  return `<article class="community-post" data-post-id="${escapeHtml(post.id)}">
    <div class="community-post-head"><div><div class="community-post-meta"><span class="community-post-type">${escapeHtml(post.type)}</span><span>por ${escapeHtml(post.author?.displayName || "Artista")}</span></div><h4>${escapeHtml(post.title || "Sem título")}</h4></div><span class="pill">${escapeHtml(post.visibility || "public")}</span></div>
    <p>${escapeHtml(post.body || "")}</p>
    ${post.projectName ? `<small>Projecto: ${escapeHtml(post.projectName)}</small>` : ""}
    <div class="community-post-actions"><button class="mini-button" type="button" data-community-action="like" data-liked="${liked ? "true" : "false"}">${liked ? "♥" : "♡"} ${post.likeIds?.length || 0}</button><button class="mini-button" type="button" data-community-action="comment">Comentar</button><button class="mini-button" type="button" data-community-action="share">Partilhar</button></div>
    <div class="community-comment-box" hidden><form data-community-comment-form><input name="body" maxlength="500" placeholder="Escreve um comentário" required /><button class="mini-button" type="submit">Publicar</button></form><div class="community-comment-status" role="status"></div></div>
  </article>`;
}

function renderProfiles() {
  if (!els.profileResults) return;
  if (!state.profiles.length) {
    els.profileResults.innerHTML = `<div class="empty">Não encontrámos artistas para esta pesquisa.</div>`;
    return;
  }
  els.profileResults.innerHTML = state.profiles.map((profile) => {
    const following = state.following.has(profile.uid);
    return `<article class="community-profile-result"><div><strong>${escapeHtml(profile.displayName)}</strong><span>@${escapeHtml(profile.username)}</span><small>${escapeHtml(profile.genres.join(" · ") || "Artista")}</small></div><button class="mini-button" type="button" data-profile-follow="${escapeHtml(profile.uid)}" data-following="${following ? "true" : "false"}">${following ? "A seguir" : "Seguir"}</button></article>`;
  }).join("");
}

async function loadProfiles() {
  if (!els.profileResults) return;
  try {
    const [profiles, followingIds] = await Promise.all([listCommunityProfiles({ search: els.profileSearch?.value || "" }), listCommunityFollowing()]);
    state.profiles = profiles;
    state.following = new Set(followingIds);
    renderProfiles();
  } catch (error) {
    els.profileResults.innerHTML = `<div class="empty">Descoberta indisponível: ${escapeHtml(error.message)}</div>`;
  }
}

function renderFeed() {
  if (!els.feed) return;
  if (!state.posts.length) {
    els.feed.innerHTML = `<div class="empty">Ainda não há publicações para estes filtros.</div>`;
    return;
  }
  els.feed.innerHTML = state.posts.map(postCard).join("");
}

async function loadFeed() {
  if (!els.feed) return;
  setStatus(els.status, "A sincronizar", "loading");
  try {
    state.posts = await listCommunityPosts({ mode: state.mode, type: state.type });
    renderFeed();
    setStatus(els.status, `${state.posts.length} publicações`, "success");
  } catch (error) {
    els.feed.innerHTML = `<div class="empty">Community indisponível: ${escapeHtml(error.message)}</div>`;
    setStatus(els.status, "Requer sessão", "error");
  }
}

async function loadProfile() {
  if (!els.profileForm) return;
  try {
    const profile = await getMyCommunityProfile();
    els.artistName.value = profile.displayName || "";
    els.username.value = profile.username ? `@${profile.username}` : "";
    els.bio.value = profile.bio || "";
    els.genres.value = (profile.genres || []).join(", ");
    els.location.value = profile.location || "";
    setStatus(els.profileStatus, "Perfil carregado", "success");
  } catch (error) {
    setStatus(els.profileStatus, "Requer sessão", "error");
  }
}

els.postForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = els.postForm.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    await createCommunityPost({ type: els.postType.value, title: els.postTitle.value, body: els.postBody.value, visibility: els.postVisibility.value });
    els.postForm.reset();
    await loadFeed();
  } catch (error) {
    setStatus(els.status, error.message, "error");
  } finally {
    submit.disabled = false;
  }
});

els.profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = els.profileForm.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    await saveCommunityProfile({ artistName: els.artistName.value, username: els.username.value, bio: els.bio.value, genres: els.genres.value.split(",").map((item) => item.trim()).filter(Boolean), location: els.location.value });
    setStatus(els.profileStatus, "Perfil guardado", "success");
  } catch (error) {
    setStatus(els.profileStatus, error.message, "error");
  } finally {
    submit.disabled = false;
  }
});

els.typeFilter?.addEventListener("change", () => { state.type = els.typeFilter.value; loadFeed(); });
els.profileSearch?.addEventListener("input", () => loadProfiles());
els.profileResults?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-profile-follow]");
  if (!button) return;
  button.disabled = true;
  try {
    const nextFollowing = await followCommunityUser(button.dataset.profileFollow, button.dataset.following === "true");
    if (nextFollowing) state.following.add(button.dataset.profileFollow); else state.following.delete(button.dataset.profileFollow);
    renderProfiles();
  } catch (error) {
    setStatus(els.status, error.message, "error");
  }
});
document.querySelectorAll("[data-community-mode]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-community-mode]").forEach((item) => item.classList.toggle("is-active", item === button));
  state.mode = button.dataset.communityMode || "new";
  loadFeed();
}));

els.feed?.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-community-action]");
  if (!action) return;
  const card = action.closest("[data-post-id]");
  const post = state.posts.find((item) => item.id === card?.dataset.postId);
  if (!post) return;
  if (action.dataset.communityAction === "comment") {
    card.querySelector(".community-comment-box")?.toggleAttribute("hidden");
    return;
  }
  if (action.dataset.communityAction === "share") {
    const shareText = `${post.title} — Fernando Lucoco Music`;
    if (navigator.share) await navigator.share({ title: post.title, text: shareText, url: window.location.href }).catch(() => {});
    else await navigator.clipboard?.writeText(shareText);
    return;
  }
  if (action.dataset.communityAction === "like") {
    try { await toggleCommunityLike(post.id, action.dataset.liked === "true"); await loadFeed(); } catch (error) { setStatus(els.status, error.message, "error"); }
  }
});

els.feed?.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-community-comment-form]");
  if (!form) return;
  event.preventDefault();
  const card = form.closest("[data-post-id]");
  const status = card.querySelector(".community-comment-status");
  try { await addCommunityComment(card.dataset.postId, form.body.value); form.reset(); status.textContent = "Comentário publicado."; } catch (error) { status.textContent = error.message; }
});

window.addEventListener("fernando-authenticated", (event) => {
  window.firebaseCommunityUid = event.detail?.user?.uid || "";
  loadFeed();
  loadProfile();
  loadProfiles();
});
window.addEventListener("firebase-signed-out", () => {
  window.firebaseCommunityUid = "";
  if (els.feed) els.feed.innerHTML = `<div class="empty">Inicia sessão para abrir a Community.</div>`;
  setStatus(els.status, "Requer sessão", "error");
});

export { renderFeed };
