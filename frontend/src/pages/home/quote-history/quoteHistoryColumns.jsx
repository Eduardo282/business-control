import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trash2 } from "@icons";
import { RejectQuoteButton, StatusCell } from "./quoteHistoryHelpers";

export function createQuoteHistoryColumns({ user, handleStatusChange, handleDeleteQuote }) {
  return [
    {
      accessorKey: "id",
      header: "Cotización",
      cell: ({ row }) => (
        <div className="font-bold text-light-text-primary dark:text-zinc-100">
          Cotización #{row.original.id}
        </div>
      ),
    },
    {
      accessorKey: "folio",
      header: "Folio",
      cell: ({ row }) => (
        <div className="text-sm font-mono font-bold text-[#2277B4] dark:text-blue-400 tracking-wider">
          {row.original.folio || "—"}
        </div>
      ),
    },
    {
      accessorKey: "client.business_name",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="text-sm text-light-text-secondary dark:text-zinc-400">
          {row.original.client?.business_name || "—"}
        </div>
      ),
    },
    {
      accessorKey: "contact.full_name",
      header: "Contacto",
      cell: ({ row }) => (
        <div className="text-sm text-light-text-secondary dark:text-zinc-400">
          {row.original.contact?.full_name || "Sin contacto"}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Fecha",
      cell: ({ row }) => (
        <div className="text-sm text-light-text-secondary dark:text-zinc-400" suppressHydrationWarning>
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
        <div className="font-bold text-stone-600 dark:text-zinc-300 text-right">
          $
          {Number(row.original.total || 0).toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <StatusCell row={row} handleStatusChange={handleStatusChange} />
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/cotizaciones/${row.original.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#2277B4] dark:text-blue-400 bg-white dark:bg-dark-800 rounded-lg border border-[#CBD5E1] dark:border-zinc-600 hover:bg-[#F8FAFC] dark:hover:bg-dark-700 hover:border-[#B8C6D8] dark:hover:border-zinc-500 shadow-sm transition-colors duration-150">
            <ExternalLink size={14} /> Ver
          </Link>
          {user?.role?.name !== "SOPORTE" && (
            <>
              <RejectQuoteButton
                quote={row.original}
                onReject={handleStatusChange}
              />
              <button
                type="button"
                onClick={() => handleDeleteQuote(row.original.id)}
                className="size-8 inline-flex items-center justify-center rounded-lg text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="Eliminar cotización">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];
}
