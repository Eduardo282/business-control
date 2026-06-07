import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { notificationService } from "../../services/notificationService";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import {
  getProductApi,
  updateProductApi,
  deleteProductApi,
  updateProductPriceApi,
  clearProductPriceHistoryApi,
} from "../../actionsAPI/products.api";
import {
  Users,
  ArrowLeft,
  Edit2,
  Trash2,
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "@icons";
import { CATALOG } from "./RegistrarProducts";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";

// ── Avatar de producto: iniciales + color semideterminista ──────────────────
const AVATAR_COLORS = [
  ["#1a2b4c", "#e8edf5"],
  ["#2277B4", "#e3f0fb"],
  ["#7c3aed", "#ede9fe"],
  ["#0f766e", "#ccfbf1"],
  ["#b45309", "#fef3c7"],
  ["#be123c", "#ffe4e6"],
  ["#1d4ed8", "#dbeafe"],
  ["#15803d", "#dcfce7"],
];
function getAvatarColors(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++)
    h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function normalizeCategory(category = "") {
  return String(category)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function inferProductType(product) {
  const explicitType = String(product?.product_type || "")
    .trim()
    .toUpperCase();
  if (["PRODUCT", "CONTPAQI", "SERVICE", "POLICY"].includes(explicitType)) {
    return explicitType;
  }

  const source = `${product?.name || ""} ${product?.category || ""}`;
  const normalized = normalizeCategory(source);

  if (normalized.includes("poliza")) return "POLICY";
  if (normalized.includes("servicio")) return "SERVICE";
  if (normalized.includes("contpaqi")) return "CONTPAQI";
  return "PRODUCT";
}

function ProductAvatar({ name = "", category = "", size = "md" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const [bg, fg] = getAvatarColors(category + name);

  const sizeClasses = {
    sm: "size-9 text-[11px] rounded-lg",
    md: "size-14 text-[20px] rounded-2xl",
    lg: "size-20 text-[28px] rounded-3xl",
  };

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center font-extrabold tracking-tight select-none shadow-sm ${sizeClasses[size] || sizeClasses.md}`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {initials || "?"}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modo de edicion
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Actualizacion de precio
  const [newPrice, setNewPrice] = useState("");
  const [updatingPrice, setUpdatingPrice] = useState(false);

  const handlePriceStep = (direction) => {
    const current = Number.parseFloat(newPrice || "0");
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, safeCurrent + direction * 0.01);
    setNewPrice(next.toFixed(2));
  };

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const p = await getProductApi(id);
      setProduct(p);
      setEditForm({
        name: p.name,
        category: p.category,
        users_count: p.users_count || 0,
        description: p.description || "",
      });
    } catch (e) {
      setError(e.message || "Error cargando producto");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 3 });
  const [updatePagination, setUpdatePagination] = useState({ pageIndex: 0, pageSize: 3 });

  const handleHistoryDateChange = (date) => {
    setSelectedHistoryDate(date);
    if (!date) {
      setGlobalFilter("");
      return;
    }
    setGlobalFilter(date.toLocaleDateString());
  };

  // Use useMemo for columns
  const historyColumns = useMemo(
    () => [
      {
        accessorKey: "price",
        header: "Precio Anterior",
        cell: ({ row }) => (
          <div>
            <div className="text-stone-600 dark:text-zinc-100 font-mono font-bold text-[15px]">
              $
              {(Number(row.original.price) || 0).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-[10px] text-light-text-secondary dark:text-zinc-500 mt-0.5 uppercase tracking-wider">
              Precio Anterior
            </div>
          </div>
        ),
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
    [],
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

  const currentMaxUsers = useMemo(() => {
    if (!editForm.name) return 30; // default max
    for (const cat of CATALOG) {
      if (cat.items) {
        for (const item of cat.items) {
          if (item.name === editForm.name && item.max_users) {
            return item.max_users;
          }
        }
      }
    }
    return 30;
  }, [editForm.name]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateProductApi(id, editForm);
      setProduct((prev) => ({ ...prev, ...updated }));
      setIsEditing(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const handlePriceUpdate = async () => {
    if (!newPrice) return;
    setUpdatingPrice(true);
    try {
      const updated = await updateProductPriceApi(id, newPrice);
      setProduct((prev) => ({ ...prev, ...updated }));
      setNewPrice("");
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdatingPrice(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await notificationService.confirm({
      title: "¿Estás seguro?",
      text: "Se eliminará este producto permanentemente.",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      await deleteProductApi(id);
      notificationService.toast({ title: "¡Producto eliminado exitosamente!", icon: "success" });
      navigate("/productos");
    } catch (e) {
      notificationService.error("Error", e.message || "Error al eliminar producto.");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-light-text-secondary dark:text-zinc-400">
        Cargando producto...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-light-error dark:text-red-400 bg-light-error/10 dark:bg-red-500/10 rounded-xl m-4 border border-light-error/20 dark:border-red-500/20">
        {error}
      </div>
    );
  if (!product)
    return (
      <div className="p-8 text-center text-light-text-secondary dark:text-zinc-400">
        Producto no encontrado
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-7xl mx-auto">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 size-96 bg-primary-600/10 blur-[100px] rounded-full -z-10" />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Info principal */}
        <div className="flex-1 glass-panel p-8 rounded-md relative overflow-hidden group dark:border-white/10">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-zinc-200 to-zinc-300" />

          {!isEditing ?
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
                  className="text-xs font-medium text-black dark:text-zinc-100 hover:text-light-text-primary dark:hover:text-zinc-300 flex items-center gap-1 transition-colors px-3 py-2 rounded-lg dark:hover:bg-white/5">
                  <ArrowLeft size={16} /> Volver
                </Link>
              </div>

              <p className="mt-6 text-light-text-secondary dark:text-zinc-400 leading-relaxed max-w-2xl">
                {product.description ||
                  "Sin descripción disponible para este producto."}
              </p>
              <div className="mt-8 flex flex-wrap items-end gap-8 lg:gap-12">
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
                  <div className="flex items-center gap-3 px-4 py-3 w-fit">
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

                <div className="flex items-center gap-3 px-4 py-3 w-fit border-l border-light-border dark:border-white/5 ml-4">
                  <div>
                    <div className="text-xs text-light-text-secondary dark:text-zinc-500 mb-1">
                      Folio
                    </div>
                    <div className="text-sm font-bold text-[#2277B4]">
                      PRD-{String(product.id || 1).padStart(6, '0')}
                    </div>
                  </div>
                </div>
              </div>
              {user?.role?.name !== "SOPORTE" && (
                <div className="mt-8 flex justify-between items-end border-t border-light-border dark:border-white/5 pt-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-[#2277B4] hover:bg-[#125280] shadow-lg shadow-[#2277B450] text-white rounded-xl px-4 py-2">
                      <Edit2 size={16} /> Editar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-red-800 flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
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
          : <form onSubmit={handleUpdate} className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="NOMBRE DEL PRODUCTO"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Nombre"
                  className="text-light-text-primary dark:text-white bg-light-bg dark:!bg-black/30 border-light-border dark:border-white/10"
                />
                <div className="w-full space-y-1.5">
                  <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 ml-1 uppercase tracking-wider">
                    CATEGORÍA
                  </label>
                  <input
                    value={editForm.category}
                    readOnly
                    placeholder="Categoría"
                    className="w-full rounded-xl px-4 py-3 text-sm bg-zinc-100 dark:bg-dark-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-dark-700 cursor-not-allowed outline-none transition-colors"
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
                  className="text-light-text-primary dark:text-white bg-light-bg dark:!bg-black/30 border-light-border dark:border-white/10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-light-text-secondary dark:text-zinc-400 ml-1">
                  Descripción
                </label>
                <textarea
                  className="w-full bg-white text-light-text-primary text-sm border border-zinc-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#1a2b4c] resize-none h-32"
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
                  className="flex-1 py-3 text-zinc-600 font-semibold rounded-xl hover:bg-zinc-100 transition-colors">
                  Cancelar
                </button>
                <button
                  className="flex-1 py-3 bg-[#2277B4] hover:bg-[#125280] text-white font-bold rounded-xl shadow-lg shadow-[#2277B450] transition-all duration-150 active:scale-95 active:translate-y-px"
                  type="submit">
                  Guardar Cambios
                </button>
              </div>
            </form>
          }
        </div>

        <div className="w-full md:w-96 space-y-6">
          {/* Tarjeta de actualizacion de precio */}
          {user?.role?.name !== "SOPORTE" && (
            <div className="rounded-md p-6 bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 shadow-md shadow-zinc-200 dark:shadow-none">
              <h3 className="font-semibold text-light-text-primary dark:text-zinc-100 mb-2 flex items-center gap-2">
                <span className="text-black dark:text-zinc-400">$</span> Actualizar Precio
              </h3>
              <div className="flex gap-2 items-end">
                <div className="w-full">
                  {newPrice && !isNaN(newPrice) && (
                    <div className="text-[10px] text-black dark:text-zinc-400 mt-1 font-mono text-right">
                      + IVA: ${(parseFloat(newPrice) * 0.16).toFixed(2)}
                    </div>
                  )}
                  <div className="relative">
                    <input
                      id="price-update-input"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full rounded-xl pl-4 pr-12 py-3 font-mono text-lg text-light-text-primary dark:text-zinc-100 bg-white dark:bg-dark-800 border border-[#cfd9e6] dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-md border border-[#b8cce6] dark:border-dark-600 shadow-sm">
                      <button
                        type="button"
                        onClick={() => handlePriceStep(1)}
                        className="size-4 leading-none text-[10px] font-bold text-[#2277B4] dark:text-blue-400 bg-[#e8f2ff] dark:bg-dark-700 hover:bg-[#dcecff] hover:dark:bg-dark-600 transition-colors">
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePriceStep(-1)}
                        className="size-4 leading-none text-[10px] font-bold text-[#2277B4] dark:text-blue-400 bg-[#e8f2ff] dark:bg-dark-700 hover:bg-[#dcecff] hover:dark:bg-dark-600 border-t border-[#b8cce6] dark:border-dark-600 transition-colors">
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  className="text-white bg-[#2277B4] rounded-full px-4 py-2 hover:bg-[#125280] shadow-lg shadow-[#2277B450] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handlePriceUpdate}
                  disabled={updatingPrice || !newPrice}>
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
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
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
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#2277B4]"
                  />
                  {globalFilter && (
                    <button
                      onClick={() => {
                        setSelectedHistoryDate(null);
                        setGlobalFilter("");
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
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
                    className="w-full rounded-lg border border-zinc-200 dark:border-dark-700 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2277B4] text-zinc-700 dark:text-zinc-100 bg-white dark:bg-dark-800"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50/30 dark:bg-dark-800/30">
              {table.getRowModel().rows.length > 0 ?
                <div className="space-y-3">
                  {table.getRowModel().rows.map((row) => (
                    <div
                      key={row.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-white dark:bg-dark-800 shadow-sm border border-zinc-100/80 dark:border-dark-700 transition-colors">
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
              : <div className="text-center py-8 text-light-text-secondary dark:text-zinc-500 text-sm">
                  {product.price_history?.length > 0 ?
                    "No hay resultados para la búsqueda."
                  : "No hay historial registrado."}
                </div>
              }
            </div>

            {/* Paginación */}
            {product.price_history && product.price_history.length > 3 && (
              <div className="px-4 py-3 border-t border-zinc-100 dark:border-dark-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-black dark:text-zinc-100">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[11px] font-medium text-black dark:text-zinc-100 min-w-max">
                    Pág {table.getState().pagination.pageIndex + 1} de{" "}
                    {Math.max(1, table.getPageCount())}
                  </span>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-black dark:text-zinc-100">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value));
                  }}
                  className="text-[11px] bg-zinc-50 dark:bg-dark-800 border border-zinc-200 dark:border-dark-700 rounded px-1.5 py-1 text-zinc-600 dark:text-zinc-300 outline-none">
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
            const editHistory = (product.update_history || []).filter(e => e.change_type !== "PRICE");
            const totalPages = Math.max(1, Math.ceil(editHistory.length / updatePagination.pageSize));
            const paged = editHistory.slice(
              updatePagination.pageIndex * updatePagination.pageSize,
              (updatePagination.pageIndex + 1) * updatePagination.pageSize
            );
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
                  <div className="divide-y divide-[#eef3f8] dark:divide-white/10">
                    {paged.map((entry, idx) => {
                      const date = new Date(entry.changed_at);
                      return (
                        <div
                          key={entry.id || idx}
                          className="grid grid-cols-[44px_minmax(0,1fr)_118px] items-center gap-2 px-3 py-2 text-[11px] hover:bg-[#f8fbff] dark:hover:bg-white/5">
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
                        onClick={() => setUpdatePagination(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
                        disabled={updatePagination.pageIndex === 0}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-black dark:text-zinc-100">
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-[11px] font-medium text-black dark:text-zinc-100 min-w-max">
                        Pág {updatePagination.pageIndex + 1} de{" "}
                        {totalPages}
                      </span>
                      <button
                        onClick={() => setUpdatePagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
                        disabled={(updatePagination.pageIndex + 1) * updatePagination.pageSize >= editHistory.length}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-black dark:text-zinc-100">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <select
                      value={updatePagination.pageSize}
                      onChange={(e) => {
                        setUpdatePagination({ pageIndex: 0, pageSize: Number(e.target.value) });
                      }}
                      className="text-[11px] bg-zinc-50 dark:bg-dark-800 border border-zinc-200 dark:border-dark-700 rounded px-1.5 py-1 text-zinc-600 dark:text-zinc-300 outline-none">
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
