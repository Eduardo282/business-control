import { flexRender } from "@tanstack/react-table";
import { ChevronRight } from "@icons";
import ContactPagination from "./ContactPagination";

export default function DisabledContactsTable({
  disabledContacts,
  showDisabled,
  setShowDisabled,
  disabledContactsTable,
  visibleDisabledContactRows,
  shouldEnableDisabledContactsTableScroll,
}) {
  if (!disabledContacts.length) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setShowDisabled((value) => !value)}
        className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors select-none group px-1 py-1"
      >
        <ChevronRight
          size={14}
          className={`transition-transform duration-200 ${
            showDisabled ? "rotate-90" : ""
          }`}
        />
        <span className="group-hover:underline">
          {showDisabled
            ? "Ocultar contactos deshabilitados"
            : `Mostrar contactos deshabilitados (${disabledContacts.length})`}
        </span>
      </button>

      {showDisabled && (
        <>
          <div
            className={`mt-2 overflow-x-auto rounded-md border border-zinc-200 dark:border-dark-700 animate-fade-in [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent] ${
              shouldEnableDisabledContactsTableScroll
                ? "max-h-[12rem] overflow-y-auto"
                : ""
            }`}
          >
            <table className="w-full text-sm bg-white dark:bg-dark-900">
              <thead>
                {disabledContactsTable
                  .getHeaderGroups()
                  .map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="bg-zinc-100 dark:bg-dark-800 border-b border-zinc-200 dark:border-dark-700"
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={`px-4 py-2 text-left text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ${
                            shouldEnableDisabledContactsTableScroll
                              ? "sticky top-0 z-20 bg-zinc-100 dark:bg-dark-800"
                              : ""
                          }`}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-dark-700">
                {visibleDisabledContactRows.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-zinc-50 dark:bg-dark-900 opacity-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2.5">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ContactPagination
            table={disabledContactsTable}
            pageSizes={[3, 10, 25, 50, 100]}
          />
        </>
      )}
    </div>
  );
}
