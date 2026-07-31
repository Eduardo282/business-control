import { normalizeDiscount } from "@shared/quotePricingRules.js";

const QUOTE_FOLIO_PATTERN = /^[A-Z]{4}\d{3}$/;
const QUOTE_FOLIO_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const REQUEST_DRAFT_SCOPE_VERSION = "v2";

function generateQuoteFolioCandidate(random) {
  const letters = Array.from(
    { length: 4 },
    () =>
      QUOTE_FOLIO_LETTERS[
        Math.floor(random() * QUOTE_FOLIO_LETTERS.length)
      ],
  ).join("");
  const numbers = String(Math.floor(random() * 1000)).padStart(3, "0");

  return `${letters}${numbers}`;
}

export function isMeaningfulQuoteDraft(draft) {
  return Boolean(
    draft?.selectedClient ||
      String(draft?.clientSearch || "").trim() ||
      String(draft?.folio || "").trim() ||
      draft?.items?.length,
  );
}

export function resolveQuoteFolioDraft(folio, random = Math.random) {
  const normalizedFolio = String(folio || "").trim().toUpperCase();
  if (QUOTE_FOLIO_PATTERN.test(normalizedFolio)) return normalizedFolio;
  return generateQuoteFolioCandidate(random);
}

export function buildCreateQuotePayload({ client, contactId, items, folio }) {
  return {
    client_id: client.id,
    contact_id: contactId || undefined,
    items: items.map((item) => {
      const discount = normalizeDiscount(item.discount || 0);

      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: Number(item.price) || 0,
        discount,
      };
    }),
    notes: "Ninguna por el momento",
    folio,
  };
}

export function resolveQuoteDraftScope({ requestId, clientId } = {}) {
  if (requestId) {
    return `request:${REQUEST_DRAFT_SCOPE_VERSION}:${requestId}`;
  }
  if (clientId) return `client:${clientId}`;
  return "global";
}
