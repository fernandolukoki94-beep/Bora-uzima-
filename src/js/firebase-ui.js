import {
  firebaseErrorMessage,
  loginWithEmail,
  logout,
  observeAuth,
  registerWithEmail,
  resetPassword,
} from "./firebase-client.js";

const panel = document.getElementById("firebase-auth-panel");
const form = document.getElementById("firebase-auth-form");
const mode = document.getElementById("firebase-auth-mode");
const nameField = document.getElementById("firebase-auth-name-field");
const nameInput = document.getElementById("firebase-auth-name");
const emailInput = document.getElementById("firebase-auth-email");
const passwordInput = document.getElementById("firebase-auth-password");
const submit = document.getElementById("firebase-auth-submit");
const reset = document.getElementById("firebase-auth-reset");
const toggle = document.getElementById("firebase-auth-toggle");
const close = document.getElementById("firebase-auth-close");
const status = document.getElementById("firebase-auth-status");
const account = document.getElementById("firebase-account");
const accountName = document.getElementById("firebase-account-name");
const accountEmail = document.getElementById("firebase-account-email");
const logoutButton = document.getElementById("firebase-logout");
const openButtons = document.querySelectorAll("[data-open-firebase-auth]");

if (panel && form) {
  let currentMode = "login";

  function setStatus(message, state = "") {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  }

  function setMode(nextMode) {
    currentMode = nextMode;
    const isRegister = currentMode === "register";
    if (mode) mode.textContent = isRegister ? "Criar conta" : "Entrar";
    if (nameField) nameField.hidden = !isRegister;
    if (submit) submit.textContent = isRegister ? "Criar conta" : "Entrar";
    if (toggle) toggle.textContent = isRegister ? "Já tenho uma conta" : "Criar uma conta";
    setStatus("");
  }

  function openPanel(nextMode = "login") {
    setMode(nextMode);
    panel.hidden = false;
    emailInput?.focus();
  }

  function closePanel() {
    panel.hidden = true;
    setStatus("");
  }

  function setBusy(busy) {
    if (submit) submit.disabled = busy;
    if (reset) reset.disabled = busy;
    if (toggle) toggle.disabled = busy;
    if (submit) submit.setAttribute("aria-busy", String(busy));
  }

  openButtons.forEach((button) => button.addEventListener("click", () => openPanel(button.dataset.authMode || "login")));
  close?.addEventListener("click", closePanel);
  toggle?.addEventListener("click", () => setMode(currentMode === "login" ? "register" : "login"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";
    if (!email || password.length < 6) {
      setStatus("Introduz um e-mail e uma palavra-passe com pelo menos 6 caracteres.", "error");
      return;
    }
    setBusy(true);
    setStatus(currentMode === "register" ? "A criar a conta…" : "A iniciar sessão…", "loading");
    try {
      if (currentMode === "register") await registerWithEmail(email, password, nameInput?.value || "");
      else await loginWithEmail(email, password);
      setStatus("Sessão iniciada.", "success");
      window.setTimeout(closePanel, 450);
    } catch (error) {
      setStatus(firebaseErrorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  });

  reset?.addEventListener("click", async () => {
    const email = emailInput?.value.trim() || "";
    if (!email) return setStatus("Escreve primeiro o teu e-mail para receber o link.", "error");
    setBusy(true);
    setStatus("A enviar o link de recuperação…", "loading");
    try {
      await resetPassword(email);
      setStatus("Link de recuperação enviado. Verifica o teu e-mail.", "success");
    } catch (error) {
      setStatus(firebaseErrorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  });

  logoutButton?.addEventListener("click", async () => {
    try {
      await logout();
      setStatus("Sessão terminada.", "success");
    } catch (error) {
      setStatus(firebaseErrorMessage(error), "error");
    }
  });

  observeAuth((user) => {
    const signedIn = Boolean(user);
    if (account) account.hidden = !signedIn;
    openButtons.forEach((button) => { button.hidden = signedIn; });
    if (signedIn) {
      if (accountName) accountName.textContent = user.displayName || "Artista";
      if (accountEmail) accountEmail.textContent = user.email || "";
      if (panel) panel.hidden = true;
    }
  });
}
