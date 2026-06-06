import { useEffect, useMemo, useState } from "react";
import { deleteQuoteApi, listQuotesApi } from "../../../actionsAPI/quotes.api";
import { notificationService } from "../../../services/notificationService";
import { exportRowsToExcel } from "../../../utils/excelExport";
import { normalizeSearchText } from "../../../utils/formatters";

const PAGE_SIZE = 5;
const CURRENCY_FORMATTER = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function formatSaleMoney(value) {
  return CURRENCY_FORMATTER.format(Number(value) || 0);
}

export function formatSaleDate(value, options = {}) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-MX", options);
}

export function formatSaleDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getSaleDate(quote) {
  return quote?.registered_at || quote?.created_at || null;
}

function getSaleItemsCount(quote) {
  return (quote?.items || []).reduce((sum, item) => {
    const quantity = Number(item?.quantity);
    return sum + (Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
  }, 0);
}

export function getSaleProductsSummary(quote) {
  const items = quote?.items || [];
  const names = Array.from(
    new Set(items.map((item) => item?.product?.name).filter(Boolean)),
  );
  const count = getSaleItemsCount(quote);

  if (!names.length) {
    return {
      count,
      title: "Sin productos",
      detail: "Sin detalle de productos",
    };
  }

  const visibleNames = names.slice(0, 2).join(", ");
  const hiddenCount = Math.max(0, names.length - 2);

  return {
    count,
    title: hiddenCount > 0 ? `${visibleNames} +${hiddenCount}` : visibleNames,
    detail: `${count || names.length} producto(s) cotizado(s)`,
  };
}

function isRegisteredPortalSale(quote) {
  return (
    Boolean(quote?.is_registered) &&
    Boolean(quote?.is_sent_to_client_portal) &&
    Boolean(quote?.contact)
  );
}

function buildExportRows(sales) {
  return sales.map((sale) => {
    const productsSummary = getSaleProductsSummary(sale);
    return {
      venta: `Venta #${sale.id}`,
      folio: sale.folio || "—",
      cliente: sale.client?.business_name || "Sin cliente",
      contacto: sale.contact?.full_name || "Sin contacto",
      correo: sale.contact?.email || "—",
      productos: productsSummary.title,
      cantidad: productsSummary.count,
      total: Number(sale.total) || 0,
      fechaVenta: formatSaleDateTime(getSaleDate(sale)),
    };
  });
}

export function usePolicies() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    client: "",
    contact: "",
  });
  const [selectedSale, setSelectedSale] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listQuotesApi();
      setSales((data || []).filter(isRegisteredPortalSale));
    } catch (e) {
      setError(e.message || "No se pudieron cargar las ventas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const clearFilters = () => {
    setQ("");
    setFilters({ client: "", contact: "" });
  };

  const activeFilterCount =
    Object.values(filters).filter((v) => String(v).trim() !== "").length +
    (q.trim() ? 1 : 0);

  const filterOptions = useMemo(() => {
    const clients = new Set();
    const contacts = new Set();

    sales.forEach((sale) => {
      if (sale.client?.business_name) clients.add(sale.client.business_name);
      if (sale.contact?.full_name) contacts.add(sale.contact.full_name);
    });

    return {
      clients: Array.from(clients).sort(),
      contacts: Array.from(contacts).sort(),
    };
  }, [sales]);

  const filteredSales = useMemo(() => {
    const search = normalizeSearchText(q);
    const clientFilter = normalizeSearchText(filters.client);
    const contactFilter = normalizeSearchText(filters.contact);

    return sales.filter((sale) => {
      const productsSummary = getSaleProductsSummary(sale);
      const saleDate = getSaleDate(sale);
      const searchableText = normalizeSearchText(
        [
          sale.id,
          sale.folio,
          sale.client?.business_name,
          sale.contact?.full_name,
          sale.contact?.email,
          sale.user?.full_name,
          productsSummary.title,
          productsSummary.detail,
          formatSaleDate(saleDate),
          formatSaleMoney(sale.total),
        ].join(" "),
      );

      if (search && !searchableText.includes(search)) return false;
      if (
        clientFilter &&
        normalizeSearchText(sale.client?.business_name || "") !== clientFilter
      ) {
        return false;
      }
      if (
        contactFilter &&
        normalizeSearchText(sale.contact?.full_name || "") !== contactFilter
      ) {
        return false;
      }
      return true;
    });
  }, [sales, q, filters]);

  const metrics = useMemo(() => {
    const totalAmount = filteredSales.reduce(
      (sum, sale) => sum + (Number(sale.total) || 0),
      0,
    );
    const uniqueClients = new Set(
      filteredSales.map((sale) => sale.client?.business_name).filter(Boolean),
    ).size;
    const uniqueContacts = new Set(
      filteredSales.map((sale) => sale.contact?.full_name).filter(Boolean),
    ).size;

    return {
      totalSales: filteredSales.length,
      totalAmount,
      uniqueClients,
      uniqueContacts,
    };
  }, [filteredSales]);

  const exportRows = useMemo(() => buildExportRows(filteredSales), [filteredSales]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [q, filters]);

  useEffect(() => {
    const maxPageIndex = Math.max(
      0,
      Math.ceil(filteredSales.length / pagination.pageSize) - 1,
    );

    if (pagination.pageIndex > maxPageIndex) {
      setPagination((prev) => ({ ...prev, pageIndex: maxPageIndex }));
    }
  }, [filteredSales.length, pagination.pageIndex, pagination.pageSize]);

  const handleExportPDF = async () => {
    if (!exportRows.length) {
      notificationService.info("Sin datos", "No hay ventas para exportar.");
      return;
    }

    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableModule.default || autoTableModule.autoTable;

      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.setTextColor(26, 43, 76);
      doc.text("Ventas por cotización", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Exportado: ${new Date().toLocaleString("es-MX")}`, 14, 23);
      doc.text(
        `Resumen: ${metrics.totalSales} venta(s) · ${formatSaleMoney(metrics.totalAmount)} · ${metrics.uniqueClients} cliente(s)`,
        14,
        29,
      );

      autoTable(doc, {
        startY: 34,
        head: [["VENTA", "FOLIO", "CLIENTE", "CONTACTO", "PRODUCTOS", "TOTAL", "FECHA"]],
        body: exportRows.map((row) => [
          row.venta,
          row.folio,
          row.cliente,
          row.contacto,
          row.productos,
          formatSaleMoney(row.total),
          row.fechaVenta,
        ]),
        theme: "grid",
        headStyles: { fillColor: [34, 119, 180] },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          2: { cellWidth: 42 },
          3: { cellWidth: 38 },
          4: { cellWidth: 48 },
          5: { halign: "right" },
        },
      });

      doc.save(`Ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo generar el PDF.");
    }
  };

  const handleExportExcel = async () => {
    if (!exportRows.length) {
      notificationService.info("Sin datos", "No hay ventas para exportar.");
      return;
    }

    try {
      await exportRowsToExcel({
        rows: exportRows.map((row) => ({
          Venta: row.venta,
          Folio: row.folio,
          Cliente: row.cliente,
          Contacto: row.contacto,
          Correo: row.correo,
          Productos: row.productos,
          Cantidad: row.cantidad,
          Total: row.total,
          "Fecha de venta": row.fechaVenta,
        })),
        sheetName: "Ventas",
        fileName: `Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo generar el Excel.");
    }
  };

  const openSaleSummary = (sale) => {
    setSelectedSale(sale);
  };

  const closeSaleSummary = () => {
    setSelectedSale(null);
  };

  const handleDeleteSale = async (sale) => {
    if (!sale?.id) return;

    const confirmed = await notificationService.confirm({
      title: "¿Eliminar venta?",
      text: `Se eliminará la venta ${sale.folio || `#${sale.id}`} de este listado.`,
      confirmButtonText: "Sí, eliminar",
    });
    if (!confirmed) return;

    try {
      await deleteQuoteApi(sale.id);
      setSales((prev) => prev.filter((item) => String(item.id) !== String(sale.id)));
      if (String(selectedSale?.id) === String(sale.id)) {
        setSelectedSale(null);
      }
      notificationService.toast({
        title: "Venta eliminada correctamente.",
        icon: "success",
      });
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo eliminar la venta.");
    }
  };

  return {
    sales,
    loading,
    error,
    q,
    setQ,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    sorting,
    setSorting,
    pagination,
    setPagination,
    selectedSale,
    load,
    clearFilters,
    activeFilterCount,
    filterOptions,
    filteredSales,
    metrics,
    openSaleSummary,
    closeSaleSummary,
    handleDeleteSale,
    handleExportPDF,
    handleExportExcel,
  };
}
