import { softDeleteQuote } from "../../../repositories/quote.repository.js";

export async function deleteQuoteAction(id) {
  const affected = await softDeleteQuote({ quoteId: id });
  return affected > 0;
}
