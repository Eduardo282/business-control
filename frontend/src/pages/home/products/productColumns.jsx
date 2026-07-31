import React from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ExternalLink, Trash2, Users } from "@icons";
import { formatPrice, inferProductType, ProductAvatar } from "./productHelpers";

export function createProductColumns({ user, onOpenFolioGroup, onRemove }) {
  return [
    {
      id: "product",
      header: "PRODUCTO",
      accessorFn: (p) => p.name,
      enableSorting: true,
      cell: ({ row: { original: p } }) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <ProductAvatar name={p.name} category={p.category} />
            {p._groupCount > 1 && (
              <span className="absolute -top-1 -right-2 bg-blue-500 dark:bg-blue-500 text-white dark:text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 border-2 border-white dark:border-dark-800 shadow-sm dark:shadow-black/30">
                x{p._groupCount}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-[13px] tracking-tight truncate max-w-[200px] sm:max-w-xs">
              {p.name}
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate max-w-[200px] sm:max-w-xs">
              {p.description || "Sin descripción"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "folio",
      header: "FOLIO",
      enableSorting: true,
      cell: ({ row: { original: p }, getValue }) => {
        const folio = getValue() || "—";

        if (p._groupCount <= 1) {
          return (
            <span className="font-mono text-[12px] font-bold text-[#2277B4] dark:text-blue-400 tracking-wider whitespace-nowrap">
              {folio}
            </span>
          );
        }

        return (
          <button
            type="button"
            onClick={() =>
              onOpenFolioGroup({
                key: p._groupKey,
                name: p.name,
                items: p._groupItems,
                selectedId: p.id,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-mono text-[12px] font-bold tracking-wider text-[#2277B4] transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
            aria-label={`Ver ${p._groupCount} folios de ${p.name}`}
          >
            {folio}
            <ChevronDown size={14} />
          </button>
        );
      },
    },
    {
      accessorKey: "category",
      header: "CATEGORÍA",
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="inline-flex px-2 py-1 bg-zinc-100 dark:bg-dark-700 text-zinc-600 dark:text-zinc-300 rounded text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: "current_price",
      header: "PRECIO",
      enableSorting: true,
      cell: ({ getValue }) => (
        <div className="text-right sm:text-left">
          <span className="font-medium text-zinc-800 dark:text-zinc-100 text-[13px]">
            ${formatPrice(getValue())}
          </span>
          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">MXN</span>
        </div>
      ),
    },
    {
      accessorKey: "users_count",
      header: "LÍMITE USUARIOS.",
      enableSorting: true,
      cell: ({ row: { original: p }, getValue }) => {
        const type = inferProductType(p);
        const isServiceOrPolicy = type === "SERVICE" || type === "POLICY";
        const v = isServiceOrPolicy ? 1 : getValue();

        if (!v) return <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            <Users size={12} className="text-zinc-400 dark:text-zinc-500" />{" "}
            {v}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "ACCIONES",
      enableSorting: false,
      cell: ({ row: { original: p } }) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/productos/${p.id}`}
            className="px-4 py-1.5 text-sm font-semibold text-[#2277B4] dark:text-primary-400 bg-white dark:bg-dark-800 rounded-xl border border-[#CBD5E1] dark:border-dark-700 hover:bg-[#F8FAFC] dark:hover:bg-dark-700 hover:border-[#B8C6D8] dark:hover:border-zinc-600 shadow-sm dark:shadow-black/20 transition-colors duration-150 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
          >
            <ExternalLink size={16} /> Detalles
          </Link>
          {user?.role?.name !== "SOPORTE" && (
            <button
              onClick={() => onRemove(p.id)}
              className="px-3 py-1.5 rounded-lg text-red-800 dark:text-red-400 transition-all text-sm font-bold border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1 hover:scale-90 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/40"
              title="Eliminar producto"
            >
              <Trash2 size={16} className="text-red-700 dark:text-red-400" />
            </button>
          )}
        </div>
      ),
    },
  ];
}
