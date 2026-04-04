import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import { listQuotesApi } from "../../actionsAPI/quotes.api";
import {
  BadgeDollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  SlidersHorizontal,
  X,
} from "@icons";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

export default function QuoteHistory() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sorting, setSorting] = useState([]);
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    client: "",
    status: "",
    folio: "",
  });
  const [activeFilterPickerField, setActiveFilterPickerField] = useState(null);
  const [filterPickerSearch, setFilterPickerSearch] = useState("");

  const normalizeSearchText = (value) => {
    return (value || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    listQuotesApi()
      .then((data) => setQuotes(data))
      .catch((e) => {
        const msg =
          e.response?.data?.errors?.[0]?.message ||
          e.message ||
          "Error al cargar cotizaciones";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const filterFieldLabels = {
    client: "Cliente",
    status: "Estado",
    folio: "Folio",
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v.trim() !== "",
  ).length;

  const openFilterPicker = (fieldName) => {
    setActiveFilterPickerField(fieldName);
    setFilterPickerSearch("");
  };

  const closeFilterPicker = () => {
    setActiveFilterPickerField(null);
    setFilterPickerSearch("");
  };

  const applyFilterValue = (value) => {
    if (!activeFilterPickerField) return;

    setFilters((prev) => ({
      ...prev,
      [activeFilterPickerField]: value,
    }));
    closeFilterPicker();
  };

  const clearFilters = () => {
    setFilters({ client: "", status: "", folio: "" });
    closeFilterPicker();
  };

  useEffect(() => {
    if (!showFilters) {
      closeFilterPicker();
    }
  }, [showFilters]);

  const filterPickerOptions = useMemo(() => {
    if (!activeFilterPickerField) return [];

    const uniqueValues = new Map();

    quotes.forEach((quote) => {
      let value = "";

      if (activeFilterPickerField === "client") {
        value = quote?.client?.business_name || "";
      } else if (activeFilterPickerField === "status") {
        value = quote?.status || "";
      } else if (activeFilterPickerField === "folio") {
        value = quote?.folio || "";
      }

      const normalized = normalizeSearchText(value);
      if (!normalized || uniqueValues.has(normalized)) return;
      uniqueValues.set(normalized, value);
    });

    return Array.from(uniqueValues.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [quotes, activeFilterPickerField]);

  const visibleFilterPickerOptions = useMemo(() => {
    const s = normalizeSearchText(filterPickerSearch);
    if (!s) return filterPickerOptions;

    return filterPickerOptions.filter((value) =>
      normalizeSearchText(value).includes(s),
    );
  }, [filterPickerSearch, filterPickerOptions]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Cotización",
        cell: ({ row }) => (
          <div className="font-bold text-light-text-primary">
            Cotización #{row.original.id}
          </div>
        ),
      },
      {
        accessorKey: "folio",
        header: "Folio",
        cell: ({ row }) => (
          <div className="text-sm font-mono font-bold text-[#2277B4] tracking-wider">
            {row.original.folio || "—"}
          </div>
        ),
      },
      {
        accessorKey: "client.business_name",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="text-sm text-light-text-secondary">
            {row.original.client?.business_name || "—"}
          </div>
        ),
      },
      {
        accessorKey: "user.full_name",
        header: "Creada por",
        cell: ({ row }) => (
          <div className="text-sm text-light-text-secondary">
            {row.original.user?.full_name || "Usuario"}
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Fecha",
        cell: ({ row }) => (
          <div className="text-sm text-light-text-secondary">
            {row.original.created_at ?
              new Date(row.original.created_at).toLocaleDateString()
            : "—"}
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: "Total (c/IVA)",
        cell: ({ row }) => (
          <div className="font-bold text-stone-600 text-right">
            $
            {(Number(row.original.total || 0) * 1.16).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded text-yellow-600">
              {row.original.status || "N/A"}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right">
            <Link
              to={`/cotizaciones/${row.original.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#2277B4] bg-gradient-to-b from-white to-[#E2E8F0] rounded-lg border border-[#CBD5E1]/80 hover:from-[#F8FAFC] hover:to-[#CBD5E1] transition-all">
              <ExternalLink size={14} /> Ver cotización
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  const filteredQuotes = useMemo(() => {
    const s = normalizeSearchText(q);
    const hasFieldFilters = Object.values(filters).some((v) => v.trim() !== "");
    if (!s && !hasFieldFilters) return quotes;

    return quotes.filter((quote) => {
      const id = quote?.id != null ? `#${quote.id}` : "";
      const folio = quote?.folio || "";
      const client = quote?.client?.business_name || "";
      const seller = quote?.user?.full_name || "";
      const status = quote?.status || "";
      const total =
        quote?.total != null ?
          String((Number(quote.total) * 1.16).toFixed(2))
        : "";
      const createdAt =
        quote?.created_at ?
          new Date(quote.created_at).toLocaleDateString()
        : "";

      const haystack = normalizeSearchText(
        [id, folio, client, seller, createdAt, total, status].join(" "),
      );

      const matchQ = !s || haystack.includes(s);

      const matchFilters =
        !hasFieldFilters ||
        ((!filters.client ||
          normalizeSearchText(client).includes(
            normalizeSearchText(filters.client),
          )) &&
          (!filters.status ||
            normalizeSearchText(status) ===
              normalizeSearchText(filters.status)) &&
          (!filters.folio ||
            normalizeSearchText(folio) === normalizeSearchText(filters.folio)));

      return matchQ && matchFilters;
    });
  }, [quotes, q, filters]);

  const table = useReactTable({
    data: filteredQuotes,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BadgeDollarSign size={28} />
          <div>
            <h1 className="text-3xl font-bold text-light-text-primary">
              Historial de Cotizaciones
            </h1>
            <p className="text-sm text-light-text-secondary dark:text-slate-400">
              Consulta rápida de las cotizaciones generadas.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por cliente, vendedor..."
              className="w-full sm:w-80 pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] transition-all shadow-sm"
            />
          </div>

          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap ${
              showFilters || activeFilterCount > 0 ?
                "bg-[#2277B4] text-white border-[#2277B4]"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
            }`}>
            <SlidersHorizontal size={14} /> Filtros
            {activeFilterCount > 0 && (
              <span className="ml-0.5 bg-white text-[#1a2b4c] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-light-error/10 dark:bg-red-500/10 border border-light-error/20 dark:border-red-500/30 text-light-error dark:text-red-200 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center text-light-text-secondary dark:text-slate-500 py-10 animate-pulse">
          Cargando historial...
        </div>
      )}

      {!loading && !error && quotes.length === 0 && (
        <div className="text-center text-light-text-secondary dark:text-slate-500 py-14">
          No hay cotizaciones registradas.
        </div>
      )}

      {!loading &&
        !error &&
        quotes.length > 0 &&
        filteredQuotes.length === 0 && (
          <Card className="overflow-hidden">
            <div className="text-center text-light-text-secondary dark:text-slate-500 py-14">
              No se encontraron cotizaciones.
            </div>
          </Card>
        )}

      {!loading && !error && filteredQuotes.length > 0 && (
        <Card className="overflow-hidden">
          {activeFilterPickerField &&
            showFilters &&
            createPortal(
              <div
                className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
                onClick={closeFilterPicker}>
                <div
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="px-5 py-4 border-b border-gray-100 bg-[#1a2b4c] flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-base uppercase">
                        Filtrar por {filterFieldLabels[activeFilterPickerField]}
                      </h3>
                      <p className="text-[11px] text-gray-300 mt-1">
                        Selecciona un valor para filtrar
                      </p>
                    </div>
                    <button
                      onClick={closeFilterPicker}
                      className="w-8 h-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <Search size={15} className="text-gray-500" />
                      <input
                        value={filterPickerSearch}
                        onChange={(e) => setFilterPickerSearch(e.target.value)}
                        placeholder="Buscar valor..."
                        className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                      />
                    </div>

                    <div className="h-72 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-100">
                      {visibleFilterPickerOptions.length > 0 ?
                        visibleFilterPickerOptions.map((value) => {
                          const isSelected =
                            normalizeSearchText(
                              filters[activeFilterPickerField],
                            ) === normalizeSearchText(value);

                          return (
                            <button
                              key={`${activeFilterPickerField}_${value}`}
                              onClick={() => applyFilterValue(value)}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                isSelected ?
                                  "bg-[#2277B4]/10 text-[#125280] font-semibold"
                                : "text-gray-700 hover:bg-gray-50"
                              }`}>
                              {value}
                            </button>
                          );
                        })
                      : <div className="px-3 py-4 text-sm text-gray-500 text-center">
                          No hay valores para mostrar.
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1 min-h-[38px] flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: "client", label: "Cliente" },
                { id: "status", label: "Estado" },
                { id: "folio", label: "Folio" },
              ].map((button) => {
                const selectedValue = String(filters[button.id] || "");

                return (
                  <button
                    key={button.id}
                    onClick={() => openFilterPicker(button.id)}
                    tabIndex={showFilters ? 0 : -1}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] border transition-all whitespace-nowrap ${
                      selectedValue ?
                        "bg-[#2277B4] text-white border-[#2277B4]"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                    } ${
                      showFilters ?
                        "opacity-100 translate-y-0"
                      : "opacity-0 -translate-y-1 pointer-events-none"
                    }`}>
                    <span className="uppercase font-bold tracking-wide">
                      {button.label}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={clearFilters}
                tabIndex={showFilters && activeFilterCount > 0 ? 0 : -1}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-600 hover:bg-red-50 border border-red-100 transition-all ${
                  showFilters && activeFilterCount > 0 ?
                    "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-1 pointer-events-none"
                }`}>
                <X size={12} /> Limpiar
              </button>
            </div>

            <span className="text-xs text-light-text-secondary">
              {filteredQuotes.length} de {quotes.length} cotización(es)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="uppercase text-xs font-bold tracking-wider text-[#2277B4] border-b border-light-border dark:border-slate-700">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`p-4 ${
                          (
                            header.column.id === "total" ||
                            header.column.id === "status"
                          ) ?
                            "text-right"
                          : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          cursor:
                            header.column.getCanSort() ? "pointer" : "default",
                        }}>
                        <div
                          className={`flex items-center gap-1 ${
                            (
                              header.column.id === "total" ||
                              header.column.id === "status" ||
                              header.column.id === "actions"
                            ) ?
                              "justify-end"
                            : ""
                          }`}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getIsSorted() === "asc" && (
                            <ChevronUp size={14} />
                          )}
                          {header.column.getIsSorted() === "desc" && (
                            <ChevronDown size={14} />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-light-border dark:divide-slate-800">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`p-4 align-middle ${
                          (
                            cell.column.id === "total" ||
                            cell.column.id === "status" ||
                            cell.column.id === "actions"
                          ) ?
                            "text-right"
                          : ""
                        }`}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
