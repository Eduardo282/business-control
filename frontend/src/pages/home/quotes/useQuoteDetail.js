import { useState, useRef } from "react";
import { registerQuoteApi } from "../../../actionsAPI/quotes.api.js";
import { useQuoteStatus } from "./hooks/useQuoteStatus.js";
import { useQuotePdf, getQuoteFolio, getQuoteFileToken } from "./hooks/useQuotePdf.js";
import { useQuoteEmail } from "./hooks/useQuoteEmail.js";

export { getQuoteFolio, getQuoteFileToken };

/**
 * Composed hook for Quote Detail page.
 * Orchestrates sub-hooks for loading, PDF generation, email sending, and portal configurations.
 * @param {string|number} id
 * @param {boolean} isPortal
 */
export function useQuoteDetail(id, isPortal) {
  const quotePreviewRef = useRef(null);
  const [registeringQuote, setRegisteringQuote] = useState(false);

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
    setEmailError,
    emailSuccess,
    setEmailSuccess,
    sendingToContact,
    quickNotice,
    setQuickNotice,
    handleSendEmail,
    handleSendToQuoteContact,
  } = useQuoteEmail(quote, buildPdfFromSnapshot);

  const handleRegisterQuote = async () => {
    if (!quote?.id || quote.is_registered) return;

    setRegisteringQuote(true);
    setQuickNotice(null);
    try {
      const updatedQuote = await registerQuoteApi(quote.id);
      setQuote((current) => ({
        ...current,
        ...updatedQuote,
        is_registered: true,
      }));
      setQuickNotice({
        type: "success",
        message: "Cotización registrada correctamente.",
      });
    } catch (error) {
      setQuickNotice({
        type: "error",
        message: error.message || "No se pudo registrar la cotización.",
      });
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
