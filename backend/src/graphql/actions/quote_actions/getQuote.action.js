import { findQuoteById } from "../../../repositories/quote.repository.js";

export const getQuoteAction = async (id) => {
  return await findQuoteById(id);
};
