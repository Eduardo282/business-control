import { useCallback, useMemo, useState } from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { createClientTableColumns } from "./clientTableColumns";
import { buildExportColumns } from "./clientTableHelpers";

export default function useClientsTable({
  tableData,
  tableColumnsFromView,
  primaryTableColumns,
  userRole,
  getRowDetailColumns,
  expandedRows,
  onToggleExpanded,
  onCreate,
  onEdit,
  onRemove,
}) {
  const [sorting, setSorting] = useState([]);

  const columns = useMemo(
    () =>
      createClientTableColumns({
        primaryTableColumns,
        userRole,
        getRowDetailColumns,
        expandedRows,
        onToggleExpanded,
        onCreate,
        onEdit,
        onRemove,
      }),
    [
      primaryTableColumns,
      userRole,
      getRowDetailColumns,
      expandedRows,
      onToggleExpanded,
      onCreate,
      onEdit,
      onRemove,
    ],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const getExportContext = useCallback(
    () => ({
      exportColumns: buildExportColumns(tableColumnsFromView),
      exportRows: table
        .getSortedRowModel()
        .rows.map((row) => row.original),
    }),
    [table, tableColumnsFromView],
  );

  return {
    columns,
    getExportContext,
    isTableScrollable: table.getState().pagination.pageSize >= 25,
    table,
  };
}
