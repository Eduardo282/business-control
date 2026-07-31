import { useState } from "react";
import { sendQuoteEmailApi } from "../../../../actionsAPI/quotes.api";
import { notificationService } from "../../../../services/notificationService";
import { getQuoteFolio } from "./useQuotePdf";

export function useQuoteEmail(quote, _buildPdfFromSnapshot, onQuoteSent) {
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
    })}.\n\nQuedo a su disposición para agendar y revisar si es necesario
cualquier ajuste que considere necesario..\n\nSaludos,\n${
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
      const result = await sendQuoteEmailApi({
        quote_id: quote.id,
        contact_email: emailTo,
        message: emailMessage,
      });
      onQuoteSent?.(result);
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
      notificationService.error(
        "Sin correo de contacto",
        "Esta cotización no tiene un correo de contacto para envío."
      );
      return;
    }

    setSendingToContact(true);
    try {
      const totalWithTax = Number(quote?.total) || 0;
      const result = await sendQuoteEmailApi({
        quote_id: quote.id,
        contact_email: preferredContact.email,
        message: buildContactEmailMessage(preferredContact.full_name, totalWithTax),
      });
      onQuoteSent?.(result);
      notificationService.success(
        "Cotización enviada",
        `Cotización enviada correctamente a ${preferredContact.email}.`
      );
    } catch (e) {
      notificationService.error(
        "Error al enviar",
        e.message || "No se pudo enviar el correo al contacto."
      );
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
