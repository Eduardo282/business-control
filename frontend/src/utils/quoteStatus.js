const KNOWN_QUOTE_STATUSES = new Set([
  "SOLICITADA",
  "PENDIENTE",
  "ENVIADA",
  "ACEPTADA",
  "RECHAZADA",
]);

const TERMINAL_QUOTE_STATUSES = new Set(["ACEPTADA", "RECHAZADA"]);

export function getQuoteDisplayStatus(quote) {
  const storedStatus = String(quote?.status || "PENDIENTE").toUpperCase();

  if (KNOWN_QUOTE_STATUSES.has(storedStatus)) return storedStatus;

  return "PENDIENTE";
}

export function getQuoteStatusAfterSend(status) {
  const storedStatus = String(status || "PENDIENTE").toUpperCase();

  return TERMINAL_QUOTE_STATUSES.has(storedStatus)
    ? storedStatus
    : "ENVIADA";
}
