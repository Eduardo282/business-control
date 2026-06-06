import { randomInt } from "node:crypto";

import { pool } from "../../../config/db.js";

const QUOTE_FOLIO_RETRY_LIMIT = 50;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const QUOTE_FOLIO_PATTERN = /^[A-Z]{4}\d{3}$/;

export function normalizeQuoteFolio(folio) {
  const cleanFolio = String(folio || "").trim().toUpperCase();
  return QUOTE_FOLIO_PATTERN.test(cleanFolio) ? cleanFolio : "";
}

export function generateQuoteFolioCandidate() {
  const letterPart = Array.from(
    { length: 4 },
    () => LETTERS[randomInt(LETTERS.length)],
  ).join("");
  const numericPart = String(randomInt(1000)).padStart(3, "0");

  return `${letterPart}${numericPart}`;
}

async function quoteFolioExists(folio, queryRunner, excludeQuoteId = null) {
  const params = [folio];
  let query = "SELECT id FROM quotes WHERE folio = ?";

  if (excludeQuoteId !== null && excludeQuoteId !== undefined) {
    query += " AND id <> ?";
    params.push(excludeQuoteId);
  }

  query += " LIMIT 1";

  const [rows] = await queryRunner.query(query, params);
  return rows.length > 0;
}

export async function resolveQuoteFolio({
  explicitFolio,
  queryRunner = pool,
  excludeQuoteId = null,
} = {}) {
  const normalizedExplicitFolio = normalizeQuoteFolio(explicitFolio);

  if (
    normalizedExplicitFolio &&
    !(await quoteFolioExists(normalizedExplicitFolio, queryRunner, excludeQuoteId))
  ) {
    return normalizedExplicitFolio;
  }

  for (let attempt = 0; attempt < QUOTE_FOLIO_RETRY_LIMIT; attempt += 1) {
    const candidate = generateQuoteFolioCandidate();
    if (!(await quoteFolioExists(candidate, queryRunner))) {
      return candidate;
    }
  }

  throw new Error("No se pudo generar un folio único de cotización.");
}
