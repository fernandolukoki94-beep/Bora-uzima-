export function mixedExportFilename(projectName = "sessao") {
  const safeName = String(projectName || "sessao").replace(/[^\p{L}\p{N}._ -]/gu, "-").trim() || "sessao";
  return `${safeName}-mixed.wav`;
}

export function downloadBlob(blob, filename, { documentRef = globalThis.document, urlApi = globalThis.URL } = {}) {
  if (!blob || !documentRef?.createElement || !urlApi?.createObjectURL) {
    throw new Error("download não suportado neste ambiente");
  }
  const objectUrl = urlApi.createObjectURL(blob);
  const link = documentRef.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  documentRef.body.appendChild(link);
  link.click();
  link.remove();
  const revoke = () => urlApi.revokeObjectURL?.(objectUrl);
  if (typeof globalThis.setTimeout === "function") globalThis.setTimeout(revoke, 1000);
  else revoke();
  return objectUrl;
}
