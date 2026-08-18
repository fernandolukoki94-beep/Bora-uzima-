const AREA_CONFIG = {
  criar: { target: "recording-workspace", label: "Criar" },
  sons: { target: "instrument-lab", label: "Sons" },
  ai: { target: "producer-studio", label: "AI Producer" },
  studio: { target: "timeline", label: "Studio" },
  mix: { target: "mixer-panel", label: "Mix" },
  exportar: { target: "timeline-mixdown", label: "Exportar" },
};

function focusArea(targetId, source) {
  const target = document.getElementById(targetId);
  if (!target) return;
  document.body.classList.add("studio-focus-mode");
  document.querySelectorAll("[data-studio-area]").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.studioArea === targetId);
  });
  document.querySelectorAll(".studio-step").forEach((item) => {
    item.classList.toggle("is-active", item.getAttribute("href") === `#${targetId}`);
  });
  target.classList.add("studio-focus-target");
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => target.classList.remove("studio-focus-target"), 700);
  if (source) source.setAttribute("aria-current", "page");
}

function initStudioShell() {
  document.querySelectorAll(".nav-links a, .studio-step, .studio-transport-bar a").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "";
      const targetId = href.startsWith("#") ? href.slice(1) : "";
      if (!targetId || !document.getElementById(targetId)) return;
      event.preventDefault();
      focusArea(targetId, link);
    });
  });

  document.querySelectorAll("[data-studio-area]").forEach((item) => {
    item.addEventListener("click", () => focusArea(item.dataset.studioArea, item));
  });

  window.addEventListener("fernando-authenticated", () => {
    document.body.classList.add("studio-ready");
    document.body.classList.remove("public-landing");
    if (!window.location.hash || window.location.hash === "#top" || window.location.hash === "#estudio") {
      window.history.replaceState(null, "", "#recording-workspace");
    }
  });

  window.addEventListener("firebase-signed-out", () => {
    document.body.classList.remove("studio-ready");
    document.body.classList.add("public-landing");
    window.history.replaceState(null, "", "#top");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", initStudioShell);
export { AREA_CONFIG, focusArea };
