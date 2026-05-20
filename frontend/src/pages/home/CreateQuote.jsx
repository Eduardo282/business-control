import { useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import {
  Building2,
  BadgeDollarSign,
  Edit2,
  ShoppingBag,
  Trash2,
  X,
  ShoppingCart,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Minus,
  CheckCircle2,
  ArrowLeft,
} from "@icons";
import {
  IVA_RATE,
  calculateDiscountedUnitPrice,
  calculateItemTotal,
  calculateQuotePricing,
  normalizeDiscount,
  roundMoney,
} from "@shared/quotePricingRules.js";
import {
  formatCurrency,
  formatDateTime,
  getQuoteStatusLabel,
  normalizeSearchText,
} from "../../utils/formatters";
import DiscountInputCell from "./create-quote/DiscountInputCell";
import GeneratedQuoteView from "./create-quote/GeneratedQuoteView";
import EditItemModal from "./create-quote/EditItemModal";
import ClientSearchModal from "./create-quote/ClientSearchModal";
import ProductSearchModal from "./create-quote/ProductSearchModal";
import QuotePreviewModal from "./create-quote/QuotePreviewModal";
import { useCreateQuote } from "./create-quote/hooks/useCreateQuote";

const roundCurrency = roundMoney;
const clampDiscount = normalizeDiscount;

export default function CreateQuote() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fixedClientId = searchParams.get("client_id");

  const {
    clientSearch,
    setClientSearch,
    selectedClient,
    setSelectedClient,
    selectedContactId,
    setSelectedContactId,
    showClientModal,
    setShowClientModal,
    isClientSearching,
    items,
    setItems,
    prodSearch,
    setProdSearch,
    prodResults,
    isProductSearching,
    selectedProductToAdd,
    qtyToAdd,
    setQtyToAdd,
    showProductModal,
    setShowProductModal,
    showPreviewModal,
    setShowPreviewModal,
    folio,
    setFolio,
    justAdded,
    generatedQuote,
    editingItemDraft,
    setEditingItemDraft,
    loading,
    error,
    setError,
    tableFilter,
    setTableFilter,
    tableSorting,
    setTableSorting,
    showTableFilters,
    setShowTableFilters,
    tableFilters,
    activeTableFilterPickerField,
    tableFilterPickerSearch,
    setTableFilterPickerSearch,
    activeTableFilterCount,
    openTableFilterPicker,
    closeTableFilterPicker,
    applyTableFilterValue,
    clearTableFilters,
    visibleTableFilterPickerOptions,
    selectClient,
    selectProduct,
    addItemDirectly,
    removeItemDirectly,
    closeProductModal,
    addItem,
    openEditItem,
    updateEditingItemField,
    applyItemEdit,
    removeItem,
    save,
    startNewQuote,
    selectedContact,
    portalAutoContactId,
    visibleClientResults,
  } = useCreateQuote(navigate);

  const tableFilterFieldLabels = {
    product: "Producto",
    discount: "Descuento",
    price: "Precio",
  };

  const filteredItemsByFieldFilters = useMemo(() => {
    const hasFieldFilters = Object.values(tableFilters).some(
      (v) => v.trim() !== "",
    );
    if (!hasFieldFilters) return items;

    return items.filter((item) => {
      const productValue = item.name || "";
      const discountValue = `${Number(item.discount || 0).toFixed(2)}%`;
      const priceValue = `$${formatCurrency(item.price)}`;

      return (
        (!tableFilters.product ||
          normalizeSearchText(productValue).includes(
            normalizeSearchText(tableFilters.product),
          )) &&
        (!tableFilters.discount ||
          normalizeSearchText(discountValue) ===
            normalizeSearchText(tableFilters.discount)) &&
        (!tableFilters.price ||
          normalizeSearchText(priceValue) ===
            normalizeSearchText(tableFilters.price))
      );
    });
  }, [items, tableFilters]);

  const itemsColumns = useMemo(
    () => [
      {
        id: "idx",
        header: "#",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-light-text-secondary dark:text-zinc-500 opacity-50">
            {row.index + 1}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: "Producto",
        cell: ({ getValue }) => (
          <span className="font-medium text-light-text-primary dark:text-zinc-100">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Cant",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <span className=" px-2 py-0.5 rounded text-xs font-mono font-bold min-w-[28px] text-center text-black dark:text-zinc-100">
              {row.original.quantity}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "price",
        header: "Precio Unit. (MXN)",
        cell: ({ getValue }) => (
          <span className="font-mono text-light-text-secondary dark:text-zinc-300">
            $
            {Number(getValue()).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        accessorKey: "discount",
        header: "Desc. %",
        cell: ({ row }) => (
          <DiscountInputCell
            item={row.original}
            setItems={setItems}
            clampDiscount={clampDiscount}
            calculateItemTotal={calculateItemTotal}
          />
        ),
      },
      {
        accessorKey: "total",
        header: "Importe",
        cell: ({ getValue }) => (
          <span className="font-mono font-semibold text-light-text-primary dark:text-zinc-100">
            $
            {Number(getValue()).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        id: "totalIva",
        header: "Total + IVA",
        accessorFn: (row) => roundCurrency(row.total * (1 + IVA_RATE)),
        cell: ({ getValue }) => (
          <span className="font-mono font-bold text-[#1B4733] dark:text-emerald-400">
            $
            {Number(getValue()).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => openEditItem(row.original)}
              className="size-7 flex items-center justify-center rounded-lg text-[#2277B4] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-all"
              title="Editar producto">
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => removeItem(row.original.tempId)}
              className="size-7 flex items-center justify-center rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all"
              title="Eliminar item">
              <Trash2 size={13} />
            </button>
          </div>
        ),
      },
    ],
    [items],
  );

  const itemsTable = useReactTable({
    data: filteredItemsByFieldFilters,
    columns: itemsColumns,
    state: { sorting: tableSorting, globalFilter: tableFilter },
    onSortingChange: setTableSorting,
    onGlobalFilterChange: setTableFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _colId, filterValue) => {
      const q = normalizeSearchText(filterValue);
      if (!q) return true;

      const original = row.original;
      const totalIva = roundCurrency(
        (Number(original.total) || 0) * (1 + IVA_RATE),
      );

      return [
        original.name,
        original.quantity,
        original.price,
        original.discount,
        original.total,
        totalIva,
        `$${formatCurrency(original.price)}`,
        `$${formatCurrency(original.total)}`,
        `$${formatCurrency(totalIva)}`,
      ].some((value) => normalizeSearchText(value).includes(q));
    },
    initialState: { pagination: { pageSize: 10 } },
  });

  const productSearchColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Producto",
        cell: ({ row: { original: p } }) => (
          <div>
            <div className="font-bold text-light-text-primary dark:text-zinc-100 text-base flex items-center gap-2">
              {p.name}
              {p._groupCount > 1 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                  x{p._groupCount}
                </span>
              )}
            </div>
            <div className="text-xs text-light-text-secondary dark:text-zinc-400 mt-0.5">
              {p.category}
            </div>
            {p.description && (
              <div className="text-xs text-light-text-secondary dark:text-zinc-500 mt-1 line-clamp-1">
                {p.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "current_price",
        header: "Precio",
        cell: ({ row: { original: p } }) => (
          <div className="text-right">
            <div className="font-mono text-[#1B4733] dark:text-emerald-400 font-bold text-base">
              $
              {Number(p.current_price).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-[10px] text-light-text-secondary dark:text-zinc-400 text-right mt-0.5">
              + IVA
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row: { original: p } }) => {
          const added = justAdded === p.id;
          const currentItem = items.find((i) => i.product_id === p.id);
          const qty = currentItem ? currentItem.quantity : 0;

          return (
            <div className="flex justify-end">
              <div
                className={`flex items-center rounded-lg overflow-hidden font-semibold border shadow-sm ${
                  added ?
                    "border-emerald-400/60"
                  : "border-[#2277B4]/35"
                }`}>
                <button
                  onClick={() => addItemDirectly(p)}
                  className={`h-8 w-8 flex items-center justify-center transition-colors text-white ${
                    added ?
                      "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-[#2277B4] hover:bg-[#125280]"
                  }`}>
                  {added ?
                    <CheckCircle2 size={14} />
                  : <Plus size={14} />}
                </button>
                <div
                  className={`h-8 min-w-[72px] px-2 flex items-center justify-center leading-none text-white border-x whitespace-nowrap ${
                    added ?
                      "bg-emerald-500 border-emerald-400/70"
                    : "bg-[#2277B4] border-[#7fb8de]/70"
                  }`}>
                  {qty > 0 ?
                    <span className="text-xs font-medium">
                      {qty} en lista
                    </span>
                  : <span className="text-xs">Agregar</span>}
                </div>
                <button
                  onClick={() => removeItemDirectly(p)}
                  disabled={qty === 0}
                  className={`h-8 w-8 flex items-center justify-center transition-colors text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 ${
                    added ?
                      "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-[#2277B4] hover:bg-[#125280]"
                  }`}>
                  <Minus size={14} />
                </button>
              </div>
            </div>
          );
        },
      },
    ],
    [items, justAdded],
  );

  const groupedProdResults = useMemo(() => {
    const map = new Map();
    prodResults.forEach((p) => {
      const nName = String(p.name || "").trim().toLowerCase();
      const nCat = String(p.category || "").trim().toLowerCase();
      const key = `${nName}|${nCat}`;
      if (!map.has(key)) {
        map.set(key, { ...p, _groupCount: 1 });
      } else {
        map.get(key)._groupCount += 1;
      }
    });
    return Array.from(map.values());
  }, [prodResults]);

  const productSearchTable = useReactTable({
    data: groupedProdResults,
    columns: productSearchColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const quoteTotals = useMemo(
    () => calculateQuotePricing({ items }),
    [items],
  );
  const grossSubtotal = quoteTotals.grossSubtotal;
  const totalDiscount = quoteTotals.totalDiscount;
  const grandTotal = quoteTotals.subtotal;
  const ivaTotal = quoteTotals.iva;
  const totalWithIva = quoteTotals.total;

  const editingItemTotals = useMemo(
    () =>
      editingItemDraft ?
        calculateQuotePricing({ items: [editingItemDraft] })
      : null,
    [editingItemDraft],
  );

  if (generatedQuote) {
    return (
      <GeneratedQuoteView
        generatedQuote={generatedQuote}
        formatCurrency={formatCurrency}
        formatDateTime={formatDateTime}
        getQuoteStatusLabel={getQuoteStatusLabel}
        navigate={navigate}
        startNewQuote={startNewQuote}
        clampDiscount={clampDiscount}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {error && (
        <div className="text-sm text-light-error dark:text-red-400 bg-light-error/10 dark:bg-red-500/10 p-3 rounded-xl border border-light-error/20 dark:border-red-500/20 animate-fade-in">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Cliente y Totales */}
        <div className="lg:col-span-1 space-y-6">
          {!fixedClientId && (
            <Card className="border-2 border-zinc-200 shadow-sm !overflow-visible z-30">
              <div className="flex justify-between items-center gap-2">
                <div className="flex justify-center items-center">
                  <div className="p-2 rounded-lg text-black">
                    <Building2 size={24} />
                  </div>
                  <h3 className="font-semibold text-lg text-light-text-primary dark:text-zinc-100">
                    Datos del Cliente
                  </h3>
                </div>
              </div>

              <div className="relative z-20">
                <div
                  className={`w-full relative rounded-xl border ${
                    selectedClient ? " " : (
                      "bg-white border-zinc-200 hover:border-[#2277B4]"
                    )
                  }`}>
                  {selectedClient ?
                    <div
                      onClick={() => {
                        setSelectedClient(null);
                        setClientSearch("");
                      }}
                      className="w-full px-3 py-2 text-left cursor-pointer text-[#1B4733] dark:text-emerald-400 font-medium">
                      {selectedClient.business_name}
                    </div>
                  : <div className="relative">
                      <Input
                        value={clientSearch}
                        onFocus={() => setShowClientModal(true)}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setSelectedClient(null);
                          setShowClientModal(true);
                        }}
                        placeholder="Escribe para buscar un cliente…"
                        className="w-full border-none shadow-none focus:ring-0 text-zinc-700 dark:text-zinc-200 bg-transparent"
                        style={{ paddingRight: "2.25rem" }}
                      />
                      <Search
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-zinc-400"
                      />
                    </div>
                  }
                </div>
              </div>

              {selectedClient && (
                <>
                  <div className="mt-4 p-3 rounded-xl animate-fade-in">
                    <div className="text-xs text-emerald-600 font-bold uppercase mb-1">
                      Cliente Seleccionado
                    </div>
                    <div className="text-sm text-light-text-primary dark:text-zinc-100 font-medium">
                      {selectedClient.business_name}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {selectedClient.rfc}
                    </div>
                  </div>

                  {selectedClient.contacts?.length > 0 && (
                    <div className="mt-4 relative animate-fade-in">
                      <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
                        Contacto para cotización
                      </label>
                      <select
                        value={selectedContactId}
                        onChange={(e) => setSelectedContactId(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white dark:bg-dark-900 border border-light-border dark:border-dark-700 focus:border-[#1a2b4c] dark:focus:border-[#2277B4] focus:ring-1 focus:ring-[#1a2b4c] dark:focus:ring-[#2277B4] text-light-text-primary dark:text-zinc-100 text-sm outline-none transition-all">
                        <option value="">-- Sin asignar --</option>
                        {selectedClient.contacts.map((contact) => (
                          <option key={contact.id} value={contact.id} className="dark:bg-dark-900 dark:text-zinc-100">
                            {contact.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {fixedClientId && selectedClient && (
            <Card className="border-2 border-zinc-200 shadow-sm !overflow-visible z-30">
              <div className="flex justify-between items-center gap-2">
                <div className="flex justify-center items-center"> 
                  <div className="p-2 rounded-lg text-black">
                    <Building2 size={24} />
                  </div>
                  <h3 className="font-semibold text-lg text-light-text-primary dark:text-zinc-100">
                    Datos del Cliente
                  </h3>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl animate-fade-in">
                <div className="text-xs text-emerald-600 font-bold uppercase mb-1">
                  Cliente Vinculado
                </div>
                <div className="text-sm text-light-text-primary dark:text-zinc-100 font-medium">
                  {selectedClient.business_name}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {selectedClient.rfc || "Sin RFC"}
                </div>
              </div>

              {selectedClient.contacts?.length > 0 ?
                <div className="mt-4 relative animate-fade-in">
                  <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
                    Contacto para cotización
                  </label>
                  <select
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white dark:bg-dark-900 border border-light-border dark:border-dark-700 focus:border-[#1a2b4c] dark:focus:border-[#2277B4] focus:ring-1 focus:ring-[#1a2b4c] dark:focus:ring-[#2277B4] text-light-text-primary dark:text-zinc-100 text-sm outline-none transition-all">
                    <option value="">-- Sin asignar --</option>
                    {selectedClient.contacts.map((contact) => (
                      <option key={contact.id} value={contact.id} className="dark:bg-dark-900 dark:text-zinc-100">
                        {contact.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              : <div className="mt-4 p-3 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-sm">
                  Este cliente no tiene contactos registrados. Agrégalo desde
                  Gestionar cliente y vuelve a esta cotización.
                </div>
              }
            </Card>
          )}

          <Card
            className={`sticky top-24${!selectedClient || items.length === 0 ? "opacity-40 pointer-events-none select-none grayscale" : "transition-all duration-500"}`}>
            <button
              onClick={() => {
                const homoclave =
                  (selectedClient?.rfc || "GEN")
                    .replace(/[^A-Z0-9]/gi, "")
                    .slice(-3)
                    .toUpperCase() || "GEN";
                const random = Math.random()
                  .toString(36)
                  .substring(2, 8)
                  .toUpperCase();
                setFolio(`COT-${homoclave}-${random}`);
                setShowPreviewModal(true);
              }}
              disabled={loading || !selectedClient || items.length === 0}
              className="w-full justify-center py-4 bg-[#2277B4] hover:bg-[#125280] shadow-lg shadow-[#12528050] text-white rounded-xl font-bold text-lg">
              {loading ? "Procesando…" : "Ver Vista Previa"}
            </button>
          </Card>
        </div>

        {/* Columna derecha: Partidas */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="!overflow-visible z-30">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg text-black mb-1">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-light-text-primary dark:text-zinc-100">
                    Agregar Productos o Servicios
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <button
                  variant="ghost"
                  onClick={() => navigate("/cotizaciones/historial")}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold text-black dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent transition-all">
                  <ArrowLeft size={16} /> Regresar a historial
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-end p-4 rounded-xl dark:border-white/5">
              <div className="flex-1 w-full relative z-10"> 
                <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
                  Producto
                </label>
                <div className="relative">
                  <Input
                    value={prodSearch}
                    onFocus={() => setShowProductModal(true)}
                    onChange={(e) => {
                      setProdSearch(e.target.value);
                      setShowProductModal(true);
                    }}
                    placeholder="Buscar producto o servicio…"
                    className="glass-input bg-light-bg dark:!bg-black/30 text-light-text-primary dark:text-white border-light-border dark:border-white/10"
                    style={{ paddingRight: "2.25rem" }}
                  />
                  <Search
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary"
                  />
                </div>
              </div>

              <div className="flex-1 w-full relative">
                <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
                  Filtrar en la tabla
                </label>
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-zinc-400"
                  />
                  <input
                    type="text"
                    placeholder="Filtrar productos agregados…"
                    value={tableFilter}
                    onChange={(e) => setTableFilter(e.target.value)}
                    className="pl-3 pr-8 py-2.5 text-sm rounded-xl border border-light-border dark:border-white/10 bg-white dark:bg-black/30 focus:outline-none focus:ring-1 focus:ring-[#2277B4] w-full text-black dark:text-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </Card>

          {activeTableFilterPickerField &&
            createPortal(
              <div
                className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
                onClick={closeTableFilterPicker}>
                <div
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="px-5 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-base uppercase">
                        Filtrar por{" "}
                        {tableFilterFieldLabels[activeTableFilterPickerField]}
                      </h3>
                      <p className="text-[11px] text-zinc-300 mt-1">
                        Selecciona o busca un valor
                      </p>
                    </div>
                    <button
                      onClick={closeTableFilterPicker}
                      className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                      <Search size={15} className="text-zinc-500" />
                      <input
                        value={tableFilterPickerSearch}
                        onChange={(e) =>
                          setTableFilterPickerSearch(e.target.value)
                        }
                        placeholder="Buscar valor…"
                        className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                      />
                    </div>

                    <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 divide-y divide-zinc-100">
                      {visibleTableFilterPickerOptions.length > 0 ?
                        visibleTableFilterPickerOptions.map((value) => {
                          const isSelected =
                            normalizeSearchText(
                              tableFilters[activeTableFilterPickerField],
                            ) === normalizeSearchText(value);

                          return (
                            <button
                              key={`${activeTableFilterPickerField}_${value}`}
                              onClick={() => applyTableFilterValue(value)}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                isSelected ?
                                  "bg-[#2277B4]/10 text-[#125280] font-semibold"
                                : "text-zinc-700 hover:bg-zinc-50"
                              }`}>
                              {value}
                            </button>
                          );
                        })
                      : <div className="px-3 py-4 text-sm text-zinc-500 text-center">
                          No hay valores para mostrar.
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* Tabla TanStack */}
          <div
            className={`glass-panel overflow-hidden rounded-xl border border-light-border dark:border-white/10 ${!selectedClient || items.length === 0 ? "opacity-40 pointer-events-none select-none grayscale relative" : "transition-all duration-500"}`}>
            {(!selectedClient || items.length === 0) && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-[2px]">
                <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg mb-3">
                  <BadgeDollarSign size={32} className="text-zinc-400" />
                </div>
                <p className="text-zinc-600 dark:text-zinc-200 font-semibold max-w-sm text-center px-4">
                  Agrega "Datos del Cliente y Agrega Productos" para habilitar.
                </p>
              </div>
            )}
            {/* Contador */}
            {items.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() =>
                      setShowTableFilters((prev) => {
                        const next = !prev;
                        if (!next) closeTableFilterPicker();
                        return next;
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold border transition-colors whitespace-nowrap ${
                      showTableFilters || activeTableFilterCount > 0 ?
                        "bg-[#2277B4] text-white border-[#2277B4]"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}>
                    <SlidersHorizontal size={12} /> Filtros
                    {activeTableFilterCount > 0 && (
                      <span className="ml-0.5 bg-white text-[#1a2b4c] text-[10px] font-bold rounded-full size-4 flex items-center justify-center leading-none">
                        {activeTableFilterCount}
                      </span>
                    )}
                  </button>

                  {showTableFilters &&
                    [
                      { id: "product", label: "Producto" },
                      { id: "discount", label: "Descuento" },
                      { id: "price", label: "Precio" },
                    ].map((button) => {
                      const selectedValue = String(
                        tableFilters[button.id] || "",
                      );

                      return (
                        <button
                          key={button.id}
                          onClick={() => openTableFilterPicker(button.id)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] border transition-colors whitespace-nowrap ${
                            selectedValue ?
                              "bg-[#2277B4] text-white border-[#2277B4]"
                            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          }`}>
                          <span className="uppercase font-bold tracking-wide">
                            {button.label}
                          </span>
                        </button>
                      );
                    })}

                  {showTableFilters && activeTableFilterCount > 0 && (
                    <button
                      onClick={clearTableFilters}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-600 hover:bg-red-50 border border-red-100 transition-colors">
                      <X size={12} /> Limpiar
                    </button>
                  )}
                </div>

                <span className="text-xs text-light-text-secondary">
                  Pág. {itemsTable.getState().pagination.pageIndex + 1} de{" "}
                  {Math.max(1, itemsTable.getPageCount())}
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-light-bg/50 dark:bg-dark-800 uppercase text-xs font-bold text-[#2277B4] dark:text-blue-400 tracking-wider">
                  {itemsTable.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className={`p-3 whitespace-nowrap select-none ${
                            header.id === "totalIva" ?
                              "text-right text-[#1B4733]"
                            : header.id === "quantity" ? "text-center"
                            : (
                              ["price", "discount", "total"].includes(header.id)
                            ) ?
                              "text-right"
                            : header.id === "actions" ? "w-28 text-right"
                            : ""
                          } ${
                            header.column.getCanSort() ?
                              "cursor-pointer hover:bg-zinc-100 transition-colors"
                            : ""
                          }`}>
                          <span className="inline-flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getIsSorted() === "asc" && (
                              <ChevronUp size={11} />
                            )}
                            {header.column.getIsSorted() === "desc" && (
                              <ChevronDown size={11} />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-light-border">
                  {itemsTable.getRowModel().rows.length > 0 ?
                    itemsTable.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-light-bg/50 transition-colors group animate-fade-in">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={`p-3 ${
                              cell.column.id === "totalIva" ? "text-right"
                              : cell.column.id === "quantity" ? "text-center"
                              : (
                                ["price", "discount", "total"].includes(
                                  cell.column.id,
                                )
                              ) ?
                                "text-right"
                              : cell.column.id === "actions" ? "text-right"
                              : ""
                            }`}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  : <tr>
                      <td colSpan="8" className="py-16 text-center">
                        <div className="flex justify-center mb-3 opacity-20">
                          <ShoppingCart size={40} />
                        </div>
                        <p className="text-light-text-secondary text-sm font-medium">
                          {items.length === 0 ?
                            "No se han agregado productos a la cotización."
                          : "Sin resultados para el filtro aplicado."}
                        </p>
                        {items.length === 0 && (
                          <p className="text-light-text-secondary text-xs mt-1">
                            Utiliza el formulario de arriba para añadir items.
                          </p>
                        )}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {items.length > 0 && (
              <div className="px-4 py-3 border-t border-light-border dark:border-dark-700 bg-white dark:bg-dark-800 flex items-center justify-between gap-3 flex-wrap">
                <label className="text-sm text-light-text-secondary dark:text-zinc-400 flex items-center gap-2">
                  Mostrar
                  <select
                    value={itemsTable.getState().pagination.pageSize}
                    onChange={(e) => {
                      itemsTable.setPageSize(Number(e.target.value));
                      itemsTable.setPageIndex(0);
                    }}
                    className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-500 bg-[#fff] dark:bg-dark-900 border border-light-border dark:border-dark-700">
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size} className="dark:bg-dark-900 dark:text-zinc-100">
                        {size}
                      </option>
                    ))}
                  </select>
                  por página
                </label>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => itemsTable.setPageIndex(0)}
                    disabled={!itemsTable.getCanPreviousPage()}
                    className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    ««
                  </button>
                  <button
                    onClick={() => itemsTable.previousPage()}
                    disabled={!itemsTable.getCanPreviousPage()}
                    className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Anterior
                  </button>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mx-2">
                    Pág. {itemsTable.getState().pagination.pageIndex + 1} de {itemsTable.getPageCount()}
                  </span>
                  <button
                    onClick={() => itemsTable.nextPage()}
                    disabled={!itemsTable.getCanNextPage()}
                    className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Siguiente
                  </button>
                  <button
                    onClick={() =>
                      itemsTable.setPageIndex(itemsTable.getPageCount() - 1)
                    }
                    disabled={!itemsTable.getCanNextPage()}
                    className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    »»
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditItemModal
        editingItemDraft={editingItemDraft}
        editingItemTotals={editingItemTotals}
        formatCurrency={formatCurrency}
        onClose={() => setEditingItemDraft(null)}
        onApply={applyItemEdit}
        onChangeField={updateEditingItemField}
      />

      <ClientSearchModal
        isOpen={showClientModal}
        clientSearch={clientSearch}
        isClientSearching={isClientSearching}
        clientResults={clientResults}
        visibleClientResults={visibleClientResults}
        onClose={() => setShowClientModal(false)}
        onSearchChange={(value) => {
          setClientSearch(value);
          setSelectedClient(null);
        }}
        onSelectClient={selectClient}
      />

      <ProductSearchModal
        isOpen={showProductModal}
        prodSearch={prodSearch}
        onSearchChange={(value) => {
          setProdSearch(value);
        }}
        onClose={closeProductModal}
        productSearchTable={productSearchTable}
        isProductSearching={isProductSearching}
        prodResults={prodResults}
      />

      <QuotePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        selectedClient={selectedClient}
        selectedContact={selectedContact}
        folio={folio}
        items={items}
        totals={{
          grossSubtotal,
          totalDiscount,
          grandTotal,
          ivaTotal,
          totalWithIva,
        }}
        clampDiscount={clampDiscount}
        calculateDiscountedUnitPrice={calculateDiscountedUnitPrice}
        onSave={save}
        loading={loading}
      />
    </div>
  );
}
