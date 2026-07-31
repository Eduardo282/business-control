import { useMemo } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CheckCircle2, Edit2, Minus, Plus, Trash2 } from "@icons";
import {
  IVA_RATE,
  calculateItemTotal,
  normalizeDiscount,
  roundMoney,
} from "@shared/quotePricingRules.js";
import {
  formatCurrency,
  normalizeSearchText,
} from "../../../../utils/formatters";
import DiscountInputCell from "../DiscountInputCell";
import QuoteProductVariantSelect from "../QuoteProductVariantSelect";
import {
  groupQuoteProductResults,
  inferQuoteProductType,
} from "../productGrouping";

const roundCurrency = roundMoney;
const clampDiscount = normalizeDiscount;

export function useCreateQuoteTables({
  items,
  setItems,
  tableFilter,
  setTableFilter,
  tableSorting,
  setTableSorting,
  tableFilters,
  openEditItem,
  removeItem,
  prodResults,
  productTypeFilter,
  selectedProductByGroup,
  setSelectedProductByGroup,
  justAdded,
  addItemDirectly,
  removeItemDirectly,
}) {
  const filteredItemsByFieldFilters = useMemo(() => {
    const hasFieldFilters = Object.values(tableFilters).some(
      (value) => value.trim() !== "",
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
        cell: ({ row, getValue }) => (
          <div className="min-w-0">
            <span className="font-medium text-light-text-primary dark:text-zinc-100">
              {getValue()}
            </span>
            {row.original.folio && (
              <div className="text-[11px] font-mono font-semibold text-[#2277B4] dark:text-blue-400 mt-0.5">
                {row.original.folio}
              </div>
            )}
          </div>
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
              title="Editar producto"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => removeItem(row.original.tempId)}
              className="size-7 flex items-center justify-center rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all"
              title="Eliminar item"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ),
      },
    ],
    [openEditItem, removeItem, setItems],
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
      const query = normalizeSearchText(filterValue);
      if (!query) return true;

      const original = row.original;
      const totalIva = roundCurrency(
        (Number(original.total) || 0) * (1 + IVA_RATE),
      );

      return [
        original.name,
        original.folio,
        original.quantity,
        original.price,
        original.discount,
        original.total,
        totalIva,
        `$${formatCurrency(original.price)}`,
        `$${formatCurrency(original.total)}`,
        `$${formatCurrency(totalIva)}`,
      ].some((value) => normalizeSearchText(value).includes(query));
    },
    initialState: { pagination: { pageSize: 10 } },
  });

  const productSearchColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Producto",
        cell: ({ row: { original: product } }) => (
          <div>
            <div className="font-bold text-light-text-primary dark:text-zinc-100 text-base flex items-center gap-2">
              {product.name}
              {product._groupCount > 1 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-dark-800 shadow-sm">
                  x{product._groupCount}
                </span>
              )}
            </div>
            <div className="text-xs text-light-text-secondary dark:text-zinc-400 mt-0.5">
              {product.category}
            </div>
            {product.folio && (
              <div className="text-[11px] font-mono font-semibold text-[#2277B4] dark:text-blue-400 mt-0.5">
                Folio: {product.folio}
              </div>
            )}
            <QuoteProductVariantSelect
              product={product}
              onSelectVariant={(groupKey, productId) => {
                setSelectedProductByGroup((current) => ({
                  ...current,
                  [groupKey]: productId,
                }));
              }}
            />
            {product.description && (
              <div className="text-xs text-light-text-secondary dark:text-zinc-500 mt-1 line-clamp-1">
                {product.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "current_price",
        header: "Precio",
        cell: ({ row: { original: product } }) => (
          <div className="text-right">
            <div className="font-mono text-[#1B4733] dark:text-emerald-400 font-bold text-base">
              $
              {Number(product.current_price).toLocaleString("es-MX", {
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
        cell: ({ row: { original: product } }) => {
          const added = justAdded === product.id;
          const currentItem = items.find(
            (item) => item.product_id === product.id,
          );
          const quantity = currentItem ? currentItem.quantity : 0;

          return (
            <div className="flex justify-end">
              <div
                className={`flex items-center rounded-lg overflow-hidden font-semibold border shadow-sm ${
                  added ?
                    "border-emerald-400/60"
                  : "border-[#2277B4]/35"
                }`}
              >
                <button
                  onClick={() => addItemDirectly(product)}
                  className={`h-8 w-8 flex items-center justify-center transition-colors text-white ${
                    added ?
                      "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-[#2277B4] hover:bg-[#125280]"
                  }`}
                >
                  {added ?
                    <CheckCircle2 size={14} />
                  : <Plus size={14} />}
                </button>
                <div
                  className={`h-8 min-w-[72px] px-2 flex items-center justify-center leading-none text-white border-x whitespace-nowrap ${
                    added ?
                      "bg-emerald-500 border-emerald-400/70"
                    : "bg-[#2277B4] border-[#7fb8de]/70"
                  }`}
                >
                  {quantity > 0 ?
                    <span className="text-xs font-medium">
                      {quantity} en lista
                    </span>
                  : <span className="text-xs">Agregar</span>}
                </div>
                <button
                  onClick={() => removeItemDirectly(product)}
                  disabled={quantity === 0}
                  className={`h-8 w-8 flex items-center justify-center transition-colors text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500 ${
                    added ?
                      "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-[#2277B4] hover:bg-[#125280]"
                  }`}
                >
                  <Minus size={14} />
                </button>
              </div>
            </div>
          );
        },
      },
    ],
    [
      addItemDirectly,
      items,
      justAdded,
      removeItemDirectly,
      setSelectedProductByGroup,
    ],
  );

  const filteredProdResults = useMemo(
    () =>
      productTypeFilter
        ? prodResults.filter(
            (product) =>
              inferQuoteProductType(product) === productTypeFilter,
          )
        : prodResults,
    [prodResults, productTypeFilter],
  );

  const groupedProdResults = useMemo(
    () =>
      groupQuoteProductResults(
        filteredProdResults,
        selectedProductByGroup,
      ),
    [filteredProdResults, selectedProductByGroup],
  );

  const productSearchTable = useReactTable({
    data: groupedProdResults,
    columns: productSearchColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return {
    groupedProdResults,
    itemsTable,
    productSearchTable,
  };
}
