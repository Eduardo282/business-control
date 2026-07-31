import { useEffect, useMemo, useState } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { createProductColumns } from "./productColumns";

export default function useProductsTable({
  filteredProducts,
  user,
  onOpenFolioGroup,
  onRemove,
}) {
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo(
    () =>
      createProductColumns({
        user,
        onOpenFolioGroup,
        onRemove,
      }),
    [user, onOpenFolioGroup, onRemove],
  );

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredProducts.length / pagination.pageSize)),
    [filteredProducts.length, pagination.pageSize],
  );

  const pageData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return filteredProducts.slice(start, start + pagination.pageSize);
  }, [filteredProducts, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filteredProducts.length]);

  useEffect(() => {
    if (pagination.pageIndex > pageCount - 1) {
      setPagination((prev) => ({
        ...prev,
        pageIndex: Math.max(0, pageCount - 1),
      }));
    }
  }, [filteredProducts.length, pagination.pageIndex, pageCount]);

  const table = useReactTable({
    data: pageData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  const visibleProductRowsCount = table.getRowModel().rows.length;
  const isTableScrollable = visibleProductRowsCount > 10;

  return {
    columns,
    isTableScrollable,
    pageCount,
    pagination,
    setPagination,
    setSorting,
    sorting,
    table,
  };
}
