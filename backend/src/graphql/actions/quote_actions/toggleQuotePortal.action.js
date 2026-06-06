import {
  findQuoteById,
  updateQuotePortalStatus,
} from "../../../repositories/quote.repository.js";

export const toggleQuotePortalAction = async (id, access, contact_id) => {
  const quote = await findQuoteById(id);
  if (!quote) {
    throw new Error("Cotización no encontrada");
  }

  if (access && !quote.is_registered) {
    throw new Error("Registra la cotización antes de enviarla al portal");
  }

  const affected = await updateQuotePortalStatus({
    quoteId: id,
    isSentToClientPortal: access ? 1 : 0,
    contactId: contact_id || null,
  });
  return affected > 0;
};
