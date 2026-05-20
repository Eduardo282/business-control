import { updateQuotePortalStatus } from "../../../repositories/quote.repository.js";

export const toggleQuotePortalAction = async (id, access, contact_id) => {
  const affected = await updateQuotePortalStatus({
    quoteId: id,
    isSentToClientPortal: access ? 1 : 0,
    contactId: contact_id || null,
  });
  return affected > 0;
};
