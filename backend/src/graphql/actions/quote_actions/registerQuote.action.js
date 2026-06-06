import {
  findQuoteById,
  registerQuote,
} from "../../../repositories/quote.repository.js";

export async function registerQuoteAction(id) {
  const quote = await findQuoteById(id);
  if (!quote) {
    throw new Error("Cotización no encontrada");
  }

  if (quote.is_registered) {
    return quote;
  }

  const affected = await registerQuote(id);
  if (!affected) {
    throw new Error("No se pudo registrar la cotización");
  }

  return findQuoteById(id);
}
