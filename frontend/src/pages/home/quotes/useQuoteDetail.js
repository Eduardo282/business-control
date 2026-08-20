import { useState, useRef } from "react";
import { registerQuoteApi } from "../../../actionsAPI/quotes.api.js";
import { useQuoteStatus } from "./hooks/useQuoteStatus.js";
import { useQuotePdf, getQuoteFolio, getQuoteFileToken } from "./hooks/useQuotePdf.js";
import { useQuoteEmail } from "./hooks/useQuoteEmail.js";
import { getQuoteStatusAfterSend } from "../../../utils/quoteStatus.js";
import { notificationService } from "../../../services/notificationService.js";
import { useNotifications } from "../../../context/NotificationContext.jsx";

export { getQuoteFolio, getQuoteFileToken };

/**
 * Composed hook for Quote Detail page.
 * Orchestrates sub-hooks for loading, PDF generation, email sending, and portal configurations.
 * @param {string|number} id
 */
export function useQuoteDetail(id) {
  const quotePreviewRef = useRef(null);
  const [registeringQuote, setRegisteringQuote] = useState(false);
  const { refreshNotifications } = useNotifications();

  // 1. Status & Base Loading Hook
  const {
    quote,
    setQuote,
    loading,
    error,
    load,
  } = useQuoteStatus(id);

  // 2. PDF & Document Generation Hook
  const {
    handlePrint,
    handleExportWord,
    buildPdfFromSnapshot,
  } = useQuotePdf(quote, quotePreviewRef);

  // 3. Email Sending Hook
  const {
    showEmailModal,
    setShowEmailModal,
    sendingEmail,
    emailError,
    emailSuccess,
    sendingToContact,
    quickNotice,
    setQuickNotice,
    handleSendEmail,
    handleSendToQuoteContact,
  } = useQuoteEmail(quote, buildPdfFromSnapshot, (emailResult) => {
    setQuote((current) =>
      current
        ? {
            ...current,
            email_sent_at: emailResult?.email_sent_at || new Date().toISOString(),
            status: getQuoteStatusAfterSend(current.status),
          }
        : current,
    );
    refreshNotifications?.();
  });

  const handleRegisterQuote = async () => {
    if (!quote?.id || quote.is_registered) return;

    setRegisteringQuote(true);
    try {
      const updatedQuote = await registerQuoteApi(quote.id);
      setQuote((current) => ({
        ...current,
        ...updatedQuote,
        is_registered: true,
      }));
      refreshNotifications?.();
      notificationService.success(
        "Cotización enviada",
        "Cotización enviada correctamente."
      );
    } catch (error) {
      notificationService.error(
        "Error",
        error.message || "No se pudo registrar la cotización."
      );
    } finally {
      setRegisteringQuote(false);
    }
  };

  return {
    quote,
    loading,
    error,
    showEmailModal,
    setShowEmailModal,
    sendingEmail,
    emailError,
    emailSuccess,
    sendingToContact,
    registeringQuote,
    quickNotice,
    setQuickNotice,
    quotePreviewRef,
    load,
    handlePrint,
    handleSendEmail,
    handleSendToQuoteContact,
    handleRegisterQuote,
    handleExportWord,
  };
}
