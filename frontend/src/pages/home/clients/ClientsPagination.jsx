import { CLIENT_PAGE_SIZES } from "./clientConstants";

export default function ClientsPagination({ clientCount, table }) {
  if (clientCount === 0) return null;

  return (
    <div className="px-5 py-3.5 border-t border-white/60 dark:border-white/10 bg-white/30 dark:bg-dark-900/30 backdrop-blur-md flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Mostrar
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(event) => table.setPageSize(Number(event.target.value))}
          className="px-2.5 py-1 rounded-xl text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465]/30 dark:focus:ring-blue-400/30 focus:border-[#153465] dark:focus:border-blue-400 bg-white/75 dark:bg-dark-900/75 border border-white/80 dark:border-white/15 dark:[color-scheme:dark] shadow-glass-sm transition-all"
        >
          {CLIENT_PAGE_SIZES.map((size) => (
            <option
              key={size}
              value={size}
              className="dark:bg-dark-900 dark:text-zinc-100"
            >
              {size}
            </option>
          ))}
        </select>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          por página
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="px-2.5 py-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-xl hover:bg-white/95 dark:hover:bg-white/10 shadow-glass-sm disabled:opacity-40 disabled:bg-white/30 disabled:text-zinc-400 dark:disabled:bg-dark-800 dark:disabled:text-zinc-600 disabled:cursor-not-allowed transition-all"
        >
          ««
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-xl hover:bg-white/95 dark:hover:bg-white/10 shadow-glass-sm disabled:opacity-40 disabled:bg-white/30 disabled:text-zinc-400 dark:disabled:bg-dark-800 dark:disabled:text-zinc-600 disabled:cursor-not-allowed transition-all"
        >
          Anterior
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-xl hover:bg-white/95 dark:hover:bg-white/10 shadow-glass-sm disabled:opacity-40 disabled:bg-white/30 disabled:text-zinc-400 dark:disabled:bg-dark-800 dark:disabled:text-zinc-600 disabled:cursor-not-allowed transition-all"
        >
          Siguiente
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className="px-2.5 py-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-xl hover:bg-white/95 dark:hover:bg-white/10 shadow-glass-sm disabled:opacity-40 disabled:bg-white/30 disabled:text-zinc-400 dark:disabled:bg-dark-800 dark:disabled:text-zinc-600 disabled:cursor-not-allowed transition-all"
        >
          »»
        </button>
      </div>
    </div>
  );
}
