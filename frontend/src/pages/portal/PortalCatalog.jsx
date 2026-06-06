import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
  ChevronsLeft,
  ChevronsRight,
  X,
  PackageX,
  Trash2,
} from "@icons";
import {
  listPortalProductsApi,
  requestQuoteApi,
} from "../../actionsAPI/portal.api";
import { logger } from "../../services/logger";
import Swal from "sweetalert2";
import {
  PRODUCT_TYPE_FILTER_OPTIONS,
  getProductIcon,
  getProductTypePresentation,
} from "./productPresentation";

export default function PortalCatalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const [cart, setCart] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const resp = await listPortalProductsApi();
      setProducts(resp);
    } catch (e) {
      logger.error("Error loading portal catalog", e);
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los productos",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Productos agrupados por nombre y categoría para evitar duplicados en la tabla
  const displayProducts = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const key = `${p.name?.trim()}|${p.category?.trim()}`.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { ...p, db_count: 1 });
      } else {
        map.get(key).db_count += 1;
      }
    });
    return Array.from(map.values());
  }, [products]);

  // Datos filtrados por categoría y tipo antes de pasarlos a TanStack
  const tableData = useMemo(() => {
    let result = displayProducts;
    if (categoryFilter !== "ALL") {
      result = result.filter((p) => p.category === categoryFilter);
    }
    if (typeFilter !== "ALL") {
      result = result.filter((p) => (p.product_type || "PRODUCT") === typeFilter);
    }
    return result;
  }, [displayProducts, categoryFilter, typeFilter]);

  const updateCart = (productId, delta) => {
    // Buscar el producto real para obtener su nombre y categoría y usar el ID representativo
    const p = products.find(prod => prod.id === productId);
    let targetId = productId;
    if (p) {
      const rep = displayProducts.find(dp => dp.name === p.name && dp.category === p.category);
      if (rep) targetId = rep.id;
    }

    setCart((prev) => {
      const current = prev[targetId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[targetId];
        return copy;
      }
      return { ...prev, [targetId]: next };
    });
  };

  const getQuantity = (productId) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return cart[productId] || 0;
    
    // Sumar cantidades de todos los productos en el carrito que coincidan en nombre y categoría
    return Object.entries(cart).reduce((total, [cid, qty]) => {
      const cartProd = products.find(cp => cp.id === cid);
      if (cartProd && cartProd.name === p.name && cartProd.category === p.category) {
        return total + qty;
      }
      return total;
    }, 0);
  };

  // Normalizar el carrito para que use solo IDs representativos (limpieza de IDs antiguos)
  useEffect(() => {
    if (products.length > 0 && displayProducts.length > 0 && Object.keys(cart).length > 0) {
      const normalizedCart = {};
      let changed = false;

      Object.entries(cart).forEach(([id, qty]) => {
        const p = products.find(prod => prod.id === id);
        if (p) {
          const rep = displayProducts.find(dp => dp.name === p.name && dp.category === p.category);
          const targetId = rep ? rep.id : id;
          if (targetId !== id) changed = true;
          normalizedCart[targetId] = (normalizedCart[targetId] || 0) + qty;
        } else {
          normalizedCart[id] = qty;
        }
      });

      if (changed) {
        setCart(normalizedCart);
      }
    }
  }, [products, displayProducts]);

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
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      setCart({});
      navigate("/portal/quotes?filter=recent");
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "Error al enviar solicitud",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
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

  const CATEGORY_CHIPS_PAGE_SIZE = 12;
  const totalCategoryPages = Math.max(
    1,
    Math.ceil(categories.length / CATEGORY_CHIPS_PAGE_SIZE)
  );
  const safeCategoryPage = Math.min(categoryPage, totalCategoryPages);

  const visibleCategories = useMemo(() => {
    const start = (safeCategoryPage - 1) * CATEGORY_CHIPS_PAGE_SIZE;
    return categories.slice(start, start + CATEGORY_CHIPS_PAGE_SIZE);
  }, [categories, safeCategoryPage]);


  // Columnas TanStack
  const columns = useMemo(
    () => [
      {
        accessorKey: "category",
        header: "Categoría",
        cell: ({ getValue }) => (
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-900 bg-zinc-100 px-2 py-1 rounded-md whitespace-nowrap">
            {getValue()}
          </span>
        ),
        size: 180,
      },
      {
        accessorKey: "product_type",
        header: "Tipo",
        cell: ({ getValue }) => {
          const typePresentation = getProductTypePresentation(getValue());
          return (
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md border whitespace-nowrap ${typePresentation.badgeClass}`}>
              {typePresentation.label}
            </span>
          );
        },
        size: 130,
      },
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => {
          const name = row.original.name;
          const dbCount = row.original.db_count || 1;
          const Logo = getProductIcon(row.original);
          return (
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  <Logo size={16} />
                </span>
                {dbCount > 1 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-bold px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center border border-white shadow-sm">
                    x{dbCount}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-800">{name}</span>
                {row.original.folio && (
                  <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
                    {row.original.folio}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Descripción",
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-sm text-zinc-500 line-clamp-2">
            {getValue()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => {
          const id = row.original.id;
          const qty = getQuantity(id);
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedProduct(row.original)}
                className="px-3 py-1.5 text-xs font-bold text-[#2277B4] dark:text-[#2277B4] hover:text-[#1a2b4c] bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg shadow-sm transition-all duration-150 flex items-center gap-1"
              >
                Detalles
              </button>
              {qty === 0 ? (
                <button
                  onClick={() => updateCart(id, 1)}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200 whitespace-nowrap"
                >
                  <Plus size={12} /> Solicitar cotización
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-0.5 shadow-sm w-fit">
                  <button
                    onClick={() => updateCart(id, -1)}
                    className="size-7 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 rounded-md transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-bold text-zinc-800 min-w-[1.25rem] text-center text-xs">
                    {qty}
                  </span>
                  <button
                    onClick={() => updateCart(id, 1)}
                    className="size-7 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        },
        size: 240,
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
    initialState: { pagination: { pageSize: 5 } },
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800 flex items-center gap-2">
            <ShoppingBag className="text-black" size={24} /> Catálogo de
            Productos
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Explora nuestras soluciones y solicita una cotización personalizada.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Búsqueda global */}
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-zinc-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar productos…"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 pr-4 py-2 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all w-56 bg-white"
            />
          </div>

          {/* Filtro por categoría */}
          <button
            onClick={() => setIsCategoriesModalOpen(true)}
            className="px-4 py-2 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-zinc-700 cursor-pointer flex items-center justify-between min-w-[180px]">
            <span>{categoryFilter === "ALL" ? "Buscar categorías" : categoryFilter}</span>
            <ChevronDown size={16} className="text-zinc-400 ml-2" />
          </button>

          {/* Filtro por tipo */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-4 pr-10 py-2 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-zinc-700 cursor-pointer min-w-[150px] appearance-none h-full bg-no-repeat"
            >
              <option value="ALL">Todos los tipos</option>
              {PRODUCT_TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="text-zinc-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filtros Activos */}
      {(globalFilter || categoryFilter !== "ALL" || typeFilter !== "ALL") && (
        <div className="flex flex-wrap items-center gap-2 mt-[-0.5rem] mb-2">
          {globalFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              Texto: "{globalFilter}"
              <button onClick={() => setGlobalFilter("")}>
                <X size={10} />
              </button>
            </span>
          )}
          {categoryFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              Cat: {categoryFilter}
              <button onClick={() => setCategoryFilter("ALL")}>
                <X size={10} />
              </button>
            </span>
          )}
          {typeFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              Tipo: {getProductTypePresentation(typeFilter).label}
              <button onClick={() => setTypeFilter("ALL")}>
                <X size={10} />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setGlobalFilter("");
              setCategoryFilter("ALL");
              setTypeFilter("ALL");
            }}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 ml-1"
          >
            <X size={12} /> Limpiar
          </button>
        </div>
      )}

      {/* Tabla */}
      {loading ?
        <div className="text-center py-16 text-zinc-500">
          Cargando catálogo...
        </div>
      : <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
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
                        className="px-5 py-3.5 text-left font-semibold text-zinc-600 select-none">
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-1 ${header.column.getCanSort() ? "cursor-pointer hover:text-zinc-900" : ""}`}
                            onClick={header.column.getToggleSortingHandler()}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanSort() && (
                              <span className="text-zinc-400">
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
              <tbody className="divide-y divide-zinc-100">
                {table.getRowModel().rows.length === 0 ?
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-16 text-zinc-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center">
                          <PackageX size={28} className="text-zinc-400" />
                        </div>
                        <p className="text-sm font-medium text-zinc-500">No se encontraron productos.</p>
                      </div>
                    </td>
                  </tr>
                : table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`group transition-colors hover:bg-zinc-50/70 ${
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
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-600">
            <span>
              {" "}
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
                className="border border-zinc-200 rounded-lg px-2 py-1 text-xs bg-white">
                {[5, 10, 20, 50].map((s) => (
                  <option key={s} value={s}>
                    {s} por página
                  </option>
                ))}
              </select>

              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium px-2 min-w-[80px] text-center">
                Pág. {table.getState().pagination.pageIndex + 1} /{" "}
                {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      }

      {/* Floating Action Bar */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4">
          <div className="bg-[#1B4733] text-white shadow-2xl rounded-2xl p-4 flex items-center gap-6 max-w-2xl w-full">
            <div className="flex items-center justify-center size-12 rounded-xl backdrop-blur-sm">
              <ShoppingCart size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">
                {cartTotalItems} Productos seleccionados
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCart({})}
                disabled={isSubmitting}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-100 font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2">
                <Trash2 size={18} /> Cancelar
              </button>
              <button
                onClick={handleRequestQuote}
                disabled={isSubmitting}
                className="bg-white text-[#1B4733] hover:bg-zinc-100 font-bold py-3 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSubmitting ?
                  "Enviando…"
                : <>
                    <CheckCircle size={18} /> Solicitar
                  </>
                }
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de categorías */}
      {isCategoriesModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-zinc-500/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in relative">
              <div className="p-4 rounded-t-2xl border-b border-white/10 bg-[#1B4733] flex items-center justify-between">
                <h2 className="font-semibold text-white text-lg">Categorías</h2>
                <button
                  onClick={() => setIsCategoriesModalOpen(false)}
                  className="text-white/70 hover:text-white transition-colors p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-3">
                    Categorías
                  </h3>
                  {categories.length === 0 ?
                    <p className="text-sm text-zinc-500">
                      Aún no hay categorías registradas.
                    </p>
                  : <div className="min-h-[190px] flex flex-col">
                      <div className="flex flex-wrap content-start gap-2 h-[138px] overflow-hidden pr-1">
                        {visibleCategories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setCategoryFilter(category);
                              setIsCategoriesModalOpen(false);
                            }}
                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                              category === categoryFilter ?
                                "border-emerald-600 bg-emerald-50 text-emerald-700"
                              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                            }`}>
                            {category === "ALL" ? "Todas las categorías" : category}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-zinc-500">
                          Página {safeCategoryPage} de {totalCategoryPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={safeCategoryPage === 1}
                            className="px-3 py-1.5 rounded-md border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Anterior
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryPage((prev) =>
                                Math.min(totalCategoryPages, prev + 1),
                              )
                            }
                            disabled={safeCategoryPage === totalCategoryPages}
                            className="px-3 py-1.5 rounded-md border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Siguiente
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de Detalles del Producto */}
      {selectedProduct &&
        createPortal(
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-zinc-500/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in relative border border-zinc-200 dark:border-dark-700">
              
              {/* Encabezado del Modal */}
              <div className="p-4 border-b border-zinc-100 dark:border-dark-700 bg-[#1a2b4c] flex items-center justify-between">
                <h2 className="font-semibold text-white text-lg">Detalles del Producto</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Cuerpo del Modal */}
              <div className="p-6 space-y-6">
                {/* Cabecera del Producto */}
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <span className="flex size-16 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-400 shadow-sm dark:bg-dark-900 dark:border-dark-700">
                      {(() => {
                        const Logo = getProductIcon(selectedProduct);
                        return <Logo size={32} className="text-[#2277B4]" />;
                      })()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-md">
                        {selectedProduct.category}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${getProductTypePresentation(selectedProduct.product_type).badgeClass}`}>
                        {getProductTypePresentation(selectedProduct.product_type).label}
                      </span>
                      {selectedProduct.folio && (
                        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-zinc-500 bg-zinc-100 dark:bg-dark-800 dark:text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-dark-700">
                          {selectedProduct.folio}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                      {selectedProduct.name}
                    </h3>
                  </div>
                </div>

                {/* Caja de Descripción */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Descripción
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-dark-900 p-4 rounded-xl border border-zinc-100 dark:border-dark-700">
                    {selectedProduct.description || "Este producto no tiene una descripción disponible actualmente."}
                  </p>
                </div>

                {/* Sección de Acciones */}
                <div className="pt-4 border-t border-zinc-100 dark:border-dark-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 block">
                      Estado en cotización
                    </span>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {getQuantity(selectedProduct.id) > 0 ? "Agregado a la solicitud" : "No agregado"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {getQuantity(selectedProduct.id) === 0 ? (
                      <button
                        onClick={() => updateCart(selectedProduct.id, 1)}
                        className="flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <Plus size={16} /> Solicitar cotización
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-zinc-50 dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 rounded-xl p-1 shadow-sm">
                        <button
                          onClick={() => updateCart(selectedProduct.id, -1)}
                          className="size-8 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-dark-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-zinc-800 dark:text-white min-w-[1.5rem] text-center text-sm">
                          {getQuantity(selectedProduct.id)}
                        </span>
                        <button
                          onClick={() => updateCart(selectedProduct.id, 1)}
                          className="size-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 dark:hover:bg-dark-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
