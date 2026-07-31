import { useEffect, useMemo, useState } from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { createQuoteHistoryColumns } from "./quoteHistoryColumns";

export default function useQuoteHistoryTable({
  filteredQuotes,
  userRole,
  handleStatusChange,
  handleDeleteQuote,
}) {
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo(
    () =>
      createQuoteHistoryColumns({
        user: { role: { name: userRole } },
        handleStatusChange,
        handleDeleteQuote,
      }),
    [userRole, handleStatusChange, handleDeleteQuote],
  );

  useEffect(() => {
    if (!filteredQuotes.length) return;
    const maxPageIndex = Math.max(
      0,
      Math.ceil(filteredQuotes.length / pagination.pageSize) - 1,
    );
    if (pagination.pageIndex > maxPageIndex) {
      setPagination((prev) => ({
        ...prev,
        pageIndex: maxPageIndex,
      }));
    }
  }, [filteredQuotes.length, pagination.pageIndex, pagination.pageSize]);

  const table = useReactTable({
    data: filteredQuotes,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return {
    columns,
    pagination,
    setPagination,
    setSorting,
    sorting,
    table,
  };
}
