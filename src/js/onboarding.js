const STORAGE_KEY = "fernando-lucoco-onboarding-v1";

import { syncProfilePreferences } from "./firebase-projects.js";

const shell = document.querySelector("#onboarding-shell");
if (shell) {
  const steps = [...shell.querySelectorAll("[data-onboarding-step]")];
  const stepLabel = shell.querySelector("#onboarding-step-label");
  const artistInput = shell.querySelector("#onboarding-artist");
  const summary = shell.querySelector("#onboarding-summary");
  const state = { artist: "", genre: "Afrobeat", instrument: "Vocal" };
  let currentStep = 1;

  const readState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && typeof saved === "object") Object.assign(state, saved);
    } catch { /* local storage may be unavailable */ }
  };

  const persist = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, completed: true })); } catch { /* continue locally */ }
  };

  const persistDraft = () => {
    try { sessionStorage.setItem(`${STORAGE_KEY}-draft`, JSON.stringify(state)); } catch { /* continue locally */ }
  };

  const clearDraft = () => {
    try { sessionStorage.removeItem(`${STORAGE_KEY}-draft`); } catch { /* continue locally */ }
  };

  const render = () => {
    steps.forEach((step) => step.classList.toggle("is-active", Number(step.dataset.onboardingStep) === currentStep));
    if (stepLabel) stepLabel.textContent = `Passo ${currentStep} de ${steps.length}`;
    if (artistInput) artistInput.value = state.artist;
    if (summary) summary.innerHTML = `<strong>${state.artist || "Artista"}</strong><span>${state.genre} · ponto de partida: ${state.instrument}</span>`;
    shell.querySelectorAll("[data-choice-group]").forEach((choice) => {
      choice.classList.toggle("is-selected", state[choice.dataset.choiceGroup] === choice.dataset.choiceValue);
      choice.setAttribute("aria-pressed", String(state[choice.dataset.choiceGroup] === choice.dataset.choiceValue));
    });
  };

  const open = () => { shell.hidden = false; document.body.classList.add("onboarding-open"); render(); };
  const close = () => { shell.hidden = true; document.body.classList.remove("onboarding-open"); };

  readState();
  try {
    const draft = JSON.parse(sessionStorage.getItem(`${STORAGE_KEY}-draft`) || "null");
    if (draft && typeof draft === "object") Object.assign(state, draft);
  } catch { /* session storage may be unavailable */ }
  if (!(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")?.completed; } catch { return false; } })()) open();

  shell.addEventListener("click", (event) => {
    const next = event.target.closest("[data-onboarding-next]");
    const previous = event.target.closest("[data-onboarding-prev]");
    const choice = event.target.closest("[data-choice-group]");
    if (choice) { state[choice.dataset.choiceGroup] = choice.dataset.choiceValue; render(); return; }
    if (next) {
      state.artist = artistInput?.value.trim() || "Artista";
      if (currentStep < steps.length) { currentStep += 1; render(); }
      return;
    }
    if (previous && currentStep > 1) { currentStep -= 1; render(); return; }
    if (event.target.closest("#onboarding-close")) {
      window.dispatchEvent(new CustomEvent("open-fernando-auth", { detail: { mode: "login" } }));
      return;
    }
    if (event.target.closest("#onboarding-account")) {
      state.artist = artistInput?.value.trim() || state.artist || "Artista";
      persistDraft();
      close();
      window.dispatchEvent(new CustomEvent("open-fernando-auth", { detail: { mode: "register" } }));
    }
  });

  window.addEventListener("open-fernando-onboarding", open);
  window.addEventListener("fernando-authenticated", async () => {
    persist();
    clearDraft();
    close();
    try {
      await syncProfilePreferences(state);
      window.dispatchEvent(new CustomEvent("fernando-profile-synced"));
    } catch (error) {
      console.warn("Preferências do onboarding não sincronizadas", error);
      window.dispatchEvent(new CustomEvent("fernando-profile-sync-failed"));
    }
  });
}
