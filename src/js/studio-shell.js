const AREA_CONFIG = {
  home: { target: "studio-home", label: "Home" },
  projects: { target: "projects-panel", label: "Projectos" },
  criar: { target: "recording-workspace", label: "Criar" },
  sons: { target: "instrument-lab", label: "Sons" },
  ai: { target: "producer-studio", label: "AI Producer" },
  studio: { target: "timeline", label: "Studio" },
  mix: { target: "mixer-panel", label: "Mix" },
  exportar: { target: "timeline", label: "Exportar" },
};

const AREA_LABELS = {
  "studio-home": "Home",
  "projects-panel": "Projectos",
  "recording-workspace": "Criar",
  "instrument-lab": "Sons",
  "producer-studio": "AI Producer",
  "timeline": "Studio",
  "mixer-panel": "Mix",
  "community-panel": "Community",
  "profile-panel": "Profile",
  "messages-panel": "Mensagens",
};

const VIEW_GROUPS = {
  "studio-home": ["studio-home"],
  "projects-panel": ["projects-panel"],
  "recording-workspace": ["recording-workspace"],
  "instrument-lab": ["instrument-lab", "sound-library", "my-sounds", "beat-maker"],
  "beat-maker": ["instrument-lab", "sound-library", "my-sounds", "beat-maker"],
  "producer-studio": ["producer-studio"],
  timeline: ["control-room", "timeline", "mixer-panel"],
  "mixer-panel": ["control-room", "timeline", "mixer-panel"],
  "community-panel": ["community-panel"],
  "profile-panel": ["profile-panel"],
  "messages-panel": ["messages-panel"],
};

function focusArea(targetId, source) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const keep = new Set(VIEW_GROUPS[targetId] || [targetId]);
  document.body.classList.add("studio-focus-mode");
  document.body.dataset.studioView = targetId;
  const viewIds = ["studio-home", "projects-panel", "recording-workspace", "control-room", "instrument-lab", "sound-library", "my-sounds", "beat-maker", "producer-studio", "timeline", "mixer-panel", "community-panel", "profile-panel", "messages-panel"];
  viewIds.forEach((id) => {
    const view = document.getElementById(id);
    if (!view) return;
    const isHidden = !keep.has(id);
    view.classList.toggle("studio-view-hidden", isHidden);
    view.toggleAttribute("aria-hidden", isHidden);
    if ("inert" in view) view.inert = isHidden;
  });
  document.querySelectorAll("[data-studio-module-head]").forEach((head) => {
    head.classList.toggle("studio-module-head-hidden", !keep.has(head.dataset.studioModuleHead));
  });
  document.querySelectorAll("[data-studio-area]").forEach((item) => {
    const active = item.dataset.studioArea === targetId || (targetId === "timeline" && item.dataset.studioArea === "mixer-panel") || (targetId === "mixer-panel" && item.dataset.studioArea === "timeline");
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  document.querySelectorAll(".studio-step").forEach((item) => {
    item.classList.toggle("is-active", item.getAttribute("href") === `#${targetId}` || (targetId === "mixer-panel" && item.getAttribute("href") === "#timeline"));
  });
  const modeLabel = document.getElementById("studio-session-mode");
  if (modeLabel) modeLabel.textContent = AREA_LABELS[targetId] || "Studio";
  target.classList.add("studio-focus-target");
  target.removeAttribute("aria-hidden");
  if ("inert" in target) target.inert = false;
  window.setTimeout(() => target.classList.remove("studio-focus-target"), 700);
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
        document.querySelectorAll(".studio-module-head-hidden").forEach((item) => item.classList.remove("studio-module-head-hidden"));
        document.getElementById("studio-session-mode")?.replaceChildren(document.createTextNode("Lyrics / Notes"));
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
    document.querySelectorAll(".studio-module-head-hidden").forEach((item) => item.classList.remove("studio-module-head-hidden"));
    const modeLabel = document.getElementById("studio-session-mode");
    if (modeLabel) modeLabel.textContent = "Home";
    document.body.classList.add("public-landing");
    window.history.replaceState(null, "", "#top");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", initStudioShell);
export { AREA_CONFIG, focusArea };
