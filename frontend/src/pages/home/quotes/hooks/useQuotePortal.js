import { useState } from "react";
import { toggleQuotePortalApi, sendQuoteEmailApi } from "../../../../actionsAPI/quotes.api";
import { notificationService } from "../../../../services/notificationService";

export function useQuotePortal(
  quote,
  setQuote,
  buildPdfFromSnapshot,
  buildContactEmailMessage,
  setQuickNotice
) {
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [portalError, setPortalError] = useState("");
  const [toggleLoading, setToggleLoading] = useState(false);

  const executeTogglePortal = async (status, contactId) => {
    setToggleLoading(true);
    try {
      await toggleQuotePortalApi(quote.id, status, contactId);
      setQuote((prev) => ({ ...prev, is_sent_to_client_portal: status }));
    } catch (e) {
      notificationService.error("Error", "Error actualizando portal: " + e.message);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleTogglePortalTrigger = async () => {
    if (quote.is_sent_to_client_portal) {
      await executeTogglePortal(false, null);
      return;
    }
    setShowPortalModal(true);
  };

  const confirmSendToPortal = async (contactId, contact) => {
    await executeTogglePortal(true, contactId);

    if (contact?.email) {
      try {
        const totalWithTax = Number(quote?.total) || 0;
        const { pdfBase64 } = await buildPdfFromSnapshot();
        await sendQuoteEmailApi({
          quote_id: quote.id,
          contact_email: contact.email,
          message: buildContactEmailMessage(contact.full_name, totalWithTax),
          pdf_base64: pdfBase64,
        });
        notificationService.toast({
          title: `Portal habilitado y cotización enviada a ${contact.email}`,
          icon: "success",
        });
      } catch (e) {
        setQuickNotice({
          type: "error",
          message: e.message || "Portal habilitado, pero no se pudo enviar el PDF al contacto.",
        });
      }
    }
    setShowPortalModal(false);
  };

  return {
    showPortalModal,
    setShowPortalModal,
    portalError,
    setPortalError,
    toggleLoading,
    executeTogglePortal,
    handleTogglePortalTrigger,
    confirmSendToPortal,
  };
}
