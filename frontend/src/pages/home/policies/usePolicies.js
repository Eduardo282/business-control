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

export function isRegisteredPortalSale(quote) {
  return (
    Boolean(quote?.is_registered) &&
    Boolean(quote?.is_sent_to_client_portal) &&
    Boolean(quote?.contact) &&
    String(quote?.status || "").toUpperCase() === "ACEPTADA"
  );
}

function buildExportRows(sales) {
  return sales.map((sale) => {
    const productsSummary = getSaleProductsSummary(sale);
    return {
      quote: `Cotización #${sale.id}`,
      folio: sale.folio || "—",
      cliente: sale.client?.business_name || "Sin cliente",
      contacto: sale.contact?.full_name || "Sin contacto",
      correo: sale.contact?.email || "—",
      productos: productsSummary.title,
      cantidad: productsSummary.count,
      total: Number(sale.total) || 0,
      quoteDate: formatSaleDateTime(getSaleDate(sale)),
    };
  });
}

export function buildSalesPdfTableData(exportRows) {
  return {
    head: [[
      "COTIZACIÓN",
      "FOLIO",
      "CLIENTE",
      "CONTACTO",
      "PRODUCTOS",
      "CANTIDAD",
      "TOTAL",
      "FECHA",
    ]],
    body: exportRows.map((row) => [
      row.quote,
      row.folio,
      row.cliente,
      row.contacto,
      row.productos,
      row.cantidad,
      formatSaleMoney(row.total),
      row.quoteDate,
    ]),
  };
}

export function getSalesFilterOptions(sales) {
  const saleDates = new Set();
  const folios = new Set();

  sales.forEach((sale) => {
    const saleDate = getSaleDate(sale);
    if (saleDate) saleDates.add(formatSaleDate(saleDate));
    if (sale?.folio) folios.add(String(sale.folio).trim());
  });

  return {
    saleDates: Array.from(saleDates).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    ),
    folios: Array.from(folios).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    ),
  };
}

export function filterSales(sales, q, filters) {
  const search = normalizeSearchText(q);
  const saleDateFilter = normalizeSearchText(filters.saleDate);
  const folioFilter = normalizeSearchText(filters.folio);

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
      saleDateFilter &&
      normalizeSearchText(formatSaleDate(saleDate)) !== saleDateFilter
    ) {
      return false;
    }
    if (
      folioFilter &&
      normalizeSearchText(sale.folio || "") !== folioFilter
    ) {
      return false;
    }
    return true;
  });
}

export function getSalesMetrics(sales) {
  const uniqueClients = new Set(
    sales
      .map((sale) => sale.client?.id || sale.client?.business_name)
      .filter(Boolean),
  ).size;
  const uniqueContacts = new Set(
    sales
      .map((sale) => sale.contact?.id || sale.contact?.full_name)
      .filter(Boolean),
  ).size;

  return {
    totalSales: sales.length,
    uniqueClients,
    uniqueContacts,
  };
}

export function usePolicies() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    saleDate: "",
    folio: "",
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
      setError(e.message || "No se pudieron cargar las cotizaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const clearFilters = () => {
    setFilters({ saleDate: "", folio: "" });
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => String(v).trim() !== "",
  ).length;

  const filterOptions = useMemo(() => getSalesFilterOptions(sales), [sales]);

  const filteredSales = useMemo(
    () => filterSales(sales, q, filters),
    [sales, q, filters],
  );

  const metrics = useMemo(
    () => getSalesMetrics(filteredSales),
    [filteredSales],
  );

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
      notificationService.info("Sin datos", "No hay cotizaciones para exportar.");
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
      doc.text("Cotizaciones", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Exportado: ${new Date().toLocaleString("es-MX")}`, 14, 23);
      doc.text(
        `Resumen: ${metrics.totalSales} cotización(es) · ${metrics.uniqueClients} cliente(s)`,
        14,
        29,
      );

      const pdfTableData = buildSalesPdfTableData(exportRows);

      autoTable(doc, {
        startY: 34,
        head: pdfTableData.head,
        body: pdfTableData.body,
        theme: "grid",
        headStyles: { fillColor: [34, 119, 180] },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          2: { cellWidth: 38 },
          3: { cellWidth: 34 },
          4: { cellWidth: 42 },
          5: { halign: "center", cellWidth: 18 },
          6: { halign: "right" },
        },
      });

      doc.save(`Cotizaciones_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo generar el PDF.");
    }
  };

  const handleExportExcel = async () => {
    if (!exportRows.length) {
      notificationService.info("Sin datos", "No hay cotizaciones para exportar.");
      return;
    }

    try {
      await exportRowsToExcel({
        rows: exportRows.map((row) => ({
          Cotización: row.quote,
          Folio: row.folio,
          Cliente: row.cliente,
          Contacto: row.contacto,
          Correo: row.correo,
          Productos: row.productos,
          Cantidad: row.cantidad,
          Total: row.total,
          "Fecha de cotización": row.quoteDate,
        })),
        sheetName: "Cotizaciones",
        fileName: `Cotizaciones_${new Date().toISOString().slice(0, 10)}.xlsx`,
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
      title: "¿Eliminar cotización?",
      text: `Se eliminará la cotización ${sale.folio || `#${sale.id}`} de este listado.`,
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
        title: "Cotización eliminada correctamente.",
        icon: "success",
      });
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo eliminar la cotización.");
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
