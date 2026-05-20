import {
  listAllNonRequestedQuotes,
  listQuotesByClientId,
  listQuotesByUserId,
} from "../../../repositories/quote.repository.js";

export const listQuotesAction = async () => {
  return await listAllNonRequestedQuotes();
};

export const listQuotesByClientAction = async (client_id) => {
  return await listQuotesByClientId(client_id);
};

export const listQuotesByUserAction = async (user_id) => {
  return await listQuotesByUserId(user_id);
};
