import { listPortalQuotesByClientId } from "../../../repositories/quote.repository.js";

export const listPortalQuotesAction = async (client_id) => {
  return await listPortalQuotesByClientId(client_id);
};
