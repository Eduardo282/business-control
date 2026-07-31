export function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateTime(value) {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getQuoteStatusLabel(status) {
  const safeStatus = String(status || "").toUpperCase();
  if (safeStatus === "PENDIENTE") return "Pendiente";
  if (safeStatus === "SOLICITADA") return "Solicitada";
  if (safeStatus === "ACEPTADA") return "Aceptada";
  if (safeStatus === "ENVIADA") return "Enviada";
  if (safeStatus === "RECHAZADA") return "Rechazada";
  return status || "Pendiente";
}
