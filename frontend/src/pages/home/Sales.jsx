import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ClientFilterPicker from "./clients/ClientFilterPicker";
import {
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "@icons";
import {
  deleteSaleApi,
  listSalesApi,
} from "../../actionsAPI/sales.api";
import { notificationService } from "../../services/notificationService";
import { exportRowsToExcel } from "../../utils/excelExport";
import { normalizeSearchText } from "../../utils/formatters";
import { exportPdfTable } from "../../utils/pdfTableExport";

const SALES_FILTER_BUTTONS = [
  {
    id: "client",
    fieldName: "client",
    buttonLabel: "Cliente",
    optionsKey: "clients",
  },
  {
    id: "status",
    fieldName: "status",
    buttonLabel: "Estado",
    optionsKey: "statuses",
  },
  {
    id: "folio",
    fieldName: "folio",
    buttonLabel: "Folio",
    optionsKey: "folios",
  },
];

const SALES_PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-MX");
}

function getProductsSummary(sale) {
  const items = sale.items || [];
  if (!items.length) return "Sin productos";
  const names = items.map((item) => item.product?.name).filter(Boolean);
  const visible = names.slice(0, 2).join(", ");
  const hidden = Math.max(0, names.length - 2);
  return hidden > 0 ? `${visible} +${hidden}` : visible;
}

function getSaleFolio(sale) {
  return sale?.folio || sale?.quote?.folio || "";
}

function getSaleStatus(sale) {
  return String(sale?.status || "Sin estado").toUpperCase();
}

function getUniqueSortedValues(values) {
  const uniqueValues = new Map();

  values.forEach((value) => {
    const safeValue = String(value || "").trim();
    const normalized = normalizeSearchText(safeValue);
    if (!normalized || uniqueValues.has(normalized)) return;
    uniqueValues.set(normalized, safeValue);
  });

  return Array.from(uniqueValues.values()).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );
}

function buildSaleExportRows(sales) {
  return sales.map((sale) => ({
    sale: `Venta #${sale.id}`,
    folio: getSaleFolio(sale) || "Sin folio",
    quoteFolio: sale.quote?.folio || "—",
    client: sale.client?.business_name || "Sin cliente",
    contact: sale.contact?.full_name || "Sin contacto",
    products: getProductsSummary(sale),
    total: Number(sale.total) || 0,
    date: formatDate(sale.created_at),
    status: getSaleStatus(sale),
  }));
}

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    client: "",
    status: "",
    folio: "",
  });
  const [activeFilterPickerField, setActiveFilterPickerField] = useState(null);
  const [filterPickerSearch, setFilterPickerSearch] = useState("");
  const [filterPickerPage, setFilterPickerPage] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    listSalesApi()
      .then((data) => {
        if (!canceled) setSales(data || []);
      })
      .catch((err) => {
        if (!canceled) setError(err.message || "No se pudieron cargar las ventas.");
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, []);

  const filterOptions = useMemo(
    () => ({
      clients: getUniqueSortedValues(
        sales.map((sale) => sale.client?.business_name),
      ),
      statuses: getUniqueSortedValues(sales.map((sale) => getSaleStatus(sale))),
      folios: getUniqueSortedValues(sales.map((sale) => getSaleFolio(sale))),
    }),
    [sales],
  );

  const activeFilterPickerConfig = useMemo(
    () =>
      SALES_FILTER_BUTTONS.find(
        (button) => button.fieldName === activeFilterPickerField,
      ) || null,
    [activeFilterPickerField],
  );

  const filterPickerOptions = useMemo(() => {
    if (!activeFilterPickerConfig) return [];

    const options = filterOptions[activeFilterPickerConfig.optionsKey] || [];
    const search = normalizeSearchText(filterPickerSearch);
    if (!search) return options;

    return options.filter((value) =>
      normalizeSearchText(value).includes(search),
    );
  }, [activeFilterPickerConfig, filterOptions, filterPickerSearch]);

  const activeFilterCount = Object.values(filters).filter(
    (value) => String(value).trim() !== "",
  ).length;

  const filteredSales = useMemo(() => {
    const search = normalizeSearchText(q);
    const clientFilter = normalizeSearchText(filters.client);
    const statusFilter = normalizeSearchText(filters.status);
    const folioFilter = normalizeSearchText(filters.folio);

    return sales.filter((sale) => {
      const client = sale.client?.business_name || "";
      const status = getSaleStatus(sale);
      const folio = getSaleFolio(sale);
      const searchableText = normalizeSearchText(
        [
          sale.id,
          sale.folio,
          sale.quote?.folio,
          client,
          sale.contact?.full_name,
          sale.contact?.email,
          getProductsSummary(sale),
          status,
          formatMoney(sale.total),
          formatDate(sale.created_at),
        ].join(" "),
      );

      if (search && !searchableText.includes(search)) return false;
      if (clientFilter && normalizeSearchText(client) !== clientFilter) return false;
      if (statusFilter && normalizeSearchText(status) !== statusFilter) return false;
      if (folioFilter && normalizeSearchText(folio) !== folioFilter) return false;
      return true;
    });
  }, [filters, q, sales]);

  const exportRows = useMemo(
    () => buildSaleExportRows(filteredSales),
    [filteredSales],
  );

  const pageCount = Math.max(1, Math.ceil(filteredSales.length / pageSize));

  const paginatedSales = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, pageIndex, pageSize]);

  useEffect(() => {
    setPageIndex(0);
  }, [q, filters]);

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < pageCount - 1;

  const toggleFilters = () => {
    setShowFilters((visible) => {
      if (visible) {
        setActiveFilterPickerField(null);
        setFilterPickerSearch("");
        setFilterPickerPage(0);
      }
      return !visible;
    });
  };

  const openFilterPicker = (fieldName) => {
    setActiveFilterPickerField(fieldName);
    setFilterPickerSearch("");
    setFilterPickerPage(0);
  };

  const applyFilterValue = (fieldName, value) => {
    setFilters((current) => ({ ...current, [fieldName]: value }));
  };

  const clearFilters = () => {
    setFilters({ client: "", status: "", folio: "" });
    setActiveFilterPickerField(null);
    setFilterPickerSearch("");
    setFilterPickerPage(0);
  };

  const handleExportPDF = async () => {
    if (!exportRows.length) {
      notificationService.info("Sin datos", "No hay ventas para exportar.");
      return;
    }

    try {
      await exportPdfTable({
        title: "Ventas",
        filename: `Ventas_${new Date().toISOString().slice(0, 10)}.pdf`,
        head: [[
          "VENTA",
          "FOLIO",
          "CLIENTE",
          "CONTACTO",
          "PRODUCTOS",
          "TOTAL",
          "FECHA",
          "ESTADO",
        ]],
        body: exportRows.map((row) => [
          row.sale,
          row.folio,
          row.client,
          row.contact,
          row.products,
          formatMoney(row.total),
          row.date,
          row.status,
        ]),
        recordCount: exportRows.length,
        columnStyles: {
          2: { cellWidth: 38 },
          3: { cellWidth: 34 },
          4: { cellWidth: 46 },
          5: { halign: "right", cellWidth: 25 },
          7: { cellWidth: 23 },
        },
      });
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
          Venta: row.sale,
          Folio: row.folio,
          "Folio de cotización": row.quoteFolio,
          Cliente: row.client,
          Contacto: row.contact,
          Productos: row.products,
          Total: row.total,
          Fecha: row.date,
          Estado: row.status,
        })),
        sheetName: "Ventas",
        fileName: `Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo generar el Excel.");
    }
  };

  const handleDelete = async (sale) => {
    const confirmed = await notificationService.confirm({
      title: "¿Eliminar venta?",
      text: `Se eliminará la venta ${sale.folio || `#${sale.id}`} de este listado.`,
      confirmButtonText: "Sí, eliminar",
    });
    if (!confirmed) return;

    try {
      await deleteSaleApi(sale.id);
      setSales((current) => current.filter((item) => String(item.id) !== String(sale.id)));
      notificationService.toast({ title: "Venta eliminada correctamente.", icon: "success" });
    } catch (err) {
      notificationService.error("Error", err.message || "No se pudo eliminar la venta.");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Ventas
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Ventas generadas desde cotizaciones aceptadas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-white/25 dark:border-white/15 bg-white/70 p-1 dark:bg-dark-900/70 backdrop-blur-md shadow-glass-sm">
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar venta, folio, cliente o contacto..."
              className="w-52 border-none bg-transparent px-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 md:w-72"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors focus:outline-none"
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
            <div className="px-3 py-1.5 text-zinc-400 dark:text-zinc-500 flex items-center justify-center">
              <Search size={16} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200/80 bg-white/70 px-3 py-2 text-sm font-semibold text-red-700 transition-all hover:bg-white/95 dark:border-red-900/50 dark:bg-dark-900/60 dark:text-red-400 dark:hover:bg-red-900/10 backdrop-blur-md shadow-glass-sm"
            title="Exportar a PDF"
          >
            <FileText size={14} /> Exportar a PDF
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-white/70 px-3 py-2 text-sm font-semibold text-emerald-700 transition-all hover:bg-white/95 dark:border-emerald-900/50 dark:bg-dark-900/60 dark:text-emerald-400 dark:hover:bg-emerald-900/10 backdrop-blur-md shadow-glass-sm"
            title="Exportar a Excel"
          >
            <FileSpreadsheet size={14} /> Exportar a Excel
          </button>

          <button
            type="button"
            onClick={toggleFilters}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all backdrop-blur-md shadow-glass-sm ${
              showFilters || activeFilterCount > 0
                ? "border-[#2277B4] bg-[#2277B4] text-white dark:border-blue-600 dark:bg-blue-600"
                : "border-white/25 bg-white/70 text-zinc-700 hover:bg-white/95 dark:border-white/15 dark:bg-dark-900/60 dark:text-zinc-300 dark:hover:bg-dark-800"
            }`}
          >
            <SlidersHorizontal size={15} /> Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#2277B4] dark:text-blue-600">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="glass-panel glass-mirror overflow-hidden rounded-2xl border border-white/25 dark:border-white/15 bg-white/35 dark:bg-dark-900/60 backdrop-blur-xl shadow-glass-sm dark:shadow-glass-mirror">
        <div className="flex min-h-[44px] flex-wrap items-center justify-between gap-2 border-b border-white/15 dark:border-white/10 bg-white/30 dark:bg-dark-900/30 backdrop-blur-md px-5 py-3.5 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold">
            {filteredSales.length} venta(s)
          </span>

          {showFilters && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {SALES_FILTER_BUTTONS.map((button) => {
                const selectedValue = filters[button.fieldName];

                return (
                  <div
                    key={button.id}
                    className={`inline-flex items-center rounded-xl border text-xs transition-colors backdrop-blur-md shadow-glass-sm ${
                      selectedValue
                        ? "border-[#2277B4] bg-white/90 dark:bg-dark-900 text-zinc-800 dark:text-zinc-200 dark:border-blue-500"
                        : "border-white/25 bg-white/70 text-zinc-700 hover:bg-white/95 dark:border-white/15 dark:bg-dark-900/60 dark:text-zinc-200 dark:hover:bg-dark-700"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openFilterPicker(button.fieldName)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold px-3 py-1 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-l-xl transition-colors"
                    >
                      <span className={selectedValue ? "text-[#2277B4] dark:text-blue-400 font-bold" : ""}>
                        {button.buttonLabel}
                      </span>
                      {selectedValue && (
                        <span className="max-w-28 truncate font-medium text-zinc-700 dark:text-zinc-300">
                          {selectedValue}
                        </span>
                      )}
                    </button>
                    {selectedValue && (
                      <button
                        type="button"
                        onClick={() => applyFilterValue(button.fieldName, "")}
                        className="pr-2 pl-0.5 py-1 text-black hover:text-red-500 dark:text-zinc-100 dark:hover:text-red-400 transition-colors flex items-center justify-center focus:outline-none"
                        title={`Quitar filtro ${button.buttonLabel}`}
                      >
                        <X size={12} className="text-black dark:text-zinc-100 hover:text-red-500" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                );
              })}

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
                >
                  <X size={13} /> Limpiar
                </button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-y-auto max-h-[420px] relative">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-white/15 dark:border-white/10 bg-white/40 dark:bg-dark-900/40 backdrop-blur-md text-xs uppercase text-[#2277B4] dark:text-blue-300">
              <tr>
                <th className="p-4">Venta</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Productos</th>
                <th className="p-4">Total</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-white/5 text-sm">
              {loading ? (
              <tr>
                <td className="p-8 text-center text-zinc-500" colSpan={7}>
                  Cargando ventas...
                </td>
              </tr>
            ) : filteredSales.length === 0 ? (
              <tr>
                <td className="p-12 text-center text-zinc-500" colSpan={7}>
                  <div className="flex flex-col items-center gap-3">
                    <FolderOpen size={40} className="text-zinc-300 dark:text-zinc-600" />
                    <p className="text-sm font-medium">No se encontraron ventas.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedSales.map((sale) => (
                <tr key={sale.id} className="transition-colors hover:bg-white/50 dark:hover:bg-white/[0.04]">
                  <td className="p-4">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                      Venta #{sale.id}
                    </div>
                    <code className="mt-1 inline-flex rounded-xl bg-blue-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-[#2277B4] dark:text-blue-300">
                      {getSaleFolio(sale) || "Sin folio"}
                    </code>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {sale.client?.business_name || "Sin cliente"}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {sale.contact?.full_name || "Sin contacto"}
                    </div>
                  </td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300">
                    {getProductsSummary(sale)}
                  </td>
                  <td className="p-4 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {formatMoney(sale.total)}
                  </td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300">
                    {formatDate(sale.created_at)}
                  </td>
                  <td className="p-4">
                    <span className="rounded-lg border border-emerald-200/80 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300">
                      {getSaleStatus(sale)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/ventas/${sale.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200/80 bg-white/70 px-3 py-1.5 text-xs font-bold text-[#2277B4] transition-all hover:bg-white/95 dark:border-blue-500/20 dark:bg-dark-900/60 dark:text-blue-300 dark:hover:bg-blue-500/10 backdrop-blur-md shadow-glass-sm"
                      >
                        <ExternalLink size={14} /> Ver
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(sale)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200/80 bg-white/70 px-3 py-1.5 text-xs font-bold text-red-700 transition-all hover:bg-white/95 dark:border-red-500/20 dark:bg-dark-900/60 dark:text-red-300 dark:hover:bg-red-500/10 backdrop-blur-md shadow-glass-sm"
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {!loading && filteredSales.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-white/15 dark:border-white/10 bg-white/30 dark:bg-dark-900/30 backdrop-blur-md px-5 py-3.5">
            <label className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              Mostrar
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageIndex(0);
                  setPageSize(Number(event.target.value));
                }}
                className="rounded-xl border border-white/25 dark:border-white/15 bg-white/70 dark:bg-dark-900/70 backdrop-blur-md px-2.5 py-1 text-sm text-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-glass-sm"
              >
                {SALES_PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size} className="dark:bg-dark-900 dark:text-zinc-100">
                    {size}
                  </option>
                ))}
              </select>
              por página
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPageIndex(0)}
                disabled={!canPreviousPage}
                className="rounded-xl border border-white/25 dark:border-white/15 bg-white/60 dark:bg-white/5 px-2.5 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-white/95 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 shadow-glass-sm"
              >
                ««
              </button>
              <button
                type="button"
                onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                disabled={!canPreviousPage}
                className="rounded-xl border border-white/25 dark:border-white/15 bg-white/60 dark:bg-white/5 px-3 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-white/95 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 shadow-glass-sm"
              >
                Anterior
              </button>
              <span className="px-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Pág. {pageIndex + 1} de {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPageIndex((current) => Math.min(pageCount - 1, current + 1))}
                disabled={!canNextPage}
                className="rounded-xl border border-white/25 dark:border-white/15 bg-white/60 dark:bg-white/5 px-3 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-white/95 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 shadow-glass-sm"
              >
                Siguiente
              </button>
              <button
                type="button"
                onClick={() => setPageIndex(pageCount - 1)}
                disabled={!canNextPage}
                className="rounded-xl border border-white/25 dark:border-white/15 bg-white/60 dark:bg-white/5 px-2.5 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-white/95 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 shadow-glass-sm"
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>

      <ClientFilterPicker
        isOpen={Boolean(activeFilterPickerField) && showFilters}
        onClose={() => setActiveFilterPickerField(null)}
        fieldName={activeFilterPickerField}
        fieldConfig={activeFilterPickerConfig}
        filters={filters}
        options={filterPickerOptions}
        filterPickerSearch={filterPickerSearch}
        setFilterPickerSearch={setFilterPickerSearch}
        filterPickerPage={filterPickerPage}
        setFilterPickerPage={setFilterPickerPage}
        onApplyFilter={applyFilterValue}
      />
    </div>
  );
}
