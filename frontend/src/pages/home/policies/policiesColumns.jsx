import React from "react";
import { ExternalLink, Trash2 } from "@icons";
import { formatSaleDateTime, formatSaleMoney, getSaleProductsSummary } from "./usePolicies";

export function createPoliciesColumns({ openSaleSummary, handleDeleteSale }) {
  return [
    {
      id: "sale",
      header: "Cotización",
      accessorFn: (row) => row.folio || row.id,
      cell: ({ row }) => {
        const sale = row.original;
        return (
          <div>
            <div className="font-bold text-zinc-900 dark:text-zinc-100">
              Cotización #{sale.id}
            </div>
            <code className="mt-1 inline-flex rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-[#2277B4] dark:bg-blue-500/10 dark:text-blue-300">
              {sale.folio || "Sin folio"}
            </code>
          </div>
        );
      },
    },
    {
      id: "client",
      header: "Cliente",
      accessorFn: (row) => row.client?.business_name || "",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-zinc-800 dark:text-zinc-100">
            {row.original.client?.business_name || "Sin cliente"}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Cliente de la cotización
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contacto",
      accessorFn: (row) => row.contact?.full_name || "",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-zinc-700 dark:text-zinc-200">
            {row.original.contact?.full_name || "Sin contacto"}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {row.original.contact?.email || "—"}
          </div>
        </div>
      ),
    },
    {
      id: "products",
      header: "Productos",
      accessorFn: (row) => getSaleProductsSummary(row).title,
      cell: ({ row }) => {
        const summary = getSaleProductsSummary(row.original);
        return (
          <div>
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">
              {summary.title}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {summary.detail}
            </div>
          </div>
        );
      },
    },
    {
      id: "total",
      header: "Total",
      accessorFn: (row) => Number(row.total) || 0,
      cell: ({ row }) => (
        <div className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-300">
          {formatSaleMoney(row.original.total)}
        </div>
      ),
    },
    {
      id: "saleDate",
      header: "Fecha cotización",
      accessorFn: (row) => row.registered_at || row.created_at || "",
      cell: ({ row }) => (
        <div className="text-zinc-700 dark:text-zinc-300">
          {formatSaleDateTime(row.original.registered_at || row.original.created_at)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openSaleSummary(row.original)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-[#2277B4] transition-colors hover:bg-blue-50 dark:border-blue-500/20 dark:bg-dark-900 dark:text-blue-300 dark:hover:bg-blue-500/10"
          >
            <ExternalLink size={14} /> Ver
          </button>
          <button
            type="button"
            onClick={() => handleDeleteSale(row.original)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:bg-dark-900 dark:text-red-300 dark:hover:bg-red-500/10"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      ),
    },
  ];
}
