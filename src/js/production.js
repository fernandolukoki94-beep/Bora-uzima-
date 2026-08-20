import { readProjects, saveProjects } from "./storage.js";

export const PRODUCTION_STATES = Object.freeze({
  IDLE: "IDLE",
  PREPARING: "PREPARING",
  ARRANGING: "ARRANGING",
  MIXING: "MIXING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
});

const activeJobs = new Map();

export function updateProjectStatus(id, status, renderProjects, extra = {}) {
  const projects = readProjects().map((item) => item.id === id ? { ...item, status, ...extra } : item);
  saveProjects(projects);
  renderProjects();
  return projects.find((item) => item.id === id) || null;
}

export function getProjectProcessing(project) {
  return project?.processing || { state: PRODUCTION_STATES.IDLE, progress: 0 };
}

export function isProductionActive(id) {
  return activeJobs.has(id);
}

export function cancelProduction(id, renderProjects, showToast) {
  const job = activeJobs.get(id);
  if (!job) return false;
  job.cancelled = true;
  activeJobs.delete(id);
  updateProjectStatus(id, "Produção cancelada · original preservado", renderProjects, {
    processing: { state: PRODUCTION_STATES.CANCELLED, progress: job.progress, completedAt: new Date().toISOString() },
  });
  showToast("Produção cancelada. O original e a sessão anterior continuam preservados.");
  return true;
}

export function beginProduction(id, renderProjects) {
  if (activeJobs.has(id)) return null;
  const job = { cancelled: false, progress: 0 };
  activeJobs.set(id, job);
  updateProjectStatus(id, "Produção a preparar", renderProjects, {
    processing: { state: PRODUCTION_STATES.PREPARING, progress: 0, startedAt: new Date().toISOString() },
  });
  return job;
}

export function setProductionPhase(id, state, status, progress, renderProjects) {
  const job = activeJobs.get(id);
  if (!job || job.cancelled) return false;
  job.progress = progress;
  updateProjectStatus(id, status, renderProjects, { processing: { state, progress } });
  return true;
}

export function completeProduction(id, renderProjects, label = "Producer Plan local aplicado") {
  if (!activeJobs.has(id)) return false;
  activeJobs.delete(id);
  updateProjectStatus(id, label, renderProjects, {
    processing: { state: PRODUCTION_STATES.COMPLETED, progress: 100, completedAt: new Date().toISOString() },
  });
  return true;
}

export function failProduction(id, error, renderProjects) {
  activeJobs.delete(id);
  updateProjectStatus(id, "Produção falhou · tenta novamente", renderProjects, {
    processing: { state: PRODUCTION_STATES.FAILED, progress: 0, error: error instanceof Error ? error.message : "Falha local desconhecida" },
  });
}
