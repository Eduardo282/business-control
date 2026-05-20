import { findQuoteItemsByQuoteId } from "../../../repositories/quote.repository.js";

export async function getQuoteItemsAction(quoteId) {
  return await findQuoteItemsByQuoteId(quoteId);
}
