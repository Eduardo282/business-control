import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Mail, Printer } from "@icons";
import Button from "../../components/ui/Button";
import {
  getSaleApi,
  sendSaleEmailApi,
  toggleSalePortalApi,
} from "../../actionsAPI/sales.api";
import { getPortalSaleApi } from "../../actionsAPI/portal.api";
import { notificationService } from "../../services/notificationService";
import SalePreview from "./sales/SalePreview";
import { getSaleFolio, exportSalePdf, exportSaleWord } from "./sales/saleExport";

function buildSaleEmailMessage(sale) {
  return `Estimado ${sale?.contact?.full_name || "cliente"},

Se generó la venta ${getSaleFolio(sale)} por un total de $${Number(
    sale?.total || 0,
  ).toLocaleString("es-MX", { minimumFractionDigits: 2 })}.

Quedo a su disposición.

${sale?.user?.full_name || "Equipo de Ventas"}`;
}

export default function SaleDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/portal");
  const previewRef = useRef(null);
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingPortal, setSendingPortal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    setError("");

    const loader = isPortal ? getPortalSaleApi : getSaleApi;
    loader(id)
      .then((data) => {
        if (!canceled) setSale(data);
      })
      .catch((err) => {
        if (!canceled) setError(err.message || "No se pudo cargar la venta.");
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [id, isPortal]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-light-text-secondary dark:text-zinc-400">
        Cargando venta...
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-4 rounded-xl border border-light-error/20 bg-light-error/10 p-8 text-center text-light-error dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-8 text-center text-light-text-secondary dark:text-zinc-400">
        Venta no encontrada
      </div>
    );
  }

  const saleFolio = getSaleFolio(sale);
  const saleDateLabel = new Date(sale.created_at).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const contactEmail = sale.contact?.email || "";
  const isSentToPortal = Boolean(sale.is_sent_to_client_portal);
  const isSentToContact = Boolean(sale.email_sent_at);

  const handleSendToPortal = async () => {
    if (!sale?.id || isSentToPortal) return;
    setSendingPortal(true);
    try {
      await toggleSalePortalApi(sale.id, true, sale.contact?.id);
      setSale((current) => ({
        ...current,
        is_sent_to_client_portal: true,
        portal_sent_at: current.portal_sent_at || new Date().toISOString(),
        status: "ENVIADA",
      }));
      notificationService.toast({ title: "Venta enviada al portal.", icon: "success" });
    } catch (err) {
      notificationService.error("Error", err.message || "No se pudo enviar la venta al portal.");
    } finally {
      setSendingPortal(false);
    }
  };

  const handleSendToContact = async () => {
    if (!contactEmail || isSentToContact) return;
    setSendingEmail(true);
    try {
      const result = await sendSaleEmailApi({
        sale_id: sale.id,
        contact_email: contactEmail,
        message: buildSaleEmailMessage(sale),
      });
      setSale((current) => ({
        ...current,
        email_sent_at: result?.email_sent_at || new Date().toISOString(),
        status: "ENVIADA",
      }));
      notificationService.toast({ title: `Venta enviada a ${contactEmail}`, icon: "success" });
    } catch (err) {
      notificationService.error("Error", err.message || "No se pudo enviar la venta al contacto.");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="relative space-y-6 pb-20 print:space-y-0 print:p-0">
      <div className="sticky top-6 z-40 flex flex-col items-center justify-between gap-4 rounded-xl p-4 shadow-xl backdrop-blur-sm print:hidden sm:flex-row glass-panel">
        <div>
          <Link
            to={isPortal ? "/portal/sales" : "/ventas"}
            className="group flex items-center gap-1 text-xs font-medium text-light-text-secondary transition-colors hover:text-light-text-primary dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              <ArrowLeft size={16} />
            </span>
            Volver al historial
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-zinc-100">
              Venta {saleFolio}
            </h2>
            {!isPortal && (
              <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                {sale.status}
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {!isPortal && (
            <Button
              variant={isSentToPortal ? "ghost" : "primary"}
              onClick={handleSendToPortal}
              disabled={isSentToPortal || sendingPortal}
              className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !border !flex !items-center !gap-2 !justify-center"
            >
              <CheckCircle2 size={16} />
              {isSentToPortal ? "ENVIADO" : sendingPortal ? "Enviando..." : "Enviar al portal"}
            </Button>
          )}
          {!isPortal && (
            <Button
              variant="ghost"
              onClick={handleSendToContact}
              disabled={isSentToContact || sendingEmail || !contactEmail}
              className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !border !flex !items-center !gap-2 !justify-center"
            >
              {isSentToContact ? <CheckCircle2 size={16} /> : <Mail size={16} />}
              {isSentToContact ? "Enviado" : sendingEmail ? "Enviando..." : "Enviar al contacto"}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => exportSalePdf(sale, previewRef.current)}
            className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !bg-white dark:!bg-dark-900 !border !border-red-200 dark:!border-red-500/30 !text-red-600 dark:!text-red-400 !flex !items-center !gap-1.5 !justify-center"
          >
            <Printer size={16} /> Exportar a PDF
          </Button>
          <Button
            variant="ghost"
            onClick={() => exportSaleWord(sale)}
            className="flex-1 sm:flex-none !px-3 !py-1.5 !rounded-md !text-[13px] !font-semibold !bg-white dark:!bg-dark-900 !border !border-[#315A9B]/35 dark:!border-blue-500/30 !text-[#315A9B] dark:!text-blue-400 !flex !items-center !gap-1.5 !justify-center"
          >
            Exportar a Word
          </Button>
        </div>
      </div>

      <SalePreview
        sale={sale}
        saleFolio={saleFolio}
        saleDateLabel={saleDateLabel}
        innerRef={previewRef}
      />
    </div>
  );
}
