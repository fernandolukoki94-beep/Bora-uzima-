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
    const error = new Error(payload?.message || "Assistência IA indisponível.");
    error.status = payload?.status || "provider_unavailable";
    throw error;
  }
  return payload;
}
