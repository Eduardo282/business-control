import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit2,
  History,
  Search,
  Trash2,
  Users,
  X,
} from "@icons";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  inferProductType,
  PRODUCT_UPDATE_ROW_HEIGHT,
  ProductAvatar,
} from "./productDetailHelpers";

export default function ProductDetailView({ controller, userRole }) {
  const {
    currentMaxUsers,
    editForm,
    error,
    globalFilter,
    handleDelete,
    handleHistoryDateChange,
    handlePriceStep,
    handlePriceUpdate,
    handleUpdate,
    isEditing,
    loading,
    newPrice,
    pagination,
    product,
    selectedHistoryDate,
    setEditForm,
    setGlobalFilter,
    setIsEditing,
    setNewPrice,
    setPagination,
    setSelectedHistoryDate,
    setUpdatePagination,
    updatePagination,
    updatingPrice,
  } = controller;

  const currentPriceHistoryId = product?.price_history?.[0]?.id;

  const historyColumns = useMemo(
    () => [
      {
        accessorKey: "price",
        header: "Precio Anterior",
        cell: ({ row }) => {
          const isCurrentPrice =
            String(row.original.id) === String(currentPriceHistoryId);

          return (
            <div>
              <div className="text-stone-600 dark:text-zinc-100 font-mono font-bold text-[15px]">
                $
                {(Number(row.original.price) || 0).toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className="text-[10px] text-light-text-secondary dark:text-zinc-500 mt-0.5 uppercase tracking-wider">
                {isCurrentPrice ? "Precio Actual" : "Precio Anterior"}
              </div>
            </div>
          );
        },
        filterFn: "includesString",
      },
      {
        accessorFn: (row) => {
          const date = new Date(
            isNaN(row.changed_at) ? row.changed_at : parseInt(row.changed_at),
          );
          return (
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        },
        id: "date",
        header: "Fecha",
        cell: ({ row }) => {
          const date = new Date(
            isNaN(row.original.changed_at) ?
              row.original.changed_at
            : parseInt(row.original.changed_at),
          );
          return (
            <div className="text-right">
              <div className="text-xs text-black dark:text-zinc-100 font-semibold">
                {date.toLocaleDateString()}
              </div>
              <div className="text-[10px] text-light-text-secondary/70 dark:text-zinc-400 mt-0.5">
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          );
        },
        filterFn: "includesString",
      },
    ],
    [currentPriceHistoryId],
  );

  const table = useReactTable({
    data: product?.price_history || [],
    columns: historyColumns,
    state: {
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-light-text-secondary dark:text-zinc-400">
        Cargando producto...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-light-error dark:text-red-400 bg-light-error/10 dark:bg-red-500/10 rounded-xl m-4 border border-light-error/20 dark:border-red-500/20">
        {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-light-text-secondary dark:text-zinc-400">
        Producto no encontrado
      </div>
    );
  }

  const fallbackFolioPrefix = {
    PRODUCT: "PRD",
    CONTPAQI: "PRD",
    SERVICE: "SRV",
    POLICY: "POL",
  }[inferProductType(product)] || "PRD";
  const productFolio =
    String(product.folio || "").trim() ||
    `${fallbackFolioPrefix}-${String(product.id || 1).padStart(6, "0")}`;

  const editHistory = (product.update_history || []).filter(e => e.change_type !== "PRICE");
  const totalPages = Math.max(1, Math.ceil(editHistory.length / updatePagination.pageSize));
  const paged = editHistory.slice(
    updatePagination.pageIndex * updatePagination.pageSize,
    (updatePagination.pageIndex + 1) * updatePagination.pageSize
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-7xl mx-auto">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 size-96 bg-primary-600/10 dark:bg-primary-400/10 blur-[100px] rounded-full -z-10" />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Info principal */}
        <div className="flex-1 glass-panel p-8 rounded-md relative overflow-hidden group dark:border-white/10">
          {!isEditing ? (
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <ProductAvatar
                    name={product.name}
                    category={product.category}
                    size="md"
                  />
                  <div>
                    <h2 className="text-3xl font-semibold text-light-text-primary dark:text-zinc-100 hover:text-[#2277B4] dark:hover:text-blue-400">
                      {product.name}
                    </h2>
                    <span className="inline-block mt-1 px-3 py-1 bg-[#F2F5F9] dark:bg-dark-800 text-zinc-500 dark:text-zinc-300 rounded-full text-xs font-medium border border-zinc-100 dark:border-dark-700">
                      {product.category}
                    </span>
                  </div>
                </div>
                <Link
                  to="/productos"
                  className="text-xs font-medium text-black dark:text-zinc-100 hover:text-light-text-primary dark:hover:text-zinc-300 flex items-center gap-1 transition-colors px-3 py-2 rounded-lg dark:hover:bg-white/5"
                >
                  <ArrowLeft size={16} /> Volver
                </Link>
              </div>

              <p className="mt-6 text-light-text-secondary dark:text-zinc-400 leading-relaxed max-w-2xl">
                {product.description ||
                  "Sin descripción disponible para este producto."}
              </p>
              <div className="mt-8 flex flex-wrap items-start gap-8 lg:gap-12">
                <div className="flex items-end gap-4 p-4 rounded-xl w-fit">
                  <div>
                    <div className="text-xs text-light-text-secondary dark:text-zinc-500 mb-1">
                      Precio Actual
                    </div>
                    <div className="text-4xl font-mono text-stone-600 dark:text-zinc-100 font-bold tracking-tight">
                      $
                      {(Number(product.current_price) || 0).toLocaleString(
                        "es-MX",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </div>
                    <div className="text-[10px] text-black dark:text-zinc-400 font-mono text-right mt-1">
                      + IVA $
                      {(parseFloat(product.current_price || 0) * 0.16).toFixed(
                        2,
                      )}
                    </div>
                  </div>
                </div>

                {!["SERVICE", "POLICY"].includes(inferProductType(product)) && product.users_count > 0 && (
                  <div className="flex items-start gap-3 p-4 w-fit">
                    <div className="p-2 rounded-lg">
                      <Users size={20} className="text-black dark:text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-xs text-light-text-secondary dark:text-zinc-500">
                        Usuarios
                      </div>
                      <div className="text-lg font-bold text-light-text-primary dark:text-zinc-100">
                        {product.users_count}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 w-fit border-l border-light-border dark:border-white/5 ml-4">
                  <div>
                    <div className="text-xs text-light-text-secondary dark:text-zinc-500 mb-1">
                      Folio
                    </div>
                    <div className="text-sm font-bold text-[#2277B4] dark:text-blue-300">
                      {productFolio}
                    </div>
                  </div>
                </div>
              </div>
              {userRole !== "SOPORTE" && (
                <div className="mt-8 flex justify-between items-end border-t border-light-border dark:border-white/5 pt-6">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-[#2277B4] dark:bg-blue-700 hover:bg-[#125280] dark:hover:bg-blue-600 shadow-lg shadow-[#2277B450] dark:shadow-black/30 text-white dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
                    >
                      <Edit2 size={16} /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="text-red-800 dark:text-red-400 flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/40"
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                      Última actualización
                    </div>
                    <div className="font-mono text-[11px] font-bold text-light-text-primary dark:text-zinc-100">
                      {new Date(product.updated_at || product.created_at).toLocaleDateString()} {new Date(product.updated_at || product.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="NOMBRE DEL PRODUCTO"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Nombre"
                  className="text-light-text-primary dark:text-white bg-light-bg dark:!bg-black/30 border-light-border dark:border-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-[#153465] dark:focus:ring-blue-400/40"
                />
                <div className="w-full space-y-1.5">
                  <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 ml-1 uppercase tracking-wider">
                    CATEGORÍA
                  </label>
                  <input
                    value={editForm.category}
                    readOnly
                    placeholder="Categoría"
                    className="w-full rounded-xl px-4 py-3 text-sm bg-zinc-100 dark:bg-dark-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-dark-700 disabled:bg-zinc-100 dark:disabled:bg-dark-800 disabled:text-zinc-500 dark:disabled:text-zinc-500 cursor-not-allowed outline-none transition-colors"
                  />
                </div>

                <Input
                  label={
                    inferProductType(editForm) === "SERVICE" || inferProductType(editForm) === "POLICY"
                      ? "USUARIOS"
                      : `USUARIOS (MÁXIMA CAPACIDAD. ${currentMaxUsers})`
                  }
                  type="number"
                  min="1"
                  max={currentMaxUsers.toString()}
                  value={
                    inferProductType(editForm) === "SERVICE" || inferProductType(editForm) === "POLICY"
                      ? 1
                      : editForm.users_count
                  }
                  disabled={inferProductType(editForm) === "SERVICE" || inferProductType(editForm) === "POLICY"}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val === "") {
                      setEditForm({ ...editForm, users_count: "" });
                      return;
                    }
                    let num = parseInt(val, 10);
                    if (num > currentMaxUsers) num = currentMaxUsers;
                    if (num < 1) num = 1;
                    setEditForm({ ...editForm, users_count: num });
                  }}
                  placeholder="1"
                  className="text-light-text-primary dark:text-white bg-light-bg dark:!bg-black/30 border-light-border dark:border-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-500 dark:disabled:!bg-dark-800 dark:disabled:text-zinc-500 dark:[color-scheme:dark] focus:ring-[#153465] dark:focus:ring-blue-400/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-light-text-secondary dark:text-zinc-400 ml-1">
                  Descripción
                </label>
                <textarea
                  className="w-full bg-white dark:bg-dark-900 text-light-text-primary dark:text-zinc-100 text-sm border border-zinc-300 dark:border-dark-700 rounded-xl p-3 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/30 dark:focus:ring-blue-400/30 focus:border-[#1a2b4c] dark:focus:border-blue-400 resize-none h-32 transition-colors [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent]"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Descripción detallada…"
                />
              </div>
              <div className="flex pt-2 text-lg font-bold text-white items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-dark-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:focus:ring-zinc-500/40"
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 py-3 bg-[#2277B4] dark:bg-blue-700 hover:bg-[#125280] dark:hover:bg-blue-600 text-white dark:text-white font-bold rounded-xl shadow-lg shadow-[#2277B450] dark:shadow-black/30 transition-all duration-150 active:scale-95 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
                  type="submit"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="w-full md:w-96 space-y-6">
          {/* Tarjeta de actualizacion de precio */}
          {userRole !== "SOPORTE" && (
            <div className="rounded-md p-4 bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 shadow-md shadow-zinc-200 dark:shadow-none">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-light-text-primary dark:text-zinc-100 flex items-center gap-2">
                  <span className="text-black dark:text-zinc-400">$</span> Actualizar Precio
                </h3>
                {newPrice && !isNaN(newPrice) && (
                  <div className="text-[10px] text-black dark:text-zinc-400 font-mono text-right whitespace-nowrap">
                    + IVA: ${(parseFloat(newPrice) * 0.16).toFixed(2)}
                  </div>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <div className="w-full">
                  <div className="relative">
                    <input
                      id="price-update-input"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full rounded-xl pl-4 pr-12 py-2 font-mono text-base text-light-text-primary dark:text-zinc-100 bg-white dark:bg-dark-800 border border-[#cfd9e6] dark:border-dark-700 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/30 focus:border-[#2277B4] dark:focus:border-blue-400 dark:[color-scheme:dark] transition-colors"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-md border border-[#b8cce6] dark:border-dark-700 shadow-sm dark:shadow-black/20">
                      <button
                        type="button"
                        onClick={() => handlePriceStep(1)}
                        className="size-4 leading-none text-[10px] font-bold text-[#2277B4] dark:text-blue-300 bg-[#e8f2ff] dark:bg-dark-700 hover:bg-[#dcecff] dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:bg-blue-100 dark:focus:bg-zinc-700"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePriceStep(-1)}
                        className="size-4 leading-none text-[10px] font-bold text-[#2277B4] dark:text-blue-300 bg-[#e8f2ff] dark:bg-dark-700 hover:bg-[#dcecff] dark:hover:bg-zinc-700 border-t border-[#b8cce6] dark:border-dark-700 transition-colors focus:outline-none focus:bg-blue-100 dark:focus:bg-zinc-700"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-sm text-white dark:text-white bg-[#2277B4] dark:bg-blue-700 rounded-full px-4 py-2 hover:bg-[#125280] dark:hover:bg-blue-600 shadow-lg shadow-[#2277B450] dark:shadow-black/30 cursor-pointer disabled:opacity-40 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-dark-700 dark:disabled:text-zinc-500 disabled:hover:bg-zinc-300 dark:disabled:hover:bg-dark-700 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
                  onClick={handlePriceUpdate}
                  disabled={updatingPrice || !newPrice}
                >
                  {updatingPrice ? "..." : "Actualizar"}
                </button>
              </div>
            </div>
          )}

          {/* Tarjeta de historial */}
          <div className="rounded-md p-0 overflow-visible flex flex-col mt-4 bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 shadow-sm">
            <div className="p-4 bg-light-bg/50 dark:bg-white/5 flex flex-col gap-3 border-b border-light-border dark:border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-light-text-primary dark:text-zinc-100 text-sm flex items-center gap-2">
                  <History size={16} className="text-black dark:text-zinc-400" />
                  Precios
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-black dark:text-zinc-100">
                  Total:{" "}
                  {product.price_history ? product.price_history.length : 0}
                </span>
              </div>
              {/* Buscar por precio o fecha */}
              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Buscar precio…"
                    value={globalFilter ?? ""}
                    onChange={(e) => {
                      setSelectedHistoryDate(null);
                      setGlobalFilter(e.target.value);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#2277B4] dark:focus:ring-blue-400/40 focus:border-[#2277B4] dark:focus:border-blue-400 transition-colors"
                  />
                  {globalFilter && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHistoryDate(null);
                        setGlobalFilter("");
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/40 rounded"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="w-[145px]">
                  <DatePicker
                    selected={selectedHistoryDate}
                    onChange={handleHistoryDateChange}
                    placeholderText="Filtrar fecha"
                    dateFormat="MM/dd/yyyy"
                    popperPlacement="bottom-end"
                    popperModifiers={[
                      {
                        name: "offset",
                        options: { offset: [0, 8] },
                      },
                      {
                        name: "preventOverflow",
                        options: {
                          rootBoundary: "viewport",
                          padding: 8,
                        },
                      },
                      {
                        name: "flip",
                        options: {
                          fallbackPlacements: [
                            "bottom-start",
                            "top-end",
                            "top-start",
                          ],
                        },
                      },
                    ]}
                    showPopperArrow={false}
                    popperClassName="price-history-datepicker-popper"
                    calendarClassName="price-history-datepicker-calendar"
                    className="w-full rounded-lg border border-zinc-200 dark:border-dark-700 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2277B4] dark:focus:ring-blue-400/40 focus:border-[#2277B4] dark:focus:border-blue-400 text-zinc-700 dark:text-zinc-100 bg-white dark:bg-dark-800 dark:[color-scheme:dark] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50/30 dark:bg-dark-800/30">
              {table.getRowModel().rows.length > 0 ? (
                <div className="space-y-3">
                  {table.getRowModel().rows.map((row) => (
                    <div
                      key={row.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-white dark:bg-dark-800 shadow-sm border border-zinc-100/80 dark:border-dark-700 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <div key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-light-text-secondary dark:text-zinc-500 text-sm">
                  {product.price_history?.length > 0 ?
                    "No hay resultados para la búsqueda."
                  : "No hay historial registrado."}
                </div>
              )}
            </div>

            {/* Paginación */}
            {product.price_history && product.price_history.length > 3 && (
              <div className="px-4 py-3 border-t border-zinc-100 dark:border-dark-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-1 rounded bg-transparent dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition-colors text-black dark:text-zinc-100"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[11px] font-medium text-black dark:text-zinc-100 min-w-max">
                    Pág {table.getState().pagination.pageIndex + 1} de{" "}
                    {Math.max(1, table.getPageCount())}
                  </span>
                  <button
                    type="button"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-1 rounded bg-transparent dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition-colors text-black dark:text-zinc-100"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value));
                  }}
                  className="text-[11px] bg-zinc-50 dark:bg-dark-800 border border-zinc-200 dark:border-dark-700 rounded px-1.5 py-1 text-zinc-600 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-[#2277B4] dark:focus:ring-blue-400/40 dark:[color-scheme:dark] transition-colors"
                >
                  {[3, 5, 10, 20].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      Mostrar {pageSize}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Historial de actualizaciones */}
          {(() => {
            return (
              <div className="rounded-md overflow-hidden bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 shadow-sm mt-6">
                <div className="flex items-center justify-between border-b border-[#eef3f8] bg-[#fbfdff] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Actualizaciones
                  </span>
                  <span className="text-[9px] font-bold text-[#2277B4] dark:text-blue-400">
                    {editHistory.length} movimiento{editHistory.length === 1 ? "" : "s"}
                  </span>
                </div>

                {paged.length > 0 ? (
                  <div
                    className="divide-y divide-[#eef3f8] dark:divide-white/10"
                    style={{
                      minHeight: `${updatePagination.pageSize * PRODUCT_UPDATE_ROW_HEIGHT}px`,
                    }}
                  >
                    {paged.map((entry, idx) => {
                      const date = new Date(entry.changed_at);
                      return (
                        <div
                          key={entry.id || idx}
                          className="grid grid-cols-[44px_minmax(0,1fr)_118px] items-center gap-2 px-3 py-2 text-[11px] hover:bg-[#f8fbff] dark:hover:bg-white/5"
                        >
                          <span className="font-mono font-black text-[#2277B4] dark:text-blue-400">
                            #{Math.max(1, Number(entry.update_version) || 1)}
                          </span>
                          <span className="font-semibold text-light-text-primary dark:text-zinc-100">
                            {entry.summary || "Producto editado"}
                          </span>
                          <span className="text-right font-mono text-[10px] font-semibold leading-tight text-zinc-500 dark:text-zinc-400">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    Aún no hay ediciones registradas para este producto.
                  </div>
                )}

                {editHistory.length > 0 && (
                  <div className="px-4 py-3 border-t border-zinc-100 dark:border-dark-700 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setUpdatePagination(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
                        disabled={updatePagination.pageIndex === 0}
                        className="p-1 rounded bg-transparent dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition-colors text-black dark:text-zinc-100"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-[11px] font-medium text-black dark:text-zinc-100 min-w-max">
                        Pág {updatePagination.pageIndex + 1} de{" "}
                        {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUpdatePagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
                        disabled={(updatePagination.pageIndex + 1) * updatePagination.pageSize >= editHistory.length}
                        className="p-1 rounded bg-transparent dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition-colors text-black dark:text-zinc-100"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <select
                      value={updatePagination.pageSize}
                      onChange={(e) => {
                        setUpdatePagination({ pageIndex: 0, pageSize: Number(e.target.value) });
                      }}
                      className="text-[11px] bg-zinc-50 dark:bg-dark-800 border border-zinc-200 dark:border-dark-700 rounded px-1.5 py-1 text-zinc-600 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-[#2277B4] dark:focus:ring-blue-400/40 dark:[color-scheme:dark] transition-colors"
                    >
                      {[3, 5, 10, 20].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                          Mostrar {pageSize}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
