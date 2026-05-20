import { useState } from "react";
import { sendQuoteEmailApi } from "../../../../actionsAPI/quotes.api";
import { notificationService } from "../../../../services/notificationService";
import { getQuoteFolio } from "./useQuotePdf";

export function useQuoteEmail(quote, buildPdfFromSnapshot) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const [sendingToContact, setSendingToContact] = useState(false);
  const [quickNotice, setQuickNotice] = useState(null);

  const buildContactEmailMessage = (contactName, totalWithTax) => {
    const quoteFolioLabel = getQuoteFolio(quote);
    return `Estimado ${contactName || "cliente"},\n\nAdjunto encontrará la cotización ${
      quoteFolioLabel
    } por un total de $${Number(totalWithTax || 0).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    })}.\n\nQuedo a la espera de sus comentarios.\n\nSaludos,\n${
      quote?.user?.full_name || "Equipo de Ventas"
    }`;
  };

  const handleSendEmail = async ({ emailTo, emailMessage }) => {
    if (!emailTo) {
      setEmailError("Debes ingresar o seleccionar un correo");
      return;
    }

    setSendingEmail(true);
    setEmailError("");
    setEmailSuccess("");

    try {
      const { pdfBase64 } = await buildPdfFromSnapshot();
      await sendQuoteEmailApi({
        quote_id: quote.id,
        contact_email: emailTo,
        message: emailMessage,
        pdf_base64: pdfBase64,
      });
      setEmailSuccess("Correo enviado correctamente.");
      setTimeout(() => setShowEmailModal(false), 2000);
    } catch (e) {
      setEmailError(e.message || "Error al enviar correo");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendToQuoteContact = async () => {
    const preferredContact =
      quote?.contact?.email ?
        quote.contact
      : (quote?.client?.contacts || []).find((c) => c.email);

    if (!preferredContact?.email) {
      setQuickNotice({
        type: "error",
        message: "Esta cotización no tiene un correo de contacto para envío.",
      });
      return;
    }

    setSendingToContact(true);
    setQuickNotice(null);
    try {
      const totalWithTax = Number(quote?.total) || 0;
      const { pdfBase64 } = await buildPdfFromSnapshot();
      await sendQuoteEmailApi({
        quote_id: quote.id,
        contact_email: preferredContact.email,
        message: buildContactEmailMessage(preferredContact.full_name, totalWithTax),
        pdf_base64: pdfBase64,
      });
      notificationService.toast({
        title: `Cotización enviada a ${preferredContact.email}`,
        icon: "success",
      });
    } catch (e) {
      setQuickNotice({
        type: "error",
        message: e.message || "No se pudo enviar el correo al contacto.",
      });
    } finally {
      setSendingToContact(false);
    }
  };

  return {
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
  };
}
