const STORAGE_KEY = "fernando-lucoco-onboarding-v1";

import { syncProfilePreferences } from "./firebase-projects.js";

const shell = document.querySelector("#onboarding-shell");
if (shell) {
  const steps = [...shell.querySelectorAll("[data-onboarding-step]")];
  const stepLabel = shell.querySelector("#onboarding-step-label");
  const nameInput = shell.querySelector("#onboarding-name");
  const usernameInput = shell.querySelector("#onboarding-username");
  const artistInput = shell.querySelector("#onboarding-artist");
  const locationInput = shell.querySelector("#onboarding-location");
  const summary = shell.querySelector("#onboarding-summary");
  const state = { name: "", username: "", artist: "", location: "", genre: "Afrobeat", objectives: [], instrument: "Vocal" };
  let currentStep = 1;
  let previousFocus = null;

  const focusStep = () => {
    window.requestAnimationFrame(() => {
      const activeStep = steps.find((step) => Number(step.dataset.onboardingStep) === currentStep);
      const target = activeStep?.querySelector("input, button, [tabindex]:not([tabindex=\"-1\"])");
      target?.focus({ preventScroll: true });
    });
  };

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
    if (nameInput) nameInput.value = state.name;
    if (usernameInput) usernameInput.value = state.username;
    if (artistInput) artistInput.value = state.artist;
    if (locationInput) locationInput.value = state.location;
    if (summary) summary.innerHTML = `<strong>${state.artist || "Artista"}</strong><span>${state.username ? `@${state.username.replace(/^@/, "")}` : "username por definir"} · ${state.genre} · ${state.instrument}</span><small>${state.objectives.length ? state.objectives.join(" · ") : "Sem objectivos seleccionados"}</small>`;
    shell.querySelectorAll("[data-choice-group]").forEach((choice) => {
      const value = state[choice.dataset.choiceGroup];
      const selected = Array.isArray(value) ? value.includes(choice.dataset.choiceValue) : value === choice.dataset.choiceValue;
      choice.classList.toggle("is-selected", selected);
      choice.setAttribute("aria-pressed", String(selected));
    });
  };

  const open = () => {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    shell.hidden = false;
    document.body.classList.add("onboarding-open");
    render();
    focusStep();
  };
  const close = () => {
    shell.hidden = true;
    document.body.classList.remove("onboarding-open");
    window.requestAnimationFrame(() => {
      if (previousFocus?.isConnected && !previousFocus.hidden) previousFocus.focus({ preventScroll: true });
      previousFocus = null;
    });
  };

  readState();
  try {
    const draft = JSON.parse(sessionStorage.getItem(`${STORAGE_KEY}-draft`) || "null");
    if (draft && typeof draft === "object") Object.assign(state, draft);
  } catch { /* session storage may be unavailable */ }
  state.objectives = Array.isArray(state.objectives) ? state.objectives : [];
  document.querySelectorAll("[data-open-fernando-onboarding]").forEach((button) => button.addEventListener("click", open));

  shell.addEventListener("click", (event) => {
    const next = event.target.closest("[data-onboarding-next]");
    const previous = event.target.closest("[data-onboarding-prev]");
    const choice = event.target.closest("[data-choice-group]");
    if (choice) {
      const group = choice.dataset.choiceGroup;
      if (group === "objectives") {
        const values = new Set(Array.isArray(state.objectives) ? state.objectives : []);
        if (values.has(choice.dataset.choiceValue)) values.delete(choice.dataset.choiceValue); else values.add(choice.dataset.choiceValue);
        state.objectives = [...values];
      } else state[group] = choice.dataset.choiceValue;
      render();
      return;
    }
    if (next) {
      state.name = nameInput?.value.trim() || state.name;
      state.username = (usernameInput?.value.trim() || state.username).replace(/^@/, "");
      state.artist = artistInput?.value.trim() || state.artist || "Artista";
      state.location = locationInput?.value.trim() || state.location;
      if (currentStep === 1 && (!state.name || !state.username || !state.artist)) {
        showInlineError("Preenche nome, username e nome artístico para continuar.");
        return;
      }
      if (currentStep < steps.length) { currentStep += 1; render(); focusStep(); }
      return;
    }
    if (previous && currentStep > 1) { currentStep -= 1; render(); focusStep(); return; }
    if (event.target.closest("#onboarding-close")) {
      window.dispatchEvent(new CustomEvent("open-fernando-auth", { detail: { mode: "login" } }));
      return;
    }
    if (event.target.closest("#onboarding-account")) {
      state.name = nameInput?.value.trim() || state.name;
      state.username = (usernameInput?.value.trim() || state.username).replace(/^@/, "");
      state.artist = artistInput?.value.trim() || state.artist || "Artista";
      state.location = locationInput?.value.trim() || state.location;
      persistDraft();
      close();
      window.dispatchEvent(new CustomEvent("open-fernando-auth", { detail: { mode: "register" } }));
    }
  });

  function showInlineError(message) {
    if (!summary) return;
    summary.dataset.state = "error";
    summary.setAttribute("role", "alert");
    summary.innerHTML = `<strong>Falta um detalhe</strong><span>${message}</span>`;
    const firstInvalid = [nameInput, usernameInput, artistInput].find((input) => !input?.value.trim());
    firstInvalid?.focus({ preventScroll: true });
  }

  shell.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
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
