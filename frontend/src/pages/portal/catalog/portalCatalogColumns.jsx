import React from "react";
import { ChevronDown, Minus, Plus } from "@icons";
import { getProductIcon } from "../productPresentation";

export function createPortalCatalogColumns({
  getQuantity,
  updateCart,
  setSelectedProduct,
  setActiveFolioGroup,
}) {
  return [
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ getValue }) => (
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-900 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md whitespace-nowrap border border-transparent dark:border-zinc-700">
          {getValue()}
        </span>
      ),
      size: 180,
    },
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const p = row.original;
        const name = p.name;
        const groupCount = p._groupCount || 1;
        const Logo = getProductIcon(p);
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/15 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                <Logo size={16} />
              </span>
              {groupCount > 1 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 dark:bg-blue-400 text-white dark:text-blue-950 text-[9px] font-bold px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center border border-white dark:border-zinc-900 shadow-sm">
                  x{groupCount}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">{name}</span>
              <div className="flex items-center gap-1">
                {p.folio && (
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-wider uppercase">
                    {p.folio}
                  </span>
                )}
                {groupCount > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveFolioGroup({
                        key: p._groupKey,
                        name: p.name,
                        items: p._groupItems,
                        selectedId: p.id,
                      })
                    }
                    className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/15 px-1 py-0.5 rounded transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
                    aria-label={`Ver ${groupCount} folios de ${name}`}
                  >
                    <ChevronDown size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Descripción",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {getValue()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => {
        const id = row.original.id;
        const qty = getQuantity(id);
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedProduct(row.original)}
              className="px-3 py-1.5 text-xs font-bold text-[#2277B4] dark:text-blue-400 hover:text-[#1a2b4c] dark:hover:text-blue-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500 rounded-lg shadow-sm dark:shadow-black/20 transition-all duration-150 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
            >
              Detalles
            </button>
            {qty === 0 ? (
              <button
                type="button"
                onClick={() => updateCart(id, 1)}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/30"
              >
                <Plus size={12} /> Solicitar cotización
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 shadow-sm dark:shadow-black/20 w-fit">
                <button
                  type="button"
                  onClick={() => updateCart(id, -1)}
                  className="size-7 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="font-bold text-zinc-800 dark:text-zinc-100 min-w-[1.25rem] text-center text-xs">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => updateCart(id, 1)}
                  className="size-7 flex items-center justify-center text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 rounded-md transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        );
      },
      size: 240,
    },
  ];
}
