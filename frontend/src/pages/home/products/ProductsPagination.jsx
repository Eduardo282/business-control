import React from "react";

export function ProductsPagination({ pagination, setPagination, table }) {
  return (
    <div className="px-5 py-3 border-t border-white/60 dark:border-white/10 flex items-center justify-between bg-white/30 dark:bg-dark-900/30 backdrop-blur-md">
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
          className="px-2.5 py-1 rounded-xl border border-white/80 dark:border-white/15 text-[12px] text-zinc-700 dark:text-zinc-300 bg-white/70 dark:bg-dark-900/70 backdrop-blur-md shadow-glass-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 dark:[color-scheme:dark] transition-all"
        >
          {[10, 25, 50, 100].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="px-2.5 py-1.5 rounded-xl border border-white/80 dark:border-white/15 bg-white/60 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 text-[12px] font-semibold hover:bg-white/95 dark:hover:bg-white/10 transition-all disabled:opacity-40 shadow-glass-sm"
        >
          ««
        </button>
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1.5 rounded-xl border border-white/80 dark:border-white/15 bg-white/60 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 text-[12px] font-semibold hover:bg-white/95 dark:hover:bg-white/10 transition-all disabled:opacity-40 shadow-glass-sm"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1.5 rounded-xl border border-white/80 dark:border-white/15 bg-white/60 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 text-[12px] font-semibold hover:bg-white/95 dark:hover:bg-white/10 transition-all disabled:opacity-40 shadow-glass-sm"
        >
          Siguiente
        </button>
        <button
          type="button"
          onClick={() =>
            table.setPageIndex(table.getPageCount() - 1)
          }
          disabled={!table.getCanNextPage()}
          className="px-2.5 py-1.5 rounded-xl border border-white/80 dark:border-white/15 bg-white/60 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 text-[12px] font-semibold hover:bg-white/95 dark:hover:bg-white/10 transition-all disabled:opacity-40 shadow-glass-sm"
        >
          »»
        </button>
      </div>
    </div>
  );
}
