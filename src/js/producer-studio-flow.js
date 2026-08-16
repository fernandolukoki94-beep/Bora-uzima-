export function deriveProducerStudioState(project) {
  if (!project) return { hasProject: false, hasAnalysis: false, hasPlan: false, hasVocal: false, hasMix: false, hasMaster: false, confidence: 0 };
  const variants = project.audioVariants || {};
  const processingState = project.processing?.state || "IDLE";
  const hasAnalysis = Boolean(project.analysis?.hasAudio || project.analysis?.bpm || project.analysis?.key);
  const producerPlan = project.producerPlan || project.plan || null;
  const hasPlan = Boolean(producerPlan || (project.tracks || []).some((track) => track.type !== "audio" && (track.clips || []).some((clip) => clip.metadata?.producerPlan)));
  const hasVocal = Boolean(variants.enhanced || variants.pitchCorrected || project.processedAudioData);
  const hasMix = Boolean(variants.mixed);
  return {
    hasProject: true,
    hasAnalysis,
    hasPlan,
    hasVocal,
    hasMix,
    hasMaster: hasMix,
    processingState,
    bpm: project.manualAnalysis?.bpm || project.analysis?.bpm || project.tempo || 100,
    key: project.manualAnalysis?.key || project.analysis?.key || project.key || "C",
    confidence: project.analysis?.confidence || 0,
    genre: producerPlan?.genre || project.genre || "Demo vocal",
    brief: project.productionBrief || "Escolhe um género e descreve a intenção na Nova sessão.",
  };
}
