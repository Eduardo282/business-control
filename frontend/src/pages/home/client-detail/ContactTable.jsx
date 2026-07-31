import { Fragment } from "react";
import { flexRender } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Users } from "@icons";
import {
  resolveDetailHostColumn,
} from "./clientDetailHelpers";
import { hasValue } from "./utils";

export default function ContactTable({
  contactsTable,
  visibleContactRows,
  expandedContactRows,
  contactDetailColumns,
  contactPrimaryColumns,
  shouldEnableContactTableScroll,
  contactTableMinHeight,
  filteredContacts,
  activeContactFilterCount,
}) {
  return (
    <div
      className={`bg-white dark:bg-dark-900 overflow-x-auto border border-zinc-200 dark:border-dark-700 border-t-0 rounded-b-md [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent] ${
        shouldEnableContactTableScroll
          ? "h-[65vh] overflow-y-scroll"
          : ""
      }`}
      style={
        shouldEnableContactTableScroll
          ? undefined
          : { minHeight: `${contactTableMinHeight}px` }
      }
    >
      <table className="w-full text-sm">
        <thead>
          {contactsTable.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="bg-zinc-50 dark:bg-dark-800 border-b border-zinc-200 dark:border-dark-700"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={
                    header.column.getCanSort()
                      ? header.column.getToggleSortingHandler()
                      : undefined
                  }
                  className={`px-4 py-3 text-left text-xs font-semibold text-[#2277B4] dark:text-blue-400 uppercase tracking-wider transition-colors ${
                    shouldEnableContactTableScroll
                      ? "sticky top-0 z-20 bg-zinc-50 dark:bg-dark-800"
                      : ""
                  } ${
                    header.column.getCanSort()
                      ? "cursor-pointer hover:bg-zinc-100 dark:hover:bg-dark-700"
                      : "cursor-default"
                  } ${
                    header.column.id === "expander" ? "w-12" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getIsSorted() === "asc" && (
                      <ChevronUp size={14} />
                    )}
                    {header.column.getIsSorted() === "desc" && (
                      <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-dark-700">
          {visibleContactRows.map((row) => {
            const isExpanded = !!expandedContactRows[row.original.id];
            const rowDetailColumns = contactDetailColumns.filter((column) =>
              hasValue(row.original?.[column.name]),
            );
            const detailColumnsByPrimary = contactPrimaryColumns.reduce(
              (columnsByPrimary, primaryColumn) => {
                columnsByPrimary[primaryColumn.name] = [];
                return columnsByPrimary;
              },
              {},
            );

            rowDetailColumns.forEach((column) => {
              const hostColumn =
                resolveDetailHostColumn(
                  column,
                  contactPrimaryColumns,
                  detailColumnsByPrimary,
                ) || contactPrimaryColumns[0]?.name;

              if (
                hostColumn &&
                detailColumnsByPrimary[hostColumn]
              ) {
                detailColumnsByPrimary[hostColumn].push(column);
              }
            });

            return (
              <Fragment key={row.id}>
                <tr className="hover:bg-zinc-50 dark:hover:bg-dark-800 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>

                {isExpanded && rowDetailColumns.length > 0 && (
                  <tr className="bg-zinc-50/80 dark:bg-dark-800/80">
                    {row.getVisibleCells().map((cell) => {
                      const alignedDetails =
                        detailColumnsByPrimary[cell.column.id] || [];

                      return (
                        <td
                          key={`${cell.id}__detail`}
                          className="px-4 py-4 align-top"
                        >
                          {alignedDetails.length > 0 && (
                            <div className="space-y-3">
                              {alignedDetails.map((column) => {
                                const rawValue =
                                  row.original?.[column.name];
                                const value = hasValue(rawValue)
                                  ? String(rawValue)
                                  : "—";

                                return (
                                  <div
                                    key={`${row.id}_${column.name}`}
                                    className="min-w-0"
                                  >
                                    <p className="text-[10px] font-semibold uppercase text-[#2277B4] dark:text-blue-400 tracking-wider">
                                      {column.label}
                                    </p>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-100 break-words">
                                      {value}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {visibleContactRows.length === 0 && (
        <div className="py-12 text-center">
          <div className="flex justify-center mb-2 text-zinc-300 dark:text-zinc-600">
            <Users size={48} />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {filteredContacts.length === 0 &&
            activeContactFilterCount > 0
              ? "No se encontraron contactos con los filtros aplicados."
              : "Este cliente aún no tiene contactos registrados."}
          </p>
        </div>
      )}
    </div>
  );
}
