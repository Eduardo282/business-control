import { useMemo } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { createPortalCatalogColumns } from "./portalCatalogColumns";

export default function usePortalCatalogTable({
  tableData,
  globalFilter,
  setGlobalFilter,
  getQuantity,
  updateCart,
  setSelectedProduct,
  setActiveFolioGroup,
  cart,
  activeFolioGroup,
}) {
  const columns = useMemo(
    () =>
      createPortalCatalogColumns({
        getQuantity,
        updateCart,
        setSelectedProduct,
        setActiveFolioGroup,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart, activeFolioGroup, getQuantity, updateCart, setSelectedProduct, setActiveFolioGroup],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  const isTableScrollable = table.getRowModel().rows.length > 5;

  return {
    columns,
    isTableScrollable,
    table,
  };
}
