import { useRef } from "react";
import { useQuoteStatus } from "./hooks/useQuoteStatus.js";
import { useQuotePdf, getQuoteFolio, getQuoteFileToken } from "./hooks/useQuotePdf.js";
import { useQuoteEmail } from "./hooks/useQuoteEmail.js";
import { useQuotePortal } from "./hooks/useQuotePortal.js";

export { getQuoteFolio, getQuoteFileToken };

/**
 * Composed hook for Quote Detail page.
 * Orchestrates sub-hooks for loading, PDF generation, email sending, and portal configurations.
 * @param {string|number} id
 * @param {boolean} isPortal
 */
export function useQuoteDetail(id, isPortal) {
  const quotePreviewRef = useRef(null);

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
    buildContactEmailMessage,
  } = useQuoteEmail(quote, buildPdfFromSnapshot);

  // 4. Portal Configuration Hook
  const {
    showPortalModal,
    setShowPortalModal,
    portalError,
    setPortalError,
    toggleLoading,
    handleTogglePortalTrigger,
    confirmSendToPortal,
  } = useQuotePortal(
    quote,
    setQuote,
    buildPdfFromSnapshot,
    buildContactEmailMessage,
    setQuickNotice
  );

  return {
    quote,
    loading,
    error,
    showEmailModal,
    setShowEmailModal,
    sendingEmail,
    emailError,
    emailSuccess,
    showPortalModal,
    setShowPortalModal,
    portalError,
    setPortalError,
    toggleLoading,
    sendingToContact,
    quickNotice,
    setQuickNotice,
    quotePreviewRef,
    load,
    handlePrint,
    handleSendEmail,
    handleTogglePortalTrigger,
    confirmSendToPortal,
    handleSendToQuoteContact,
    handleExportWord,
  };
}
