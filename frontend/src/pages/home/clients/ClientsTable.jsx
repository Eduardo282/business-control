import React from "react";
import { flexRender } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, FolderOpen } from "@icons";

import {
  groupDetailColumnsByPrimary,
  hasValue,
} from "./clientTableHelpers";

export default function ClientsTable({
  columns,
  expandedRows,
  getRowDetailColumns,
  isTableScrollable,
  loading,
  primaryTableColumns,
  table,
}) {
  return (
    <div
      className={`overflow-x-auto [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent] ${
        isTableScrollable ? "max-h-[65vh] overflow-y-auto" : ""
      }`}
    >
      <table className="w-full table-fixed">
        <thead
          className={`bg-zinc-50 dark:bg-dark-900 border-b border-zinc-100 dark:border-dark-700 ${
            isTableScrollable ? "sticky top-0 z-20" : ""
          }`}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className={`${
                    header.column.id === "expander" ? "glass-flash " : ""
                  }px-4 py-3 text-left text-xs font-semibold text-[#2277B4] dark:text-blue-300 uppercase tracking-wider transition-colors ${
                    header.column.getCanSort()
                      ? "cursor-pointer hover:bg-zinc-100 dark:hover:bg-dark-700"
                      : "cursor-default"
                  }`}
                  onClick={
                    header.column.getCanSort()
                      ? header.column.getToggleSortingHandler()
                      : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {{
                      asc: <ChevronUp size={14} />,
                      desc: <ChevronDown size={14} />,
                    }[header.column.getIsSorted()] ?? ""}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="divide-y divide-zinc-100 dark:divide-dark-700">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => {
              const rowDetailColumns = getRowDetailColumns(row.original);
              const isExpanded = !!expandedRows[row.original.id];
              const detailColumnsByPrimary = groupDetailColumnsByPrimary(
                rowDetailColumns,
                primaryTableColumns,
              );

              return (
                <React.Fragment key={row.id}>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm align-top"
                      >
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
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center"
              >
                <div className="flex justify-center mb-3 opacity-50">
                  <FolderOpen size={36} />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400">
                  {loading
                    ? "Cargando clientes..."
                    : "No se encontraron clientes"}
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
