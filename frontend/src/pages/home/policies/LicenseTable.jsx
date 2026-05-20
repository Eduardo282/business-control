import { useState } from "react";

const PAGE_SIZE = 5;

export default function LicenseTable({ items = [], onSelect, selectedId }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const slice = items.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );
  const isSelectable = typeof onSelect === "function";

  return (
    <div className="mt-2">
      <table className="w-full text-xs border border-zinc-200 dark:border-dark-700 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-zinc-100 dark:bg-dark-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <th className="px-3 py-2 text-left w-12">#</th>
            <th className="px-3 py-2 text-left">Folio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-dark-700 bg-white dark:bg-dark-900">
          {slice.map((p, i) => {
            const isSelected = String(selectedId || "") === String(p.id);
            return (
              <tr
                key={p.id}
                onClick={() => onSelect?.(p)}
                className={`transition-colors ${
                  isSelectable ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-dark-800/50" : ""
                } ${isSelected ? "bg-blue-50 dark:bg-blue-900/25" : ""}`}
              >
                <td className="px-3 py-1.5 text-zinc-400 dark:text-zinc-500 font-mono">
                  {page * PAGE_SIZE + i + 1}
                </td>
                <td className="px-3 py-1.5 font-mono text-zinc-700 dark:text-zinc-300">{p.license_key || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Página {page + 1} de {totalPages} &middot; {items.length}{" "}
            folios
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-2 py-1 text-[11px] rounded border text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-dark-800">
              &laquo;
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 text-[11px] rounded border text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-dark-800">
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-2 py-1 text-[11px] rounded border text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-dark-800">
              Siguiente
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page === totalPages - 1}
              className="px-2 py-1 text-[11px] rounded border text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-dark-800">
              &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
