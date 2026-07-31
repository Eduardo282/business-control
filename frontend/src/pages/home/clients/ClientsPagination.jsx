import { CLIENT_PAGE_SIZES } from "./clientConstants";

export default function ClientsPagination({ clientCount, table }) {
  if (clientCount === 0) return null;

  return (
    <div className="px-4 py-3 border-t border-zinc-100 dark:border-dark-700 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Mostrar
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(event) => table.setPageSize(Number(event.target.value))}
          className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465]/30 dark:focus:ring-blue-400/30 focus:border-[#153465] dark:focus:border-blue-400 bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 dark:[color-scheme:dark] transition-colors"
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
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          por página
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:bg-zinc-50 disabled:text-zinc-400 dark:disabled:bg-dark-800 dark:disabled:text-zinc-600 disabled:hover:bg-zinc-50 dark:disabled:hover:bg-dark-800 disabled:cursor-not-allowed transition-colors"
        >
          ««
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:bg-zinc-50 disabled:text-zinc-400 dark:disabled:bg-dark-800 dark:disabled:text-zinc-600 disabled:hover:bg-zinc-50 dark:disabled:hover:bg-dark-800 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:bg-zinc-50 disabled:text-zinc-400 dark:disabled:bg-dark-800 dark:disabled:text-zinc-600 disabled:hover:bg-zinc-50 dark:disabled:hover:bg-dark-800 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:bg-zinc-50 disabled:text-zinc-400 dark:disabled:bg-dark-800 dark:disabled:text-zinc-600 disabled:hover:bg-zinc-50 dark:disabled:hover:bg-dark-800 disabled:cursor-not-allowed transition-colors"
        >
          »»
        </button>
      </div>
    </div>
  );
}
