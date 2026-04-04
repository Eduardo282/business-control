import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
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

export default function QuoteDetail() {
  const { id } = useParams();
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

  const handlePrint = () => {
    window.print();
  };

  const openEmailModal = () => {
    const contactWithEmail =
      quote.contact?.email ?
        quote.contact
      : (quote.client?.contacts || []).find((contact) => contact.email);
    setEmailTo(contactWithEmail?.email || "");
    // Establecer un mensaje por defecto
    setEmailMessage(
      `Estimado cliente,\n\nAdjunto encontrará la cotización #${
        quote.id
      } por un total de $${(Number(quote.total) * 1.16).toLocaleString(
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
    setShowPortalModal(false);
  };

  const executeTogglePortal = async (status, contactId) => {
    setToggleLoading(true);
    try {
      await toggleQuotePortalApi(quote.id, status, contactId);
      setQuote({ ...quote, is_sent_to_client_portal: status });
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
      await sendQuoteEmailApi({
        quote_id: quote.id,
        contact_email: emailTo,
        message: emailMessage,
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
    return `Estimado ${contactName || "cliente"},\n\nAdjunto encontrará la cotización #${
      quote.id
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
      const totalWithTax = (Number(quote.total) || 0) * 1.16;
      await sendQuoteEmailApi({
        quote_id: quote.id,
        contact_email: preferredContact.email,
        message: buildContactEmailMessage(
          preferredContact.full_name,
          totalWithTax,
        ),
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

  const handleDownloadPdf = async () => {
    let jsPDFCtor;
    let autoTable;
    try {
      const [jspdfModule, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      jsPDFCtor = jspdfModule.jsPDF || jspdfModule.default;
      autoTable = autoTableModule.default || autoTableModule.autoTable;
    } catch (e) {
      showSmallToast("error", "No se pudieron cargar los módulos de PDF.");
      return;
    }

    const quoteItems = Array.isArray(quote.items) ? quote.items : [];
    const money = (value) =>
      `$${Number(value || 0).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const quoteGrossSubtotal = quoteItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const baseUnitPrice =
        Number(item.base_unit_price || item.unit_price || item.price) || 0;
      return sum + baseUnitPrice * quantity;
    }, 0);
    const quoteNetSubtotal =
      Number(quote.total) ||
      quoteItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const quoteDiscountTotal = Math.max(
      0,
      quoteGrossSubtotal - quoteNetSubtotal,
    );
    const quoteIva = quoteNetSubtotal * 0.16;
    const quoteTotal = quoteNetSubtotal + quoteIva;

    const doc = new jsPDFCtor({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const left = 40;
    const right = pageWidth - 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("COTIZACION", left, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Folio: #${quote.id}`, left, 78);
    doc.text(
      `Fecha: ${new Date(quote.created_at).toLocaleDateString("es-MX")}`,
      left,
      95,
    );
    doc.text("Vigencia: 15 dias naturales", left, 112);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Business Control", right, 52, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Av. Vallarta #1234, Col. Americana", right, 74, {
      align: "right",
    });
    doc.text("Guadalajara, Jalisco, CP 44100", right, 90, {
      align: "right",
    });
    doc.text("ventas@businesscontrol.com", right, 106, { align: "right" });

    doc.setDrawColor(220, 226, 236);
    doc.line(left, 126, right, 126);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(123, 139, 166);
    doc.text("CLIENTE", left, 150);
    doc.text("CONTACTO", left + 220, 150);
    doc.text("EJECUTIVO DE VENTAS", right, 150, { align: "right" });

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(quote.client?.business_name || "Cliente eliminado", left, 170);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(quote.client?.address || "Domicilio no registrado", left, 187);
    doc.text(`RFC: ${quote.client?.rfc || "XAXX010101000"}`, left, 203);

    const contactName = quote.contact?.full_name || "Sin contacto asignado";
    const contactRole = quote.contact?.position_title || "Sin puesto";
    const contactEmail = quote.contact?.email || "Sin correo";
    doc.text(contactName, left + 220, 170);
    doc.text(contactRole, left + 220, 187);
    doc.text(contactEmail, left + 220, 203);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(quote.user?.full_name || "Usuario eliminado", right, 170, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(quote.user?.email || "Sin correo", right, 187, {
      align: "right",
    });

    autoTable(doc, {
      startY: 224,
      head: [
        [
          "Producto",
          "Cant",
          "Precio Lista",
          "Desc. %",
          "Precio Unit.",
          "Importe",
        ],
      ],
      body: quoteItems.map((item) => {
        const quantity = Number(item.quantity) || 0;
        const baseUnitPrice =
          Number(item.base_unit_price || item.unit_price || item.price) || 0;
        const discount = Math.min(100, Math.max(0, Number(item.discount || 0)));
        const discountedUnitPrice = Number(item.unit_price || item.price) || 0;
        const lineTotal = Number(item.total) || discountedUnitPrice * quantity;
        return [
          item.product?.name || "Producto eliminado",
          String(quantity),
          money(baseUnitPrice),
          `${discount.toLocaleString("es-MX", { maximumFractionDigits: 2 })}%`,
          money(discountedUnitPrice),
          money(lineTotal),
        ];
      }),
      styles: {
        font: "helvetica",
        fontSize: 9,
        textColor: [51, 65, 85],
        cellPadding: 6,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
      },
    });

    const finalY = doc.lastAutoTable?.finalY || 260;
    const totalsStart = finalY + 20;
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Subtotal bruto: ${money(quoteGrossSubtotal)}`,
      right,
      totalsStart,
      {
        align: "right",
      },
    );
    doc.text(
      `Descuento: -${money(quoteDiscountTotal)}`,
      right,
      totalsStart + 16,
      { align: "right" },
    );
    doc.text(
      `Subtotal neto: ${money(quoteNetSubtotal)}`,
      right,
      totalsStart + 32,
      {
        align: "right",
      },
    );
    doc.text(`IVA (16%): ${money(quoteIva)}`, right, totalsStart + 48, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.text(`Total Neto: ${money(quoteTotal)}`, right, totalsStart + 72, {
      align: "right",
    });

    doc.save(`Cotizacion_${quote.id}.pdf`);
    showSmallToast("success", "PDF descargado correctamente.");
  };

  const handleExportWord = () => {
    const quoteItems = Array.isArray(quote.items) ? quote.items : [];
    const money = (value) =>
      `$${Number(value || 0).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const quoteGrossSubtotal = quoteItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const baseUnitPrice =
        Number(item.base_unit_price || item.unit_price || item.price) || 0;
      return sum + baseUnitPrice * quantity;
    }, 0);
    const quoteNetSubtotal =
      Number(quote.total) ||
      quoteItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const quoteDiscountTotal = Math.max(
      0,
      quoteGrossSubtotal - quoteNetSubtotal,
    );
    const quoteIva = quoteNetSubtotal * 0.16;
    const quoteTotal = quoteNetSubtotal + quoteIva;

    const rowsHtml = quoteItems
      .map((item) => {
        const quantity = Number(item.quantity) || 0;
        const baseUnitPrice =
          Number(item.base_unit_price || item.unit_price || item.price) || 0;
        const discount = Math.min(100, Math.max(0, Number(item.discount || 0)));
        const discountedUnitPrice = Number(item.unit_price || item.price) || 0;
        const lineTotal = Number(item.total) || discountedUnitPrice * quantity;

        return `<tr>
          <td>${item.product?.name || "Producto eliminado"}</td>
          <td style="text-align:right;">${quantity}</td>
          <td style="text-align:right;">${money(baseUnitPrice)}</td>
          <td style="text-align:right;">${discount.toLocaleString("es-MX", { maximumFractionDigits: 2 })}%</td>
          <td style="text-align:right;">${money(discountedUnitPrice)}</td>
          <td style="text-align:right;">${money(lineTotal)}</td>
        </tr>`;
      })
      .join("");

    const wordHtml = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Calibri, Arial, sans-serif; color: #0f172a; padding: 24px; }
            h1 { margin: 0 0 10px 0; }
            .meta { margin-bottom: 16px; color: #475569; }
            .grid { display: table; width: 100%; margin-bottom: 18px; }
            .col { display: table-cell; width: 33.33%; vertical-align: top; }
            .title { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
            th { background: #f1f5f9; text-align: left; }
            .totals { margin-top: 16px; width: 45%; margin-left: auto; }
            .totals td { border: none; padding: 3px 0; }
            .totals .label { color: #64748b; }
            .totals .value { text-align: right; font-family: Consolas, monospace; }
            .totals .strong { font-weight: bold; color: #0f172a; border-top: 1px solid #94a3b8; padding-top: 6px; }
          </style>
        </head>
        <body>
          <h1>COTIZACION</h1>
          <div class="meta">Folio: #${quote.id} | Fecha: ${new Date(quote.created_at).toLocaleDateString("es-MX")} | Vigencia: 15 dias naturales</div>

          <div class="grid">
            <div class="col">
              <div class="title">Cliente</div>
              <div><strong>${quote.client?.business_name || "Cliente eliminado"}</strong></div>
              <div>${quote.client?.address || "Domicilio no registrado"}</div>
              <div>RFC: ${quote.client?.rfc || "XAXX010101000"}</div>
            </div>
            <div class="col">
              <div class="title">Contacto</div>
              <div><strong>${quote.contact?.full_name || "Sin contacto asignado"}</strong></div>
              <div>${quote.contact?.position_title || "Sin puesto"}</div>
              <div>${quote.contact?.email || "Sin correo"}</div>
              <div>${quote.contact?.phone || "Sin telefono"}</div>
            </div>
            <div class="col" style="text-align:right;">
              <div class="title">Ejecutivo de Ventas</div>
              <div><strong>${quote.user?.full_name || "Usuario eliminado"}</strong></div>
              <div>${quote.user?.email || "Sin correo"}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align:right;">Cant</th>
                <th style="text-align:right;">Precio Lista</th>
                <th style="text-align:right;">Desc. %</th>
                <th style="text-align:right;">Precio Unit.</th>
                <th style="text-align:right;">Importe</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          <table class="totals">
            <tr><td class="label">Subtotal bruto</td><td class="value">${money(quoteGrossSubtotal)}</td></tr>
            <tr><td class="label">Descuento</td><td class="value">-${money(quoteDiscountTotal)}</td></tr>
            <tr><td class="label">Subtotal neto</td><td class="value">${money(quoteNetSubtotal)}</td></tr>
            <tr><td class="label">IVA (16%)</td><td class="value">${money(quoteIva)}</td></tr>
            <tr><td class="label strong">Total Neto</td><td class="value strong">${money(quoteTotal)}</td></tr>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", wordHtml], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cotizacion_${quote.id}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSmallToast("success", "Archivo Word exportado correctamente.");
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-light-text-secondary dark:text-slate-400">
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
      <div className="p-8 text-center text-light-text-secondary dark:text-slate-400">
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
    Number(quote.total) ||
      quoteItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
  );
  const totalDiscount = roundMoney(Math.max(0, grossSubtotal - netSubtotal));
  const ivaAmount = roundMoney(netSubtotal * 0.16);
  const totalNeto = roundMoney(netSubtotal + ivaAmount);
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
          <Card className="w-full max-w-lg shadow-2xl shadow-primary-500/10 border-light-border dark:border-white/10 !bg-light-card dark:!bg-slate-900/95">
            <h3 className="text-xl font-bold text-light-text-primary dark:text-white mb-4 flex items-center gap-2">
              <span className="text-primary-600 dark:text-primary-400">
                <Mail size={24} />
              </span>{" "}
              Enviar por Correo
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-light-text-secondary dark:text-slate-400 mb-1">
                  Seleccionar contacto
                </label>
                <select
                  className="w-full rounded-xl border border-light-border dark:border-white/10 bg-light-bg dark:bg-black/30 p-2 text-light-text-primary dark:text-slate-200 outline-none focus:ring-1 focus:ring-primary-500 text-sm"
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
                className="bg-light-bg dark:bg-black/30 border-light-border dark:border-white/10 text-light-text-primary dark:text-slate-200"
              />

              <div className="space-y-1">
                <label className="block text-xs font-medium text-light-text-secondary dark:text-slate-400">
                  Mensaje
                </label>
                <textarea
                  className="w-full rounded-xl border border-light-border dark:border-white/10 bg-light-bg dark:bg-black/30 p-3 text-sm text-light-text-primary dark:text-slate-200 h-32 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
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

              <p className="text-[10px] text-light-text-secondary dark:text-slate-500 text-center">
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
                  {sendingEmail ? "Enviando..." : "Enviar Correo"}
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
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            />

            <Card className="relative w-full max-w-lg overflow-hidden !bg-white border border-slate-200 shadow-2xl shadow-slate-900/20">
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1B4733]/10 text-[#1B4733] inline-flex items-center justify-center shrink-0">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-none">
                      Enviar a Portal
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 max-w-sm leading-relaxed">
                      Selecciona el contacto que recibira acceso a esta
                      cotizacion en su portal.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPortalModal(false)}
                  disabled={toggleLoading}
                  className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 bg-white">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    Seleccionar contacto
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#1B4733]/20 focus:border-[#1B4733] transition-colors"
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
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Solo se puede enviar a contactos con portal habilitado.
                  </p>
                </div>

                {portalError && (
                  <div className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                    {portalError}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowPortalModal(false)}
                  disabled={toggleLoading}
                  className="!bg-white !border !border-slate-200 !text-slate-700 hover:!bg-slate-100 disabled:!opacity-50">
                  Cancelar
                </Button>
                <button
                  onClick={confirmSendToPortal}
                  disabled={toggleLoading || !selectedPortalContactHasAccess}
                  className="!bg-[#2B7FBE] hover:!bg-[#236EA8] !text-white !rounded-2xl !px-6 !py-2.5 shadow-[0_7px_14px_rgba(43,127,190,0.32)] hover:shadow-[0_9px_18px_rgba(43,127,190,0.38)] !transition-all !duration-150 disabled:!opacity-50 disabled:!cursor-not-allowed">
                  {toggleLoading ? "Enviando..." : "Confirmar y Enviar"}
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
            to="/cotizaciones/historial"
            className="text-xs font-medium text-light-text-secondary hover:text-light-text-primary flex items-center gap-1 transition-colors group">
            <span className="group-hover:-translate-x-1 transition-transform">
              <ArrowLeft size={16} />
            </span>{" "}
            Volver al listado
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl font-bold text-light-text-primary">
              Cotización #{quote.id}
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${
                quote.status === "PENDING" ? "text-yellow-500"
                : quote.status === "ACCEPTED" ? "text-emerald-400"
                : "text-slate-500"
              }`}>
              {quote.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end">
          <Button
            variant="ghost"
            onClick={handleTogglePortal}
            disabled={toggleLoading}
            className={`flex-1 sm:flex-none transition-all border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              quote.is_sent_to_client_portal ?
                "!text-[#1B4733] hover:!text-[#1B4733] !bg-[#1B4733]/10 !border-[#1B4733]/30 hover:!bg-[#1B4733]/15"
              : "!bg-white !border-[#1B4733]/30 !text-[#1B4733] hover:!bg-[#1B4733]/10"
            }`}>
            {toggleLoading ?
              "..."
            : quote.is_sent_to_client_portal ?
              <span className="flex items-center gap-2">
                <Check size={16} /> En Portal
              </span>
            : <span className="flex items-center gap-2">
                <Globe size={16} /> Enviar a Portal
              </span>
            }
          </Button>

          <Button
            variant="ghost"
            onClick={handleSendToQuoteContact}
            disabled={sendingToContact || !preferredContactEmail}
            className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !border !border-[#1B4733]/30 !text-light-text-secondary !transition-all !duration-150 disabled:!opacity-50 disabled:!cursor-not-allowed disabled:!bg-white disabled:!text-emerald-700 disabled:!border-emerald-200 !flex !items-center !gap-2 !justify-center hover:!bg-[#1B4733]/15">
            <Mail size={16} />
            {sendingToContact ? "Enviando..." : "Enviar al contacto"}
          </Button>
          <Button
            variant="ghost"
            onClick={handleDownloadPdf}
            className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !bg-white !border !border-red-200 !text-red-600 hover:!bg-red-50 !shadow-none !transition-colors !duration-150 !flex !items-center !gap-1.5 !justify-center">
            Descargar PDF
          </Button>
          <Button
            variant="ghost"
            onClick={handlePrint}
            className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !bg-white !border !border-red-200 !text-red-600 hover:!bg-red-50 !shadow-none !transition-colors !duration-150 !flex !items-center !gap-1.5 !justify-center">
            <Printer size={16} /> Exportar PDF
          </Button>
          <Button
            variant="ghost"
            onClick={handleExportWord}
            className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !bg-white !border !border-[#315A9B]/35 !text-[#315A9B] hover:!bg-[#315A9B]/10 !shadow-none !transition-colors !duration-150 !flex !items-center !gap-1.5 !justify-center">
            Exportar Word
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
      <div className="mx-auto max-w-4xl bg-white text-slate-900 shadow-2xl print:shadow-none print:w-full print:m-0 animate-slide-up origin-top">
        {/* Encabezado */}
        <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between gap-8 border-b border-slate-100">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              COTIZACIÓN
            </h1>
            <div className="mt-4 space-y-1 text-sm text-slate-500">
              <div className="flex gap-2">
                <span className="font-semibold w-16">Folio:</span>{" "}
                <span className="font-mono text-slate-900">#{quote.id}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold w-16">Fecha:</span>{" "}
                <span>{new Date(quote.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold w-16">Vigencia:</span>{" "}
                <span>15 días naturales</span>
              </div>
            </div>
          </div>
          <div className="text-left md:text-right">
            <div className="text-2xl font-bold text-slate-900">
              Business Control
            </div>
            <div className="text-sm text-slate-500 mt-2 leading-relaxed">
              Av. Vallarta #1234, Col. Americana
              <br />
              Guadalajara, Jalisco, CP 44100
              <br />
              ventas@businesscontrol.com
            </div>
          </div>
        </div>

        {/* Cliente e información del usuario */}
        <div className="grid md:grid-cols-2 gap-12 p-8 md:p-12 bg-slate-50/50">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-200 pb-1">
              Cliente
            </h3>
            <div className="font-bold text-lg text-slate-900">
              {quote.client?.business_name || "Cliente Eliminado"}
            </div>
            <div className="text-slate-600 text-sm mt-2 space-y-1">
              <div>{quote.client?.address || "Domicilio no registrado"}</div>
              <div className="font-mono text-xs text-slate-500">
                RFC: {quote.client?.rfc || "XAXX010101000"}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Contacto
              </h4>
              {quote.contact ?
                <div className="text-slate-600 text-sm space-y-1">
                  <div className="font-semibold text-slate-900">
                    {quote.contact.full_name}
                  </div>
                  <div>{quote.contact.position_title || "Sin puesto"}</div>
                  <div>{quote.contact.email || "Sin correo"}</div>
                  <div>{quote.contact.phone || "Sin teléfono"}</div>
                </div>
              : <div className="text-slate-500 text-sm">
                  Sin contacto asignado
                </div>
              }
            </div>
          </div>
          <div className="md:text-right">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-200 pb-1">
              Ejecutivo de Ventas
            </h3>
            <div className="font-bold text-slate-900">
              {quote.user?.full_name || "Usuario Eliminado"}
            </div>
            <div className="text-slate-600 text-sm">{quote.user?.email}</div>
          </div>
        </div>

        {/* Tabla de items */}
        <div className="px-8 md:px-12 pb-8 min-h-[300px]">
          <table className="w-full text-left text-sm mt-8">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 pr-4">Descripción / Producto</th>
                <th className="py-3 px-4 text-center">Cant</th>
                <th className="py-3 px-4 text-right">Precio Lista</th>
                <th className="py-3 px-4 text-right">Desc.</th>
                <th className="py-3 px-4 text-right">Precio Unit.</th>
                <th className="py-3 pl-4 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quoteItems.map((item) => {
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
                  <tr key={item.id}>
                    <td className="py-4 pr-4 align-top">
                      <div className="font-bold text-slate-800 text-base">
                        {item.product?.name || "Producto Eliminado"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.product?.description || item.product?.category}
                        {item.product?.users_count > 0 && (
                          <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                            {item.product?.users_count} Usuario(s)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-600 align-top font-mono">
                      {quantity}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-600 align-top font-mono">
                      $
                      {baseUnitPrice.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={`py-4 px-4 text-right align-top font-mono ${
                        discount > 0 ? "text-rose-600" : "text-slate-600"
                      }`}>
                      {discount.toLocaleString("es-MX", {
                        maximumFractionDigits: 2,
                      })}
                      %
                    </td>
                    <td className="py-4 px-4 text-right text-slate-600 align-top font-mono">
                      $
                      {discountedUnitPrice.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-4 pl-4 text-right font-bold text-slate-900 align-top font-mono">
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

        {/* Totales */}
        <div className="px-8 md:px-12 pb-8 flex flex-col items-end">
          <div className="w-full md:w-1/2 lg:w-1/3 border-t border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between text-slate-500 text-sm">
              <span>Subtotal bruto</span>
              <span className="font-mono text-slate-900">
                $
                {grossSubtotal.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 text-sm">
              <span>Descuento</span>
              <span className="font-mono text-rose-600">
                -$
                {totalDiscount.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 text-sm">
              <span>Subtotal neto</span>
              <span className="font-mono text-slate-900">
                $
                {netSubtotal.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 text-sm">
              <span>IVA (16%)</span>
              <span className="font-mono text-slate-900">
                $
                {ivaAmount.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-end border-t border-slate-900 pt-3 mt-2">
              <span className="font-bold text-slate-900 text-lg">
                Total Neto
              </span>
              <span className="font-bold font-mono text-slate-900 text-xl">
                $
                {totalNeto.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Notas */}
        {quote.notes && (
          <div className="px-8 md:px-12 pb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Notas Adicionales
            </h4>
            <div className="bg-slate-50 p-4 rounded text-sm text-slate-600 italic border border-slate-100">
              {quote.notes}
            </div>
          </div>
        )}

        {/* Notas del pie de página */}
        <div className="bg-slate-900 text-white p-8 md:p-12 text-xs border-t border-slate-100 print:bg-white print:text-black print:border-t-2 print:border-black">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
              <h4 className="font-bold mb-1 uppercase text-emerald-400 print:text-black">
                Información de Pago
              </h4>
              <p className="leading-relaxed text-slate-400 print:text-slate-600">
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
              <p className="max-w-xs leading-relaxed text-slate-500 print:text-slate-600">
                * Precios sujetos a cambio sin previo aviso.
                <br />* Tiempo de entrega sujeto a disponibilidad.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 flex justify-between items-center text-slate-600 print:border-slate-200">
            <div>Generado por Business Control System</div>
            <div className="font-mono">Página 1/1</div>
          </div>
        </div>
      </div>
    </div>
  );
}
