import { buildProducerPlan } from "./producer-plan.js";

const MAX_ADVICE_TEXT = 500;
const MAX_CHAIN_ITEMS = 6;
const MAX_CHAIN_ITEM_LENGTH = 120;
const CONFIDENCES = new Set(["low", "medium", "high"]);

export function validateAiAdvice(advice) {
  if (!advice || typeof advice !== "object" || Array.isArray(advice)) return "Resposta IA inválida.";
  if (typeof advice.summary !== "string" || advice.summary.trim().length < 1 || advice.summary.length > MAX_ADVICE_TEXT) return "summary inválido.";
  if (!Array.isArray(advice.chain) || advice.chain.length < 1 || advice.chain.length > MAX_CHAIN_ITEMS) return "chain inválida.";
  if (advice.chain.some((item) => typeof item !== "string" || item.trim().length < 1 || item.length > MAX_CHAIN_ITEM_LENGTH)) return "item chain inválido.";
  if (!CONFIDENCES.has(advice.confidence)) return "confidence inválida.";
  return null;
}

export function adviceToProducerPlan({ advice, base = {} } = {}) {
  const error = validateAiAdvice(advice);
  if (error) throw new Error(error);
  const chainBrief = advice.chain.join(", ");
  const brief = [base.brief, advice.summary, `Cadeia vocal: ${chainBrief}.`].filter(Boolean).join(" ").slice(0, 900);
  const plan = buildProducerPlan({
    genre: base.genre || "Afrobeat",
    tempo: base.tempo || 100,
    key: base.key || "C",
    duration: base.duration || 60,
    brief,
    analysis: base.analysis || null,
    preferAnalysis: Boolean(base.preferAnalysis),
  });
  return {
    ...plan,
    execution: {
      ...(plan.execution || {}),
      mode: "ai-assisted",
      source: "server-provider",
      stages: ["arrangement", "instrumentation", "vocal-processing", "mix", "master"],
      vocalChain: advice.chain,
      arrangement: plan.arrangement,
      instrumentation: plan.instruments,
      mix: plan.mix,
      master: { enabled: true, mode: "local-safe-master", headroom: 0.89, compressor: plan.mix.mastering?.compressor, limiter: plan.mix.mastering?.limiter, targetLoudness: plan.mix.mastering?.targetLoudness },
      originalPreserved: true,
      reversible: true,
    },
    aiAdvice: { summary: advice.summary, confidence: advice.confidence, chain: advice.chain },
  };
}
