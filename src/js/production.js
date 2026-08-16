import { readProjects, saveProjects } from "./storage.js";

export function updateProjectStatus(id, status, renderProjects) {
  const projects = readProjects().map((item) => item.id === id ? { ...item, status } : item);
  saveProjects(projects);
  renderProjects();
}

export function processProject(id, { renderProjects, showToast }) {
  const project = readProjects().find((item) => item.id === id);
  if (!project) return;

  updateProjectStatus(id, "PROCESSING · simulado", renderProjects);
  showToast("Fluxo visual iniciado: análise vocal local simulada.");
  window.setTimeout(() => updateProjectStatus(id, "MIXING · simulado", renderProjects), 1100);
  window.setTimeout(() => updateProjectStatus(id, "MASTERING · simulado", renderProjects), 2200);
  window.setTimeout(() => {
    updateProjectStatus(id, "COMPLETED · pronto para revisão", renderProjects);
    showToast("A simulação terminou. Nenhum processamento de áudio real foi aplicado.");
  }, 3300);
}
