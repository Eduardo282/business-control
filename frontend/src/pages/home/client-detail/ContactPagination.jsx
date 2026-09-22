export default function ContactPagination({ table, pageSizes }) {
  return (
    <div className="mt-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Mostrar
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(event) =>
            table.setPageSize(Number(event.target.value))
          }
          className="px-2.5 py-1 rounded-xl text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465]/30 dark:focus:ring-blue-400/30 focus:border-[#153465] dark:focus:border-blue-400 bg-white/70 dark:bg-dark-900/70 border border-white/25 dark:border-white/15 backdrop-blur-md shadow-glass-sm dark:[color-scheme:dark] transition-all"
        >
          {pageSizes.map((size) => (
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

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="px-2.5 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-white/5 border border-white/25 dark:border-white/15 rounded-xl hover:bg-white/95 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glass-sm"
        >
          ««
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-white/5 border border-white/25 dark:border-white/15 rounded-xl hover:bg-white/95 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glass-sm"
        >
          Anterior
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-white/5 border border-white/25 dark:border-white/15 rounded-xl hover:bg-white/95 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glass-sm"
        >
          Siguiente
        </button>
        <button
          onClick={() =>
            table.setPageIndex(table.getPageCount() - 1)
          }
          disabled={!table.getCanNextPage()}
          className="px-2.5 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-white/5 border border-white/25 dark:border-white/15 rounded-xl hover:bg-white/95 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glass-sm"
        >
          »»
        </button>
      </div>
    </div>
  );
}
