import { useParams, Link, useLocation } from "react-router-dom";
import Button from "../../components/ui/Button";
import { Mail, ArrowLeft, Printer, CheckCircle2 } from "@icons";
import { useQuoteDetail, getQuoteFolio } from "./quotes/useQuoteDetail";
import EmailQuoteModal from "./quotes/EmailQuoteModal";
import QuotePreview from "./quotes/QuotePreview";

export default function QuoteDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/portal");

  const {
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
    quotePreviewRef,
    load,
    handlePrint,
    handleSendEmail,
    handleSendToQuoteContact,
    handleRegisterQuote,
    handleExportWord,
  } = useQuoteDetail(id, isPortal);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-light-text-secondary dark:text-zinc-400">
        Cargando cotización...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-light-text-secondary dark:text-red-400 bg-light-error/10 dark:bg-red-500/10 rounded-xl m-4">
        {error}
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-8 text-center text-light-text-secondary dark:text-zinc-400">
        Cotización no encontrada
      </div>
    );
  }

  const quoteFolio = getQuoteFolio(quote);
  const quoteDateLabel = new Date(quote.created_at).toLocaleDateString("es-MX");
  const createdDate = new Date(quote.created_at);
  const expirationDate = new Date(createdDate.getTime() + 15 * 24 * 60 * 60 * 1000);
  const quoteValidityLabel = expirationDate.toLocaleDateString("es-MX");
  const preferredContact =
    quote.contact?.email ?
      quote.contact
    : (quote.client?.contacts || []).find((c) => c.email);
  const preferredContactEmail = preferredContact?.email || "";

  let displayStatus = String(quote.status || "PENDING").toUpperCase();
  if (displayStatus !== "REJECTED" && displayStatus !== "REQUESTED") {
    displayStatus = quote.is_registered ? "ACCEPTED" : "PENDING";
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 print:p-0 print:space-y-0 relative">
      {/* Fondo decorativo */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-900/20 to-transparent -z-10 blur-3xl rounded-full opacity-50 print:hidden" />

      {/* Email Modal */}
      <EmailQuoteModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        quote={quote}
        onSubmit={handleSendEmail}
        sending={sendingEmail}
        error={emailError}
        success={emailSuccess}
      />

      {/* Action Toolbar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden sticky top-6 z-40 backdrop-blur-xl shadow-xl">
        <div>
          <Link
            to={isPortal ? "/portal/quotes" : "/cotizaciones/historial"}
            className="text-xs font-medium text-light-text-secondary hover:text-light-text-primary flex items-center gap-1 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              <ArrowLeft size={16} />
            </span>{" "}
            Volver al historial
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-zinc-100">
              Cotización {quoteFolio}
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${
                displayStatus === "PENDING"
                  ? "text-yellow-600 border-yellow-600/30 bg-yellow-50 dark:bg-yellow-500/10"
                  : displayStatus === "REQUESTED"
                  ? "text-blue-600 border-blue-600/30 bg-blue-50 dark:bg-blue-500/10"
                  : displayStatus === "SENT"
                  ? "text-indigo-600 border-indigo-600/30 bg-indigo-50 dark:bg-indigo-500/10"
                  : displayStatus === "ACCEPTED"
                  ? "text-emerald-600 border-emerald-600/30 bg-emerald-50 dark:bg-emerald-500/10"
                  : displayStatus === "REJECTED"
                  ? "text-red-600 border-red-600/30 bg-red-50 dark:bg-red-500/10"
                  : "text-zinc-500 border-zinc-200 dark:border-white/10"
              }`}
            >
              {displayStatus === "PENDING"
                ? "PENDIENTE"
                : displayStatus === "REQUESTED"
                ? "SOLICITADA"
                : displayStatus === "SENT"
                ? "ENVIADA"
                : displayStatus === "ACCEPTED"
                ? "ACEPTADA"
                : displayStatus === "REJECTED"
                ? "RECHAZADA"
                : displayStatus}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end">
          {!isPortal && (
            <Button
              variant={quote.is_registered ? "ghost" : "primary"}
              onClick={handleRegisterQuote}
              disabled={quote.is_registered || registeringQuote}
              className={`flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !border !transition-all !duration-150 disabled:!opacity-70 disabled:!cursor-not-allowed !flex !items-center !gap-2 !justify-center ${
                quote.is_registered
                  ? "!bg-emerald-50 dark:!bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-300 !border-emerald-200 dark:!border-emerald-500/30 !shadow-none"
                  : "!shadow-sm"
              }`}
            >
              <CheckCircle2 size={16} />
              {quote.is_registered
                ? "REGISTRADO"
                : registeringQuote
                ? "Registrando…"
                : "Registrar y enviar al portal"}
            </Button>
          )}
          {!isPortal && (
            <Button
              variant="ghost"
              onClick={handleSendToQuoteContact}
              disabled={sendingToContact || !preferredContactEmail}
              className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !border !border-[#1B4733]/30 dark:!border-dark-700 !text-light-text-secondary dark:!text-zinc-300 !transition-all !duration-150 disabled:!opacity-50 disabled:!cursor-not-allowed disabled:!bg-white disabled:dark:!bg-dark-900 disabled:!text-emerald-700 disabled:!border-emerald-200 !flex !items-center !gap-2 !justify-center hover:!bg-[#1B4733]/15 hover:dark:!bg-dark-800"
            >
              <Mail size={16} />
              {sendingToContact ? "Enviando…" : "Enviar al contacto"}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handlePrint}
            className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !bg-white dark:!bg-dark-900 !border !border-red-200 dark:!border-red-500/30 !text-red-600 dark:!text-red-400 hover:!bg-red-50 hover:dark:!bg-red-500/20 !shadow-none !transition-colors !duration-150 !flex !items-center !gap-1.5 !justify-center"
          >
            <Printer size={16} /> Exportar a PDF
          </Button>
          <Button
            variant="ghost"
            onClick={handleExportWord}
            className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !bg-white dark:!bg-dark-900 !border !border-[#315A9B]/35 dark:!border-blue-500/30 !text-[#315A9B] dark:!text-blue-400 hover:!bg-[#315A9B]/10 hover:dark:!bg-blue-500/20 !shadow-none !transition-colors !duration-150 !flex !items-center !gap-1.5 !justify-center"
          >
            Exportar a Word
          </Button>
        </div>
      </div>

      {quickNotice && (
        <div
          className={`print:hidden px-4 py-3 rounded-xl border text-sm ${
            quickNotice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-300"
          }`}
        >
          {quickNotice.message}
        </div>
      )}

      {/* Printable Quote Preview */}
      <QuotePreview
        quote={quote}
        quoteFolio={quoteFolio}
        quoteDateLabel={quoteDateLabel}
        quoteValidityLabel={quoteValidityLabel}
        innerRef={quotePreviewRef}
      />
    </div>
  );
}
