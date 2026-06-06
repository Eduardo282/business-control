import { listPortalQuotesByContact } from "../../../repositories/quote.repository.js";

export const listPortalQuotesAction = async (contactId) => {
  return await listPortalQuotesByContact(contactId);
};
