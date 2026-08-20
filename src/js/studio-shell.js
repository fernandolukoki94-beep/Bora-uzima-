const AREA_CONFIG = {
  home: { target: "studio-home", label: "Home" },
  criar: { target: "recording-workspace", label: "Criar" },
  sons: { target: "instrument-lab", label: "Sons" },
  ai: { target: "producer-studio", label: "AI Producer" },
  studio: { target: "timeline", label: "Studio" },
  mix: { target: "mixer-panel", label: "Mix" },
  exportar: { target: "timeline", label: "Exportar" },
};

function focusArea(targetId, source) {
  const target = document.getElementById(targetId);
  if (!target) return;
  document.body.classList.add("studio-focus-mode");
  document.body.dataset.studioView = targetId;
  const viewIds = ["studio-home", "projects-panel", "recording-workspace", "instrument-lab", "producer-studio", "sound-library", "beat-maker", "timeline", "mixer-panel", "community-panel", "profile-panel"];
  viewIds.forEach((id) => {
    const view = document.getElementById(id);
    if (!view) return;
    const shouldKeep = id === targetId || (targetId === "timeline" && id === "mixer-panel") || (targetId === "mixer-panel" && id === "timeline") || (targetId === "instrument-lab" && id === "beat-maker") || (targetId === "beat-maker" && id === "instrument-lab");
    const isHidden = !shouldKeep;
    view.classList.toggle("studio-view-hidden", isHidden);
    view.toggleAttribute("aria-hidden", isHidden);
    if ("inert" in view) view.inert = isHidden;
  });
  document.querySelectorAll("[data-studio-area]").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.studioArea === targetId);
  });
  document.querySelectorAll(".studio-step").forEach((item) => {
    item.classList.toggle("is-active", item.getAttribute("href") === `#${targetId}`);
  });
  target.classList.add("studio-focus-target");
  target.removeAttribute("aria-hidden");
  if ("inert" in target) target.inert = false;
  window.setTimeout(() => target.classList.remove("studio-focus-target"), 700);
  if (source) source.setAttribute("aria-current", "page");
}

function initStudioShell() {
  const editorTargets = { arrangement: "timeline", instrument: "instrument-lab", fx: "mixer-panel", midi: "instrument-lab", lyrics: "lyrics-panel" };
  const notes = document.getElementById("session-notes");
  const notesSave = document.getElementById("session-notes-save");
  const notesStatus = document.getElementById("session-notes-status");
  if (notes) {
    notes.value = localStorage.getItem("flm-session-notes") || "";
    if (notes.value && notesStatus) notesStatus.textContent = "Notas restauradas deste dispositivo.";
  }
  notesSave?.addEventListener("click", () => {
    localStorage.setItem("flm-session-notes", notes?.value || "");
    if (notesStatus) notesStatus.textContent = `Guardado às ${new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}.`;
  });
  document.querySelectorAll("[data-editor-view]").forEach((tab) => {
    tab.addEventListener("click", () => {
      const view = tab.dataset.editorView || "arrangement";
      document.querySelectorAll("[data-editor-view]").forEach((item) => {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      const notesPanel = document.getElementById("lyrics-panel");
      notesPanel?.classList.toggle("studio-context-panel-hidden", view !== "lyrics");
      const targetId = editorTargets[view] || "timeline";
      if (view === "lyrics") {
        document.body.dataset.studioView = "lyrics-panel";
        document.querySelectorAll(".studio-view-hidden").forEach((item) => { item.classList.remove("studio-view-hidden"); item.removeAttribute("aria-hidden"); if ("inert" in item) item.inert = false; });
        notes?.focus({ preventScroll: true });
        return;
      }
      focusArea(targetId, tab);
      if (view === "midi") document.getElementById("piano-roll")?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  });
  document.querySelectorAll(".nav-links a, .studio-step, .studio-transport-bar a, .studio-sidebar-export, [data-studio-area]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "";
      const targetId = link.dataset.studioArea || (href.startsWith("#") ? href.slice(1) : "");
      if (!targetId || !document.getElementById(targetId)) return;
      event.preventDefault();
      focusArea(targetId, link);
    });
  });

  document.querySelectorAll("[data-studio-area]").forEach((item) => {
    item.addEventListener("click", () => focusArea(item.dataset.studioArea, item));
  });

  window.addEventListener("hashchange", () => {
    const targetId = window.location.hash.replace(/^#/, "");
    if (targetId && document.getElementById(targetId) && document.body.classList.contains("studio-ready")) focusArea(targetId);
  });
  window.addEventListener("fernando-authenticated", () => {
    document.body.classList.add("studio-ready");
    document.body.classList.remove("public-landing");
    if (!window.location.hash || window.location.hash === "#top" || window.location.hash === "#estudio") {
      window.history.replaceState(null, "", "#studio-home");
      focusArea("studio-home");
    } else {
      const targetId = window.location.hash.replace(/^#/, "");
      if (document.getElementById(targetId)) focusArea(targetId);
    }
  });

  window.addEventListener("firebase-signed-out", () => {
    document.body.classList.remove("studio-ready", "studio-focus-mode");
    delete document.body.dataset.studioView;
    document.querySelectorAll(".studio-view-hidden").forEach((item) => {
      item.classList.remove("studio-view-hidden");
      item.removeAttribute("aria-hidden");
      if ("inert" in item) item.inert = false;
    });
    document.body.classList.add("public-landing");
    window.history.replaceState(null, "", "#top");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", initStudioShell);
export { AREA_CONFIG, focusArea };
