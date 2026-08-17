export async function requestProductionAdvice(input, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") throw new Error("fetch indisponível neste navegador.");
  const response = await fetchImpl("/api/v1/production/advice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok) {
    const status = payload?.status || "provider_unavailable";
    const messages = {
      provider_quota_exhausted: "O provider IA respondeu, mas a quota está esgotada. Nenhum áudio foi alterado; podes continuar com o Producer Plan local.",
      provider_auth_failed: "O provider IA recusou a credencial server-side. A chave não é exposta no navegador; verifica a configuração do ambiente.",
      provider_unavailable: "O provider IA está indisponível ou demorou demasiado. O Producer Plan local continua disponível.",
      invalid_provider_response: "O provider IA respondeu num formato inválido. O projecto não foi alterado.",
    };
    const error = new Error(messages[status] || payload?.message || "Assistência IA indisponível.");
    error.status = status;
    throw error;
  }
  return payload;
}
