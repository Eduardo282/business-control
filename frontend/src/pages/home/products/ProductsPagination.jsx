import React from "react";

export function ProductsPagination({ pagination, setPagination, table }) {
  return (
    <div className="px-5 py-3 border-t border-zinc-100 dark:border-dark-700 flex items-center justify-between bg-zinc-50/50 dark:bg-dark-900/50">
      <label className="text-[12px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
        Mostrar
        <select
          value={pagination.pageSize}
          onChange={(e) =>
            setPagination({
              pageIndex: 0,
              pageSize: Number(e.target.value),
            })
          }
          className="px-2 py-1 rounded-md border border-zinc-200 dark:border-dark-700 text-[12px] text-zinc-700 dark:text-zinc-300 bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 dark:[color-scheme:dark] transition-colors"
        >
          {[10, 25, 50, 100].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="px-2 py-1.5 rounded-md border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-400 text-[12px] font-medium hover:bg-zinc-50 dark:hover:bg-dark-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-dark-900 shadow-sm"
        >
          ««
        </button>
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-400 text-[12px] font-medium hover:bg-zinc-50 dark:hover:bg-dark-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-dark-900 shadow-sm"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-400 text-[12px] font-medium hover:bg-zinc-50 dark:hover:bg-dark-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-dark-900 shadow-sm"
        >
          Siguiente
        </button>
        <button
          type="button"
          onClick={() =>
            table.setPageIndex(table.getPageCount() - 1)
          }
          disabled={!table.getCanNextPage()}
          className="px-2 py-1.5 rounded-md border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-400 text-[12px] font-medium hover:bg-zinc-50 dark:hover:bg-dark-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-dark-900 shadow-sm"
        >
          »»
        </button>
      </div>
    </div>
  );
}
