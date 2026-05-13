import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import {
  getQuoteApi,
  sendQuoteEmailApi,
  toggleQuotePortalApi,
} from "../../actionsAPI/quotes.api";
import { Mail, Globe, ArrowLeft, Check, Printer, X } from "@icons";

function getQuoteFolio(sourceQuote) {
  const rawFolio = sourceQuote?.folio ? String(sourceQuote.folio).trim() : "";
  return rawFolio || `#${sourceQuote?.id ?? ""}`;
}

function getQuoteFileToken(sourceQuote) {
  const raw =
    sourceQuote?.folio ?
      String(sourceQuote.folio).trim()
    : String(sourceQuote?.id ?? "quote");
  const cleaned = raw.replace(/[^a-zA-Z0-9-_]+/g, "_");
  return cleaned || "quote";
}

let html2canvasLoaderPromise = null;

async function loadHtml2Canvas() {
  if (!html2canvasLoaderPromise) {
    html2canvasLoaderPromise = (async () => {
      try {
        const module = await import("html2canvas");
        return module.default || module;
      } catch {
        const fallbackModule = await import(
          /* @vite-ignore */ "/node_modules/html2canvas/dist/html2canvas.esm.js"
        );
        return fallbackModule.default || fallbackModule;
      }
    })().catch((error) => {
      html2canvasLoaderPromise = null;
      throw error;
    });
  }

  return html2canvasLoaderPromise;
}

function waitForStablePaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

export default function QuoteDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/portal");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal de correo
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [toggleLoading, setToggleLoading] = useState(false);
  const [sendingToContact, setSendingToContact] = useState(false);
  const [quickNotice, setQuickNotice] = useState(null);

  // Modal de portal
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [portalError, setPortalError] = useState("");
  const quotePreviewRef = useRef(null);

  const showSmallToast = (icon, title) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon,
      title,
      showConfirmButton: false,
      timer: 2300,
      timerProgressBar: true,
      width: 360,
      padding: "0.75rem 1rem",
    });
  };

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getQuoteApi(id);
      setQuote(data);
    } catch (e) {
      console.error(e);
      const msg =
        e.response?.data?.errors?.[0]?.message ||
        e.message ||
        "Error al cargar cotización";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getQuoteSnapshotCanvas = async () => {
    const node = quotePreviewRef.current;
    if (!node) throw new Error("No se pudo obtener la vista de la cotización.");

    await waitForStablePaint();

    const html2canvas = await loadHtml2Canvas();

    return html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
      scrollX: 0,
      scrollY: -window.scrollY,
      onclone: (clonedDocument) => {
        const clonedRoot = clonedDocument.querySelector(
          '[data-export-preview="quote"]',
        );

        if (clonedRoot) {
          clonedRoot.style.cssText += "opacity:1;filter:none;transform:none;animation:none;";
        }

        const animatedElements = clonedDocument.querySelectorAll(
          ".animate-fade-in, .animate-slide-up, .animate-scale-in",
        );

        animatedElements.forEach((element) => {
          element.style.cssText += "opacity:1;filter:none;transform:none;animation:none;transition:none;";
        });
      },
    });
  };

  const buildPdfFromSnapshot = async () => {
    const [canvas, jspdfModule] = await Promise.all([
      getQuoteSnapshotCanvas(),
      import("jspdf"),
    ]);
    const jsPDFCtor = jspdfModule.jsPDF || jspdfModule.default;

    // Obtener el ancho de un A4 estándar
    const tempDoc = new jsPDFCtor({ unit: "pt", format: "a4" });
    const pageWidth = tempDoc.internal.pageSize.getWidth();
    
    const margin = 16;
    const printableWidth = pageWidth - margin * 2;
    const imageHeight = (canvas.height * printableWidth) / canvas.width;
    const pageHeight = imageHeight + margin * 2;
    const imageData = canvas.toDataURL("image/png", 1.0);

    // Crear el documento con un alto personalizado para que no haya cortes
    const doc = new jsPDFCtor({ unit: "pt", format: [pageWidth, pageHeight] });

    doc.addImage(
      imageData,
      "PNG",
      margin,
      margin,
      printableWidth,
      imageHeight,
      undefined,
      "FAST",
    );

    const dataUri = doc.output("datauristring");
    const pdfBase64 = dataUri.split(",")[1] || "";
    return { doc, pdfBase64 };
  };

  const handlePrint = async () => {
    const quoteFileToken = getQuoteFileToken(quote);
    try {
      const { doc } = await buildPdfFromSnapshot();
      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const previewWindow = window.open(blobUrl, "_blank", "noopener");
      if (!previewWindow) {
        doc.save(`Cotizacion_${quoteFileToken}.pdf`);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      showSmallToast("success", "PDF exportado con la vista actual.");
    } catch (e) {
      showSmallToast("error", e?.message || "No se pudo exportar el PDF.");
    }
  };

  const openEmailModal = () => {
    const quoteFolio = getQuoteFolio(quote);
    const contactWithEmail =
      quote.contact?.email ?
        quote.contact
      : (quote.client?.contacts || []).find((contact) => contact.email);
    setEmailTo(contactWithEmail?.email || "");
    // Establecer un mensaje por defecto
    setEmailMessage(
      `Estimado cliente,\n\nAdjunto encontrará la cotización ${
        quoteFolio
      } por un total de $${Number(quote.total).toLocaleString(
        "es-MX",
        { minimumFractionDigits: 2 },
      )}.\n\nQuedo a la espera de sus comentarios.\n\nSaludos,\n${
        quote.user?.full_name || "Equipo de Ventas"
      }`,
    );
    setShowEmailModal(true);
    setEmailError("");
    setEmailSuccess("");
  };

  const handleTogglePortal = async () => {
    // Si actualmente está ENCENDIDO, apagarlo directamente
    if (quote.is_sent_to_client_portal) {
      await executeTogglePortal(false, null);
      return;
    }
    // Si se está encendiendo, mostrar el modal para seleccionar un contacto
    const contacts = quote.client?.contacts || [];
    const firstPortalEnabledContact = contacts.find((contact) =>
      Boolean(contact?.has_portal_access),
    );

    setSelectedContactId(firstPortalEnabledContact?.id || "");
    setShowPortalModal(true);
    setPortalError(
      firstPortalEnabledContact ? "" : (
        "No hay contactos con portal habilitado para enviar esta cotización."
      ),
    );
  };

  const confirmSendToPortal = async () => {
    if (!selectedContactId)
      return setPortalError("Debes seleccionar un contacto.");

    const selectedContact = (quote.client?.contacts || []).find(
      (contact) => String(contact.id) === String(selectedContactId),
    );

    if (!selectedContact?.has_portal_access) {
      return setPortalError(
        "El contacto seleccionado no tiene portal habilitado.",
      );
    }

    await executeTogglePortal(true, selectedContactId);

    if (selectedContact.email) {
      try {
        const totalWithTax = Number(quote.total) || 0;
        const { pdfBase64 } = await buildPdfFromSnapshot();
        await sendQuoteEmailApi({
          quote_id: quote.id,
          contact_email: selectedContact.email,
          message: buildContactEmailMessage(
            selectedContact.full_name,
            totalWithTax,
          ),
          pdf_base64: pdfBase64,
        });
        showSmallToast(
          "success",
          `Portal habilitado y cotización enviada a ${selectedContact.email}`,
        );
      } catch (e) {
        setQuickNotice({
          type: "error",
          message:
            e.message ||
            "Portal habilitado, pero no se pudo enviar el PDF al contacto.",
        });
      }
    }

    setShowPortalModal(false);
  };

  const executeTogglePortal = async (status, contactId) => {
    setToggleLoading(true);
    try {
      await toggleQuotePortalApi(quote.id, status, contactId);
      setQuote((prev) => ({ ...prev, is_sent_to_client_portal: status }));
    } catch (e) {
      alert("Error actualizando portal: " + e.message);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo)
      return setEmailError("Debes ingresar o seleccionar un correo");

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

  const buildContactEmailMessage = (contactName, totalWithTax) => {
    const quoteFolio = getQuoteFolio(quote);
    return `Estimado ${contactName || "cliente"},\n\nAdjunto encontrará la cotización ${
      quoteFolio
    } por un total de $${Number(totalWithTax || 0).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    })}.\n\nQuedo a la espera de sus comentarios.\n\nSaludos,\n${
      quote.user?.full_name || "Equipo de Ventas"
    }`;
  };

  const handleSendToQuoteContact = async () => {
    const preferredContact =
      quote.contact?.email ?
        quote.contact
      : (quote.client?.contacts || []).find((contact) => contact.email);

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
      const totalWithTax = Number(quote.total) || 0;
      const { pdfBase64 } = await buildPdfFromSnapshot();
      await sendQuoteEmailApi({
        quote_id: quote.id,
        contact_email: preferredContact.email,
        message: buildContactEmailMessage(
          preferredContact.full_name,
          totalWithTax,
        ),
        pdf_base64: pdfBase64,
      });
      showSmallToast(
        "success",
        `Cotización enviada a ${preferredContact.email}`,
      );
    } catch (e) {
      setQuickNotice({
        type: "error",
        message: e.message || "No se pudo enviar el correo al contacto.",
      });
    } finally {
      setSendingToContact(false);
    }
  };

  const handleExportWord = async () => {
    const quoteFileToken = getQuoteFileToken(quote);
    try {
      const escapeHtml = (value) =>
        String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const money = (value) =>
        `$${Number(value || 0).toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

      const percent = (value) =>
        `${Number(value || 0).toLocaleString("es-MX", {
          maximumFractionDigits: 2,
        })}%`;

      const roundAmount = (value) =>
        Math.round((Number(value) || 0) * 100) / 100;
      const localItems = Array.isArray(quote?.items) ? quote.items : [];
      const localGrossSubtotal = roundAmount(
        localItems.reduce((sum, item) => {
          const quantity = Number(item.quantity) || 0;
          const baseUnitPrice =
            Number(item.base_unit_price || item.unit_price || item.price) || 0;
          return sum + baseUnitPrice * quantity;
        }, 0),
      );
      const localNetSubtotal = roundAmount(
        Number(quote?.total) ||
          localItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
      );
      const localTotalDiscount = roundAmount(
        Math.max(0, localGrossSubtotal - localNetSubtotal),
      );
      const localIva = roundAmount(localNetSubtotal * 0.16);
      const localTotal = roundAmount(localNetSubtotal + localIva);

      const wordFolio = getQuoteFolio(quote);
      const wordDateLabel =
        quote?.created_at ?
          new Date(quote.created_at).toLocaleDateString("es-MX")
        : "";
      const wordValidityLabel = "15 dias naturales";

      const rowsHtml =
        localItems.length > 0 ?
          localItems
            .map((item, index) => {
              const quantity = Number(item.quantity) || 0;
              const baseUnitPrice =
                Number(item.base_unit_price || item.unit_price || item.price) ||
                0;
              const discount = Math.min(
                100,
                Math.max(0, Number(item.discount || 0)),
              );
              const discountedUnitPrice =
                Number(item.unit_price || item.price) || 0;
              const lineTotal =
                Number(item.total) || discountedUnitPrice * quantity;
              const lineBg = index % 2 === 0 ? "#ffffff" : "#f8fafc";
              const usersCount = Number(item.product?.users_count) || 0;
              const productMeta = [
                item.product?.description || item.product?.category || "",
                usersCount > 0 ? `${usersCount} Usuario(s)` : "",
              ]
                .filter(Boolean)
                .join(" | ");

              return `
                <tr style="background:${lineBg}; page-break-inside: avoid;">
                  <td style="padding:12px 12px; border-bottom:1px solid #e2e8f0; vertical-align:top;">
                    <div style="font-weight:700; color:#1e293b; font-size:14px;">${escapeHtml(item.product?.name || "Producto eliminado")}</div>
                    <div style="margin-top:4px; color:#64748b; font-size:11px; line-height:1.4;">${escapeHtml(productMeta)}</div>
                  </td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:center; vertical-align:top; color:#475569;">${escapeHtml(String(quantity))}</td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:#475569;">${escapeHtml(money(baseUnitPrice))}</td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:${discount > 0 ? "#be123c" : "#475569"};">${escapeHtml(percent(discount))}</td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:#475569;">${escapeHtml(money(discountedUnitPrice))}</td>
                  <td style="padding:12px 12px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:#0f172a; font-weight:700;">${escapeHtml(money(lineTotal))}</td>
                </tr>
              `;
            })
            .join("")
        : `<tr><td colspan="6" style="padding:14px; text-align:center; color:#64748b; border-bottom:1px solid #e2e8f0;">Sin partidas en la cotizacion</td></tr>`;

      const notesBlock =
        quote?.notes ?
          `<div class="notes-wrap">
             <div class="section-title">Notas Adicionales</div>
             <div class="notes-card">${escapeHtml(quote.notes).replace(/\n/g, "<br />")}</div>
           </div>`
        : "";

      const wordHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="UTF-8" />
            <meta name="ProgId" content="Word.Document" />
            <meta name="Generator" content="Microsoft Word 15" />
            <meta name="Originator" content="Microsoft Word 15" />
            <!--[if gte mso 9]>
            <xml>
              <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
                <w:DoNotOptimizeForBrowser/>
              </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
              @page {
                size: A4;
                margin: 1.2cm;
              }
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #0f172a;
              }
              .page {
                width: 100%;
                max-width: 980px;
                margin: 0 auto;
                border: 1px solid #e2e8f0;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              .card, .conditions, .finance, .sign-card, .metric-card, .notes-card {
                page-break-inside: avoid;
              }
              .top-strip {
                background: #1d4f88;
                color: #ffffff;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 9px 22px;
              }
              .top-strip table {
                width: 100%;
                border-collapse: collapse;
              }
              .top-strip td:last-child {
                text-align: right;
              }
              .main-block {
                padding: 28px 26px;
                border-bottom: 1px solid #e2e8f0;
              }
              .main-grid {
                width: 100%;
                border-collapse: collapse;
              }
              .main-grid td {
                vertical-align: top;
              }
              .title {
                font-size: 54px;
                line-height: 1;
                font-weight: 800;
                margin: 0;
                color: #0f172a;
                letter-spacing: -0.8px;
              }
              .subtitle {
                margin-top: 8px;
                color: #64748b;
                font-size: 20px;
                line-height: 1.35;
              }
              .brand {
                text-align: right;
              }
              .brand-name {
                font-size: 32px;
                font-weight: 800;
                color: #0f172a;
                margin: 0;
                line-height: 1.15;
              }
              .brand-meta {
                margin-top: 8px;
                color: #64748b;
                font-size: 13px;
                line-height: 1.5;
              }
              .metric-table {
                margin-top: 18px;
                width: 100%;
                border-collapse: separate;
                border-spacing: 8px 0;
                margin-left: -8px;
                margin-right: -8px;
              }
              .metric-card {
                border: 1px solid #e2e8f0;
                background: #f8fafc;
                border-radius: 12px;
                padding: 10px 14px;
              }
              .metric-label {
                margin: 0;
                font-size: 10px;
                color: #64748b;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.4px;
              }
              .metric-value {
                margin: 4px 0 0;
                font-size: 15px;
                color: #0f172a;
                font-weight: 700;
              }
              .info-wrap {
                padding: 20px 26px;
                border-bottom: 1px solid #e2e8f0;
                background: #f8fafc;
              }
              .info-grid {
                width: 100%;
                border-collapse: separate;
                border-spacing: 10px 0;
                margin-left: -10px;
                margin-right: -10px;
              }
              .card {
                border: 1px solid #e2e8f0;
                background: #ffffff;
                border-radius: 14px;
                padding: 15px;
              }
              .section-title {
                margin: 0 0 8px;
                font-size: 11px;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 700;
              }
              .client-name {
                margin: 0;
                font-size: 24px;
                font-weight: 800;
                color: #0f172a;
                line-height: 1.2;
              }
              .meta-text {
                margin-top: 5px;
                color: #475569;
                font-size: 12px;
                line-height: 1.45;
              }
              .small-muted {
                margin-top: 4px;
                color: #64748b;
                font-size: 11px;
              }
              .items-wrap {
                padding: 18px 26px;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
              }
              .items-table th {
                background: #0f172a;
                color: #ffffff;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.35px;
                font-weight: 700;
                padding: 10px;
                text-align: left;
              }
              .items-table th.center,
              .items-table td.center {
                text-align: center;
              }
              .items-table th.right,
              .items-table td.right {
                text-align: right;
              }
              .summary-wrap {
                padding: 4px 26px 18px;
              }
              .summary-grid {
                width: 100%;
                border-collapse: separate;
                border-spacing: 10px 0;
                margin-left: -10px;
                margin-right: -10px;
              }
              .conditions {
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                background: #f8fafc;
                padding: 14px;
              }
              .conditions ul {
                margin: 0;
                padding-left: 16px;
                color: #475569;
                font-size: 12px;
                line-height: 1.55;
              }
              .finance {
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                background: #ffffff;
                padding: 14px;
              }
              .totals-table {
                width: 100%;
                border-collapse: collapse;
              }
              .totals-table td {
                padding: 3px 0;
                font-size: 12px;
                color: #475569;
              }
              .totals-table td:last-child {
                text-align: right;
                color: #0f172a;
                font-weight: 600;
              }
              .totals-final td {
                border-top: 1px solid #0f172a;
                padding-top: 9px;
                font-size: 18px;
                font-weight: 800;
                color: #0f172a;
              }
              .notes-wrap {
                padding: 0 26px 18px;
              }
              .notes-card {
                border: 1px solid #e2e8f0;
                background: #f8fafc;
                border-radius: 12px;
                padding: 12px;
                color: #475569;
                font-size: 12px;
                line-height: 1.5;
              }
              .sign-wrap {
                padding: 0 26px 18px;
              }
              .sign-grid {
                width: 100%;
                border-collapse: separate;
                border-spacing: 10px 0;
                margin-left: -10px;
                margin-right: -10px;
              }
              .sign-card {
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                background: #ffffff;
                padding: 12px;
              }
              .line-space {
                margin-top: 28px;
                border-top: 1px solid #94a3b8;
                padding-top: 6px;
                font-size: 11px;
                color: #64748b;
              }
              .footer {
                background: #0f172a;
                color: #ffffff;
                padding: 20px 26px;
              }
              .footer-grid {
                width: 100%;
                border-collapse: collapse;
              }
              .footer-title {
                margin: 0 0 5px;
                font-size: 11px;
                text-transform: uppercase;
                color: #34d399;
                font-weight: 700;
              }
              .footer-copy {
                color: #94a3b8;
                font-size: 11px;
                line-height: 1.45;
              }
              .footer-note {
                text-align: right;
                color: #94a3b8;
                font-size: 11px;
                line-height: 1.45;
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="top-strip">
                <table>
                  <tr>
                    <td>Business Control | Documento Comercial</td>
                  </tr>
                </table>
              </div>

              <div class="main-block">
                <table class="main-grid">
                  <tr>
                    <td style="width:62%; padding-right:10px;">
                      <h1 class="title">COTIZACION</h1>
                      <div class="subtitle">Propuesta comercial formal para revision y aprobacion.</div>
                    </td>
                    <td style="width:38%;">
                      <div class="brand">
                        <h2 class="brand-name">Business Control</h2>
                        <div class="brand-meta">
                          Av. Vallarta #1234, Col. Americana<br />
                          Guadalajara, Jalisco, CP 44100<br />
                          ventas@businesscontrol.com
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>

                <table class="metric-table">
                  <tr>
                    <td style="width:33.33%;">
                      <div class="metric-card">
                        <p class="metric-label">Folio</p>
                        <p class="metric-value">${escapeHtml(wordFolio)}</p>
                      </div>
                    </td>
                    <td style="width:33.33%;">
                      <div class="metric-card">
                        <p class="metric-label">Fecha de Emision</p>
                        <p class="metric-value">${escapeHtml(wordDateLabel)}</p>
                      </div>
                    </td>
                    <td style="width:33.33%;">
                      <div class="metric-card">
                        <p class="metric-label">Vigencia</p>
                        <p class="metric-value">${escapeHtml(wordValidityLabel)}</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <div class="info-wrap">
                <table class="info-grid">
                  <tr>
                    <td style="width:66.6%; vertical-align:top;">
                      <div class="card">
                        <p class="section-title">Cliente asignado</p>
                        <p class="client-name">${escapeHtml(quote.client?.business_name || "Cliente eliminado")}</p>
                        <div class="meta-text">${escapeHtml(quote.client?.address || "Domicilio no registrado")}</div>
                        <div class="small-muted">RFC: ${escapeHtml(quote.client?.rfc || "XAXX010101000")}</div>

                        <div style="margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0;">
                          <p class="section-title" style="margin-bottom:6px;">Contacto asignado</p>
                          <div class="meta-text" style="margin-top:0;">
                            <strong>${escapeHtml(quote.contact?.full_name || "Sin contacto asignado")}</strong><br />
                            ${escapeHtml(quote.contact?.position_title || "Sin puesto")}<br />
                            ${escapeHtml(quote.contact?.email || "Sin correo")}<br />
                            ${escapeHtml(quote.contact?.phone || "Sin telefono")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style="width:33.4%; vertical-align:top;">
                      <div class="card">
                        <p class="section-title">Ejecutivo de Ventas</p>
                        <div class="meta-text" style="margin-top:0;">
                          <strong>${escapeHtml(quote.user?.full_name || "Usuario eliminado")}</strong><br />
                          ${escapeHtml(quote.user?.email || "Sin correo")}
                        </div>
                        <div class="small-muted" style="margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0; line-height:1.45;">
                          Canal: Atencion comercial directa<br />
                          Moneda: MXN<br />
                          Impuesto aplicado: IVA 16%
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <div class="items-wrap">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="width:40%;">Descripcion / Producto</th>
                      <th class="center" style="width:10%;">Cant</th>
                      <th class="right" style="width:13%;">Precio Lista</th>
                      <th class="right" style="width:10%;">Desc.</th>
                      <th class="right" style="width:13%;">Precio Unit.</th>
                      <th class="right" style="width:14%;">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>

              <div class="summary-wrap">
                <table class="summary-grid">
                  <tr>
                    <td style="width:64%; vertical-align:top;">
                      <div class="conditions">
                        <p class="section-title">Condiciones Comerciales</p>
                        <ul>
                          <li>Esta propuesta tiene una vigencia de ${escapeHtml(wordValidityLabel)}.</li>
                          <li>Los precios se expresan en MXN e incluyen descuentos aplicados por partida.</li>
                          <li>El tiempo de entrega queda sujeto a disponibilidad y confirmacion de inventario.</li>
                          <li>Cualquier ajuste posterior debera formalizarse mediante actualizacion de cotizacion.</li>
                        </ul>
                      </div>
                    </td>
                    <td style="width:36%; vertical-align:top;">
                      <div class="finance">
                        <p class="section-title">Resumen Financiero</p>
                        <table class="totals-table">
                          <tr><td>Subtotal bruto</td><td>${escapeHtml(money(localGrossSubtotal))}</td></tr>
                          <tr><td>Descuento</td><td>-${escapeHtml(money(localTotalDiscount))}</td></tr>
                          <tr><td>Subtotal neto</td><td>${escapeHtml(money(localNetSubtotal))}</td></tr>
                          <tr><td>IVA (16%)</td><td>${escapeHtml(money(localIva))}</td></tr>
                          <tr class="totals-final"><td>Total Neto</td><td>${escapeHtml(money(localTotal))}</td></tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              ${notesBlock}

              <div class="sign-wrap">
                <table class="sign-grid">
                  <tr>
                    <td style="width:50%; vertical-align:top;">
                      <div class="sign-card">
                        <p class="section-title">Aceptacion del Cliente</p>
                        <div class="line-space">Nombre y firma</div>
                      </div>
                    </td>
                    <td style="width:50%; vertical-align:top;">
                      <div class="sign-card">
                        <p class="section-title">Ejecutivo Responsable</p>
                        <div class="line-space">${escapeHtml(quote.user?.full_name || "Sin asignar")}</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <div class="footer" style="background-color: #0f172a; background: #0f172a;">
                <table class="footer-grid" style="background-color: #0f172a; width: 100%;">
                  <tr>
                    <td style="width:60%; vertical-align:top; border: none; padding-right:10px; background-color: #0f172a;" bgcolor="#0f172a">
                      <p class="footer-title" style="color: #34d399;">Informacion de Pago</p>
                      <div class="footer-copy" style="color: #94a3b8;">
                        Banco: BBVA Bancomer<br />
                        Cuenta: 0123456789<br />
                        CLABE: 012000001234567890<br />
                        Beneficiario: Business Control S.A. de C.V.
                      </div>
                    </td>
                    <td style="width:40%; vertical-align:top; border: none; background-color: #0f172a;" bgcolor="#0f172a">
                      <div class="footer-note" style="color: #94a3b8;">
                        * Precios sujetos a cambio sin previo aviso.<br />
                        * Tiempo de entrega sujeto a disponibilidad.
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob(["\ufeff", wordHtml], {
        type: "application/msword;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Cotizacion_${quoteFileToken}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSmallToast("success", "Word exportado correctamente.");
    } catch (e) {
      showSmallToast("error", e?.message || "No se pudo exportar Word.");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-light-text-secondary dark:text-zinc-400">
        Cargando cotización...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-light-text-secondary dark:text-red-400 bg-light-error/10 dark:bg-red-500/10 rounded-xl m-4">
        {error}
      </div>
    );
  if (!quote)
    return (
      <div className="p-8 text-center text-light-text-secondary dark:text-zinc-400">
        Cotización no encontrada
      </div>
    );

  const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;
  const quoteItems = Array.isArray(quote.items) ? quote.items : [];
  const grossSubtotal = roundMoney(
    quoteItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const baseUnitPrice =
        Number(item.base_unit_price || item.unit_price || item.price) || 0;
      return sum + baseUnitPrice * quantity;
    }, 0),
  );
  const netSubtotal = roundMoney(
    quoteItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
  );
  const totalDiscount = roundMoney(Math.max(0, grossSubtotal - netSubtotal));
  const ivaAmount = roundMoney(netSubtotal * 0.16);
  const totalNeto = roundMoney(netSubtotal + ivaAmount);
  const quoteFolio = getQuoteFolio(quote);
  const quoteDateLabel = new Date(quote.created_at).toLocaleDateString("es-MX");
  const quoteValidityLabel = "15 días naturales";
  const preferredContact =
    quote.contact?.email ?
      quote.contact
    : (quote.client?.contacts || []).find((contact) => contact.email);
  const preferredContactEmail = preferredContact?.email || "";
  const clientContacts = quote.client?.contacts || [];
  const selectedPortalContact = clientContacts.find(
    (contact) => String(contact.id) === String(selectedContactId),
  );
  const selectedPortalContactHasAccess = Boolean(
    selectedPortalContact?.has_portal_access,
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20 print:p-0 print:space-y-0 relative">
      {/* Fondo decorativo */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-900/20 to-transparent -z-10 blur-3xl rounded-full opacity-50 print:hidden" />

      {/* Modal de correo */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <Card className="w-full max-w-lg shadow-2xl shadow-primary-500/10 border-light-border dark:border-white/10 !bg-light-card dark:!bg-zinc-900/95">
            <h3 className="text-xl font-semibold text-light-text-primary dark:text-white mb-4 flex items-center gap-2">
              <span className="text-primary-600 dark:text-primary-400">
                <Mail size={24} />
              </span>{" "}
              Enviar por Correo
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="quote-contact-select" className="block text-xs font-medium text-light-text-secondary dark:text-zinc-400 mb-1">
                  Seleccionar contacto
                </label>
                <select
                  id="quote-contact-select"
                  className="w-full rounded-xl border border-light-border dark:border-white/10 bg-light-bg dark:bg-black/30 p-2 text-light-text-primary dark:text-zinc-200 outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                  onChange={(e) => setEmailTo(e.target.value)}
                  value={emailTo}>
                  <option value="">-- Seleccionar o Escribir abajo --</option>
                  {quote.client?.contacts?.map((contact) => (
                    <option key={contact.id} value={contact.email || ""}>
                      {contact.full_name} ({contact.email || "Sin correo"})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Correo destino"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="ej: cliente@empresa.com"
                className="bg-light-bg dark:bg-black/30 border-light-border dark:border-white/10 text-light-text-primary dark:text-zinc-200"
              />

              <div className="space-y-1">
                <label htmlFor="quote-email-message" className="block text-xs font-medium text-light-text-secondary dark:text-zinc-400">
                  Mensaje
                </label>
                <textarea
                  id="quote-email-message"
                  className="w-full rounded-xl border border-light-border dark:border-white/10 bg-light-bg dark:bg-black/30 p-3 text-sm text-light-text-primary dark:text-zinc-200 h-32 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                />
              </div>

              {emailError && (
                <div className="p-3 rounded-xl bg-light-error/10 dark:bg-red-500/10 text-light-error dark:text-red-300 text-xs border border-light-error/20 dark:border-red-500/20">
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs border border-emerald-500/20">
                  {emailSuccess}
                </div>
              )}

              <p className="text-[10px] text-light-text-secondary dark:text-zinc-500 text-center">
                * Verificación activa con ZeroBounce antes de envío.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowEmailModal(false)}
                  disabled={sendingEmail}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="shadow-lg shadow-primary-500/20 button-primary">
                  {sendingEmail ? "Enviando…" : "Enviar Correo"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de contacto del portal */}
      {showPortalModal &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in">
            <button
              type="button"
              aria-label="Cerrar modal"
              onClick={() => !toggleLoading && setShowPortalModal(false)}
              className="absolute inset-0 bg-zinc-900/45 backdrop-blur-[2px]"
            />

            <Card className="relative w-full max-w-lg overflow-hidden !bg-white border border-zinc-200 shadow-2xl shadow-zinc-900/20">
              <div className="px-6 py-5 border-b border-zinc-100 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-[#1B4733]/10 text-[#1B4733] inline-flex items-center justify-center shrink-0">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-zinc-900 leading-none">
                      Enviar a Portal
                    </h3>
                    <p className="text-sm text-zinc-600 mt-2 max-w-sm leading-relaxed">
                      Selecciona el contacto que recibira acceso a esta
                      cotizacion en su portal.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPortalModal(false)}
                  disabled={toggleLoading}
                  className="size-8 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 bg-white">
                <div>
                  <label htmlFor="portal-contact-select" className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">
                    Seleccionar contacto
                  </label>
                  <select
                    id="portal-contact-select"
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50/80 px-3 py-2.5 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-[#1B4733]/20 focus:border-[#1B4733] transition-colors"
                    onChange={(e) => {
                      setSelectedContactId(e.target.value);
                      setPortalError("");
                    }}
                    value={selectedContactId}>
                    <option value="">-- Seleccionar --</option>
                    {clientContacts.map((contact) => (
                      <option
                        key={contact.id}
                        value={contact.id}
                        disabled={!contact.has_portal_access}>
                        {contact.full_name} ({contact.email || "Sin correo"})
                        {!contact.has_portal_access ?
                          " - portal no habilitado"
                        : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-zinc-500 mt-1.5">
                    Solo se puede enviar a contactos con portal habilitado.
                  </p>
                </div>

                {portalError && (
                  <div className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                    {portalError}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/80 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowPortalModal(false)}
                  disabled={toggleLoading}
                  className="!bg-white !border !border-zinc-200 !text-zinc-700 hover:!bg-zinc-100 disabled:!opacity-50">
                  Cancelar
                </Button>
                <button
                  onClick={confirmSendToPortal}
                  disabled={toggleLoading || !selectedPortalContactHasAccess}
                  className="!bg-[#2B7FBE] hover:!bg-[#236EA8] !text-white !rounded-2xl !px-6 !py-2.5 shadow-[0_7px_14px_rgba(43,127,190,0.32)] hover:shadow-[0_9px_18px_rgba(43,127,190,0.38)] !transition-all !duration-150 disabled:!opacity-50 disabled:!cursor-not-allowed">
                  {toggleLoading ? "Enviando…" : "Confirmar y Enviar"}
                </button>
              </div>
            </Card>
          </div>,
          document.body,
        )}

      {/* Barra de acciones */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden sticky top-6 z-40 backdrop-blur-xl shadow-xl">
        <div>
          <Link
            to={isPortal ? "/portal/quotes" : "/cotizaciones/historial"}
            className="text-xs font-medium text-light-text-secondary hover:text-light-text-primary flex items-center gap-1 transition-colors group">
            <span className="group-hover:-translate-x-1 transition-transform">
              <ArrowLeft size={16} />
            </span>{" "}
            Volver al historial
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl font-semibold text-light-text-primary">
              Cotización {quoteFolio}
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${
                quote.status === "PENDING" ? "text-yellow-500"
                : quote.status === "ACCEPTED" ? "text-emerald-400"
                : "text-zinc-500"
              }`}>
              {quote.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end">
          {!isPortal && (
            <Button
              variant="ghost"
              onClick={handleSendToQuoteContact}
              disabled={sendingToContact || !preferredContactEmail}
              className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !border !border-[#1B4733]/30 !text-light-text-secondary !transition-all !duration-150 disabled:!opacity-50 disabled:!cursor-not-allowed disabled:!bg-white disabled:!text-emerald-700 disabled:!border-emerald-200 !flex !items-center !gap-2 !justify-center hover:!bg-[#1B4733]/15">
              <Mail size={16} />
              {sendingToContact ? "Enviando…" : "Enviar al contacto"}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handlePrint}
            className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !bg-white !border !border-red-200 !text-red-600 hover:!bg-red-50 !shadow-none !transition-colors !duration-150 !flex !items-center !gap-1.5 !justify-center">
            <Printer size={16} /> Exportar a PDF
          </Button>
          <Button
            variant="ghost"
            onClick={handleExportWord}
            className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !bg-white !border !border-[#315A9B]/35 !text-[#315A9B] hover:!bg-[#315A9B]/10 !shadow-none !transition-colors !duration-150 !flex !items-center !gap-1.5 !justify-center">
            Exportar a Word
          </Button>
        </div>
      </div>

      {quickNotice && (
        <div
          className={`print:hidden px-4 py-3 rounded-xl border text-sm ${
            quickNotice.type === "success" ?
              "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300"
            : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-300"
          }`}>
          {quickNotice.message}
        </div>
      )}

      {/* Vista previa del documento */}
      <div
        data-export-preview="quote"
        ref={quotePreviewRef}
        className="mx-auto max-w-5xl bg-white text-zinc-900 shadow-2xl print:shadow-none print:w-full print:m-0 animate-slide-up origin-top border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#0f274d] via-[#154982] to-[#1d6fb3] text-white px-8 md:px-12 py-3 flex items-center justify-between text-xs tracking-wide uppercase font-semibold print:bg-white print:text-zinc-900 print:border-b print:border-zinc-200">
          <span>Business Control | Documento Comercial</span>
        </div>

        <div className="p-8 md:p-12 border-b border-zinc-100">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <h1 className="text-4xl font-semibold text-zinc-900 tracking-tight">
                COTIZACIÓN
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Propuesta comercial formal para revisión y aprobación.
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                Business Control
              </div>
              <div className="text-sm text-zinc-500 mt-2 leading-relaxed">
                Av. Vallarta #1234, Col. Americana
                <br />
                Guadalajara, Jalisco, CP 44100
                <br />
                ventas@businesscontrol.com
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                Folio
              </p>
              <p className="text-sm font-mono font-bold text-zinc-900 mt-1">
                {quoteFolio}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                Fecha de Emisión
              </p>
              <p className="text-sm font-semibold text-zinc-900 mt-1">
                {quoteDateLabel}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                Vigencia
              </p>
              <p className="text-sm font-semibold text-zinc-900 mt-1">
                {quoteValidityLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 md:px-12 py-8 bg-zinc-50/60 border-b border-zinc-100">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                Cliente asignado
              </h3>
              <div className="font-bold text-xl text-zinc-900 leading-tight">
                {quote.client?.business_name || "Cliente eliminado"}
              </div>
              <div className="text-zinc-600 text-sm mt-2 space-y-1">
                <div>{quote.client?.address || "Domicilio no registrado"}</div>
                <div className="font-mono text-xs text-zinc-500">
                  RFC: {quote.client?.rfc || "XAXX010101000"}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-200">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Contacto asignado
                </h4>
                {quote.contact ?
                  <div className="text-zinc-600 text-sm space-y-1">
                    <div className="font-semibold text-zinc-900">
                      {quote.contact.full_name}
                    </div>
                    <div>{quote.contact.position_title || "Sin puesto"}</div>
                    <div>{quote.contact.email || "Sin correo"}</div>
                    <div>{quote.contact.phone || "Sin teléfono"}</div>
                  </div>
                : <div className="text-zinc-500 text-sm">
                    Sin contacto asignado
                  </div>
                }
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                Ejecutivo de Ventas
              </h3>
              <div className="font-bold text-zinc-900 text-lg">
                {quote.user?.full_name || "Usuario eliminado"}
              </div>
              <div className="text-zinc-600 text-sm mt-1">
                {quote.user?.email || "Sin correo"}
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-200 text-xs text-zinc-500 space-y-1">
                <div>Canal: Atención comercial directa</div>
                <div>Moneda: MXN</div>
                <div>Impuesto aplicado: IVA 16%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 md:px-12 py-8 min-h-[280px]">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-zinc-900 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-6 bg-zinc-900 text-white rounded-l-lg">
                  Descripción / Producto
                </th>
                <th className="py-3 px-4 text-center bg-zinc-900 text-white">
                  Cant
                </th>
                <th className="py-3 px-4 text-right bg-zinc-900 text-white">
                  Precio Lista
                </th>
                <th className="py-3 px-4 text-right bg-zinc-900 text-white">
                  Desc.
                </th>
                <th className="py-3 px-4 text-right bg-zinc-900 text-white">
                  Precio Unit.
                </th>
                <th className="py-3 px-6 text-right bg-zinc-900 text-white rounded-r-lg">
                  Importe
                </th>
              </tr>
            </thead>
            <tbody>
              {quoteItems.map((item, index) => {
                const quantity = Number(item.quantity) || 0;
                const baseUnitPrice =
                  Number(
                    item.base_unit_price || item.unit_price || item.price,
                  ) || 0;
                const discount = Math.min(
                  100,
                  Math.max(0, Number(item.discount || 0)),
                );
                const discountedUnitPrice =
                  Number(item.unit_price || item.price) || 0;
                const lineTotal =
                  Number(item.total) || discountedUnitPrice * quantity;

                return (
                  <tr
                    key={item.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-zinc-50/70"
                    } border-b border-zinc-100`}>
                    <td className="py-4 pl-6 pr-4 align-top">
                      <div className="font-bold text-zinc-800 text-base leading-tight">
                        {item.product?.name || "Producto eliminado"}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        {item.product?.description || item.product?.category}
                        {item.product?.users_count > 0 && (
                          <span className="ml-2 inline-block text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-200">
                            {item.product?.users_count} Usuario(s)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-zinc-600 align-top font-mono">
                      {quantity}
                    </td>
                    <td className="py-4 px-4 text-right text-zinc-600 align-top font-mono">
                      $
                      {baseUnitPrice.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={`py-4 px-4 text-right align-top font-mono ${
                        discount > 0 ? "text-rose-600" : "text-zinc-600"
                      }`}>
                      {discount.toLocaleString("es-MX", {
                        maximumFractionDigits: 2,
                      })}
                      %
                    </td>
                    <td className="py-4 px-4 text-right text-zinc-600 align-top font-mono">
                      $
                      {discountedUnitPrice.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right font-bold text-zinc-900 align-top font-mono">
                      $
                      {lineTotal.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-8 md:px-12 pb-8 grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              Condiciones Comerciales
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li>
                1. Esta propuesta tiene una vigencia de {quoteValidityLabel}.
              </li>
              <li>
                2. Los precios se expresan en MXN e incluyen descuentos
                aplicados por partida.
              </li>
              <li>
                3. El tiempo de entrega queda sujeto a disponibilidad y
                confirmación de inventario.
              </li>
              <li>
                4. Cualquier ajuste posterior deberá formalizarse mediante
                actualización de cotización.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">
              Resumen Financiero
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-zinc-500 text-sm">
                <span>Subtotal bruto</span>
                <span className="font-mono text-zinc-900">
                  $
                  {grossSubtotal.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500 text-sm">
                <span>Descuento</span>
                <span className="font-mono text-rose-600">
                  -$
                  {totalDiscount.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500 text-sm">
                <span>Subtotal neto</span>
                <span className="font-mono text-zinc-900">
                  $
                  {netSubtotal.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500 text-sm">
                <span>IVA (16%)</span>
                <span className="font-mono text-zinc-900">
                  $
                  {ivaAmount.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-end border-t border-zinc-900 pt-3 mt-3">
                <span className="font-bold text-zinc-900 text-lg">
                  Total Neto
                </span>
                <span className="font-bold font-mono text-zinc-900 text-2xl">
                  $
                  {totalNeto.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="px-8 md:px-12 pb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Notas Adicionales
            </h4>
            <div className="bg-zinc-50 p-4 rounded-xl text-sm text-zinc-600 italic border border-zinc-200">
              {quote.notes}
            </div>
          </div>
        )}

        <div className="px-8 md:px-12 pb-8 grid md:grid-cols-2 gap-6 text-sm text-zinc-600">
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-8">
              Aceptación del Cliente
            </p>
            <div className="border-t border-zinc-400 pt-2 text-xs text-zinc-500">
              Nombre y firma
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-8">
              Ejecutivo Responsable
            </p>
            <div className="border-t border-zinc-400 pt-2 text-xs text-zinc-500">
              {quote.user?.full_name || "Sin asignar"}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 text-white p-8 md:p-12 text-xs border-t border-zinc-100 print:bg-white print:text-black print:border-t-2 print:border-black">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
              <h4 className="font-bold mb-1 uppercase text-emerald-400 print:text-black">
                Información de Pago
              </h4>
              <p className="leading-relaxed text-zinc-400 print:text-zinc-600">
                Banco: BBVA Bancomer
                <br />
                Cuenta: 0123456789
                <br />
                CLABE: 012000001234567890
                <br />
                Beneficiario: Business Control S.A. de C.V.
              </p>
            </div>
            <div className="text-right">
              <p className="max-w-xs leading-relaxed text-zinc-500 print:text-zinc-600">
                * Precios sujetos a cambio sin previo aviso.
                <br />* Tiempo de entrega sujeto a disponibilidad.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800 flex justify-between items-center text-zinc-600 print:border-zinc-200">
            <div>Business Control System</div>
          </div>
        </div>
      </div>
    </div>
  );
}
