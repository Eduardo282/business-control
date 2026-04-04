import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "@icons";
import {
  listPortalProductsApi,
  requestQuoteApi,
} from "../../actionsAPI/portal.api";
import Swal from "sweetalert2";

export default function PortalCatalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [cart, setCart] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const resp = await listPortalProductsApi();
      setProducts(resp);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "No se pudieron cargar los productos", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (productId, delta) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  const getQuantity = (productId) => cart[productId] || 0;
  const cartTotalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleRequestQuote = async () => {
    const items = Object.entries(cart).map(([productId, quantity]) => ({
      product_id: productId,
      quantity,
    }));
    if (items.length === 0) return;

    const result = await Swal.fire({
      title: "¿Solicitar Cotización?",
      text: `Se solicitará cotización por ${cartTotalItems} productos. Un asesor te enviará la propuesta con precios.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, solicitar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#10b981",
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    try {
      await requestQuoteApi(items);
      await Swal.fire({
        title: "¡Solicitud Enviada!",
        text: "Hemos recibido tu solicitud. Pronto recibirás la cotización en tu correo y en este portal.",
        icon: "success",
        confirmButtonColor: "#10b981",
      });
      setCart({});
      navigate("/portal/quotes?filter=recent");
    } catch (e) {
      Swal.fire("Error", e.message || "Error al enviar solicitud", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Categorías únicas para el filtro de selección
  const categories = useMemo(
    () => [
      "ALL",
      ...Array.from(
        new Set(products.map((p) => p.category).filter(Boolean)),
      ).sort(),
    ],
    [products],
  );

  // Datos filtrados por categoría antes de pasarlos a TanStack
  const tableData = useMemo(
    () =>
      categoryFilter === "ALL" ? products : (
        products.filter((p) => p.category === categoryFilter)
      ),
    [products, categoryFilter],
  );

  // Columnas TanStack
  const columns = useMemo(
    () => [
      {
        accessorKey: "category",
        header: "Categoría",
        cell: ({ getValue }) => (
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md whitespace-nowrap">
            {getValue()}
          </span>
        ),
        size: 180,
      },
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ getValue }) => (
          <span className="font-semibold text-gray-800">{getValue()}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Descripción",
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-500 line-clamp-2">
            {getValue()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Agregar",
        enableSorting: false,
        cell: ({ row }) => {
          const id = row.original.id;
          const qty = getQuantity(id);
          return qty === 0 ?
              <button
                onClick={() => updateCart(id, 1)}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200 whitespace-nowrap">
                <Plus size={14} /> Agregar
              </button>
            : <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                <button
                  onClick={() => updateCart(id, -1)}
                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
                  <Minus size={14} />
                </button>
                <span className="font-bold text-gray-800 min-w-[1.25rem] text-center text-sm">
                  {qty}
                </span>
                <button
                  onClick={() => updateCart(id, 1)}
                  className="w-7 h-7 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
                  <Plus size={14} />
                </button>
              </div>;
        },
        size: 120,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart],
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
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-black" size={24} /> Catálogo de
            Productos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Explora nuestras soluciones y solicita una cotización personalizada.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Búsqueda global */}
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all w-56 bg-white"
            />
          </div>

          {/* Filtro por categoría */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-gray-700 cursor-pointer">
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "ALL" ? "Todas las categorías" : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      {loading ?
        <div className="text-center py-16 text-gray-500">
          Cargando catálogo...
        </div>
      : <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{
                          width:
                            header.getSize() !== 150 ?
                              header.getSize()
                            : undefined,
                        }}
                        className="px-5 py-3.5 text-left font-semibold text-gray-600 select-none">
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-1 ${header.column.getCanSort() ? "cursor-pointer hover:text-gray-900" : ""}`}
                            onClick={header.column.getToggleSortingHandler()}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanSort() && (
                              <span className="text-gray-400">
                                {header.column.getIsSorted() === "asc" ?
                                  <ChevronUp size={14} />
                                : header.column.getIsSorted() === "desc" ?
                                  <ChevronDown size={14} />
                                : <ChevronsUpDown size={14} />}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {table.getRowModel().rows.length === 0 ?
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-16 text-gray-400">
                      No se encontraron productos.
                    </td>
                  </tr>
                : table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-gray-50/70 ${
                        getQuantity(row.original.id) > 0 ?
                          "bg-emerald-50/40 border-l-2 border-l-emerald-500"
                        : ""
                      }`}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-3.5 align-middle">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
            <span>
              Mostrando{" "}
              <strong>
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
                –
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length,
                )}
              </strong>{" "}
              de <strong>{table.getFilteredRowModel().rows.length}</strong>{" "}
              productos
            </span>

            <div className="flex items-center gap-2">
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white">
                {[5, 10, 20, 50].map((s) => (
                  <option key={s} value={s}>
                    {s} por página
                  </option>
                ))}
              </select>

              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium px-1">
                Pág. {table.getState().pagination.pageIndex + 1} /{" "}
                {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      }

      {/* Floating Action Bar */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4">
          <div className="bg-emerald-600 text-white shadow-2xl rounded-2xl p-4 flex items-center gap-6 max-w-2xl w-full">
            <div className="flex items-center justify-center bg-white/20 w-12 h-12 rounded-xl backdrop-blur-sm">
              <ShoppingCart size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">
                {cartTotalItems} Productos seleccionados
              </div>
              <div className="text-emerald-100 text-sm">
                Solicita tu cotización ahora
              </div>
            </div>
            <button
              onClick={handleRequestQuote}
              disabled={isSubmitting}
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold py-3 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isSubmitting ?
                "Enviando..."
              : <>
                  <CheckCircle size={18} /> Solicitar
                </>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
