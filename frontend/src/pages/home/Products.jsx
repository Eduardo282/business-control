import { useEffect, useState, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";
import {
  listProductsApi,
  deleteProductApi,
} from "../../actionsAPI/products.api";
import {
  PackageX,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Trash2,
  ExternalLink,
  Users,
  FileSpreadsheet,
  FileText,
} from "@icons";
import LogoImg from "../../assets/logo.png";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
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
function ProductAvatar({ name = "", category = "" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const [bg, fg] = getAvatarColors(category + name);
  return (
    <div
      className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-extrabold tracking-tight select-none"
      style={{ backgroundColor: bg, color: fg }}>
      {initials || "?"}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatPrice(val) {
  return (parseFloat(val) || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const HIDDEN_PRODUCT_CATEGORIES = new Set([
  "poliza personalizada",
  "servicio personalizado",
]);

function normalizeCategory(category = "") {
  return String(category)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isServicePolicyCategory(category = "") {
  return HIDDEN_PRODUCT_CATEGORIES.has(normalizeCategory(category));
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Products({ categoryFilter }) {
  const { user } = useContext(AuthContext);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterUsers, setFilterUsers] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      setAllProducts(await listProductsApi());
    } catch (e) {
      setError(e.message || "Error cargando productos");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [
    q,
    filterCategory,
    filterPriceMin,
    filterPriceMax,
    filterUsers,
    categoryFilter,
  ]);

  const visibleProducts = useMemo(
    () => allProducts.filter((p) => !isServicePolicyCategory(p.category)),
    [allProducts],
  );

  const categories = useMemo(
    () =>
      [
        ...new Set(visibleProducts.map((p) => p.category).filter(Boolean)),
      ].sort(),
    [visibleProducts],
  );

  const filteredProducts = useMemo(() => {
    return visibleProducts.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        if (
          ![p.name, p.category, p.description]
            .join(" ")
            .toLowerCase()
            .includes(needle)
        )
          return false;
      }
      if (filterCategory && p.category !== filterCategory) return false;
      if (
        filterPriceMin !== "" &&
        parseFloat(p.current_price) < parseFloat(filterPriceMin)
      )
        return false;
      if (
        filterPriceMax !== "" &&
        parseFloat(p.current_price) > parseFloat(filterPriceMax)
      )
        return false;
      if (filterUsers !== "" && parseInt(p.users_count) < parseInt(filterUsers))
        return false;
      return true;
    });
  }, [
    visibleProducts,
    q,
    filterCategory,
    filterPriceMin,
    filterPriceMax,
    filterUsers,
    categoryFilter,
  ]);

  const activeFilterCount = [
    q.trim(),
    filterCategory,
    filterPriceMin,
    filterPriceMax,
    filterUsers,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setQ("");
    setFilterCategory("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterUsers("");
  };

  const remove = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro de eliminar el producto?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteProductApi(id);
      setAllProducts((prev) => prev.filter((p) => p.id !== id));
      Swal.fire({
        title: "¡Eliminado!",
        text: "El producto ha sido eliminado exitosamente.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "Error eliminando producto.",
        icon: "error",
      });
    }
  };

  // ── Columnas TanStack ──────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        id: "product",
        header: "PRODUCTO",
        accessorFn: (p) => p.name,
        enableSorting: true,
        cell: ({ row: { original: p } }) => (
          <div className="flex items-center gap-3">
            <ProductAvatar name={p.name} category={p.category} />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-gray-800 text-[13px] tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {p.name}
              </span>
              <span className="text-[11px] text-gray-400 truncate max-w-[200px] sm:max-w-xs">
                {p.description || "Sin descripción"}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "CATEGORÍA",
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: "current_price",
        header: "PRECIO",
        enableSorting: true,
        cell: ({ getValue }) => (
          <div className="text-right sm:text-left">
            <span className="font-medium text-gray-800 text-[13px]">
              ${formatPrice(getValue())}
            </span>
            <span className="block text-[10px] text-gray-400 mt-0.5">MXN</span>
          </div>
        ),
      },
      {
        accessorKey: "users_count",
        header: "LÍMITE USUARIOS.",
        enableSorting: true,
        cell: ({ getValue }) => {
          const v = getValue();
          if (!v) return <span className="text-gray-300 text-xs">—</span>;
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 font-medium">
              <Users size={12} className="text-gray-400" /> {v}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "ACCIONES",
        enableSorting: false,
        cell: ({ row: { original: p } }) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              to={`/productos/${p.id}`}
              className="px-4 py-1.5 text-sm font-extrabold text-[#2277B4] bg-gradient-to-b from-white to-[#E2E8F0] rounded-xl 
                         border border-[#CBD5E1]/80 hover:from-[#F8FAFC] hover:to-[#CBD5E1] active:from-[#E2E8F0] active:to-[#F1F5F9]
                         shadow-[0_4px_4px_rgba(0,0,0,0.1),_0_8px_16px_rgba(0,0,0,0.1),_inset_0_2px_4px_rgba(255,255,255,1),_inset_0_-3px_4px_rgba(0,0,0,0.1)] 
                         active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.2),_inset_0_-2px_2px_rgba(255,255,255,0.5)] 
                         active:translate-y-1 transition-all duration-100 ease-out flex items-center gap-1">
              <ExternalLink size={16} /> Detalles
            </Link>
            {user?.role?.name !== "SOPORTE" && (
              <button
                onClick={() => remove(p.id)}
                className="px-3 py-1.5 rounded-lg text-red-800  transition-all text-sm font-bold border-red-200 flex items-center gap-1 hover:scale-90"
                title="Eliminar producto">
                <Trash2 size={16} className="text-red-700" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [user],
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
    if (pagination.pageIndex > pageCount - 1)
      setPagination((prev) => ({
        ...prev,
        pageIndex: Math.max(0, pageCount - 1),
      }));
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

  const handleExportPDF = async () => {
    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableModule.default || autoTableModule.autoTable;
      const doc = new jsPDF();

      // Page 1: Logo and Title
      doc.addImage(LogoImg, "PNG", 15, 15, 60, 20);

      doc.setFontSize(22);
      doc.setTextColor(26, 43, 76);
      doc.text("Catálogo de Productos", 15, 50);

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Fecha de exportación: ${new Date().toLocaleDateString()}`,
        15,
        60,
      );
      doc.text(`Total de registros: ${filteredProducts.length}`, 15, 68);

      // Page 2: Table
      doc.addPage();

      const tableData = filteredProducts.map((p) => [
        p.name || "",
        p.category || "",
        `$${parseFloat(p.current_price || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        p.users_count || "0",
        p.description || "",
      ]);

      autoTable(doc, {
        startY: 15,
        head: [
          ["PRODUCTO", "CATEGORÍA", "PRECIO", "LÍMITE USR.", "DESCRIPCIÓN"],
        ],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [34, 119, 180] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          4: { cellWidth: 70 }, // Da más espacio a la columna de descripción y hace que el texto baje de línea
        },
      });

      doc.save("Productos_BusinessControl.pdf");
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar el PDF.",
        icon: "error",
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const data = filteredProducts.map((p) => ({
        Producto: p.name || "",
        Categoría: p.category || "",
        Precio: parseFloat(p.current_price || 0),
        "Límite Usuarios": parseInt(p.users_count || 0, 10),
        Descripción: p.description || "",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Productos");

      XLSX.writeFile(wb, "Productos_BusinessControl.xlsx");
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar el Excel.",
        icon: "error",
      });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              {categoryFilter ? categoryFilter + "s" : "Catálogo de Productos"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {categoryFilter ?
                `Administra el inventario de ${categoryFilter}s disponibles.`
              : "Productos para tus clientes."}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, categoría…"
                className="w-full pl-4 pr-8 py-2 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
              title="Exportar a PDF">
              <FileText size={14} />
              Exportar PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 transition-colors whitespace-nowrap"
              title="Exportar a Excel">
              <FileSpreadsheet size={14} />
              Exportar Excel
            </button>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                showFilters || activeFilterCount > 0 ?
                  "bg-[#2277B4] text-white"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}>
              <SlidersHorizontal size={15} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-white text-[#1a2b4c] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Panel filtros */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Categoría
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Todas</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-[120px]">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Precio mín $
                </label>
                <input
                  type="number"
                  min="0"
                  value={filterPriceMin}
                  onChange={(e) => setFilterPriceMin(e.target.value)}
                  placeholder="0"
                  className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1 w-[120px]">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Precio máx $
                </label>
                <input
                  type="number"
                  min="0"
                  value={filterPriceMax}
                  onChange={(e) => setFilterPriceMax(e.target.value)}
                  placeholder="∞"
                  className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1 w-[130px]">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Usuarios (mín)
                </label>
                <input
                  type="number"
                  min="0"
                  value={filterUsers}
                  onChange={(e) => setFilterUsers(e.target.value)}
                  placeholder="Cualquiera"
                  className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-500 text-sm font-medium hover:bg-red-50 transition-colors self-end">
                  <X size={13} /> Limpiar
                </button>
              )}
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {q.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                    Texto: "{q.trim()}"{" "}
                    <button onClick={() => setQ("")}>
                      <X size={10} />
                    </button>
                  </span>
                )}
                {filterCategory && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">
                    Cat: {filterCategory}{" "}
                    <button onClick={() => setFilterCategory("")}>
                      <X size={10} />
                    </button>
                  </span>
                )}
                {filterPriceMin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                    Precio ≥ ${filterPriceMin}{" "}
                    <button onClick={() => setFilterPriceMin("")}>
                      <X size={10} />
                    </button>
                  </span>
                )}
                {filterPriceMax && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                    Precio ≤ ${filterPriceMax}{" "}
                    <button onClick={() => setFilterPriceMax("")}>
                      <X size={10} />
                    </button>
                  </span>
                )}
                {filterUsers && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-200">
                    Usuarios ≥ {filterUsers}{" "}
                    <button onClick={() => setFilterUsers("")}>
                      <X size={10} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="w-full">
        {loading ?
          <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 scale-110" />
            <p className="text-gray-400 font-medium tracking-wide">
              Analizando catálogo de productos...
            </p>
          </div>
        : filteredProducts.length === 0 ?
          <div className="p-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-center mb-6 opacity-20">
              <PackageX size={64} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              No se encontraron coincidencias
            </h3>
            <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">
              Intenta utilizar términos diferentes o ajusta los filtros activos
              para expandir la búsqueda.
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-6 px-6 py-2.5 rounded-xl bg-[#1a2b4c] text-white text-sm font-bold shadow-md hover:bg-[#243660] hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                Restablecer todos los filtros
              </button>
            )}
          </div>
        : <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden glass-panel">
            {/* Toolbar de tabla */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
              <span className="text-[13px] text-gray-500 font-medium">
                {(() => {
                  const total = filteredProducts.length;
                  const start = pagination.pageIndex * pagination.pageSize + 1;
                  const end = Math.min(
                    total,
                    (pagination.pageIndex + 1) * pagination.pageSize,
                  );
                  return `Mostrando ${start} a ${end} de ${total} resultados`;
                })()}
              </span>
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-gray-500 flex items-center gap-2">
                  Mostrar
                  <select
                    value={pagination.pageSize}
                    onChange={(e) =>
                      setPagination({
                        pageIndex: 0,
                        pageSize: Number(e.target.value),
                      })
                    }
                    className="px-2 py-1 rounded-md border border-gray-200 text-[12px] text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    {[10, 25, 50, 100].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Tabla Tradicional */}
            <div
              className={`overflow-x-auto ${isTableScrollable ? "max-h-[65vh] overflow-y-auto" : ""}`}>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className={isTableScrollable ? "sticky top-0 z-20" : ""}>
                  {table.getHeaderGroups().map((hg) => (
                    <tr
                      key={hg.id}
                      className="bg-gray-50/80 border-b border-gray-200">
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className={`px-5 py-3 text-[11px] font-bold text-[#2277B4] uppercase tracking-wider ${
                            header.column.getCanSort() ?
                              "cursor-pointer select-none hover:bg-gray-100 transition-colors"
                            : ""
                          }`}>
                          <div
                            className={`flex items-center gap-1.5 ${header.column.id === "actions" ? "justify-center" : ""}`}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanSort() && (
                              <span className="text-gray-400">
                                {header.column.getIsSorted() === "asc" ?
                                  <ChevronUp
                                    size={12}
                                    className="text-blue-600"
                                  />
                                : header.column.getIsSorted() === "desc" ?
                                  <ChevronDown
                                    size={12}
                                    className="text-blue-600"
                                  />
                                : <ChevronsUpDown
                                    size={12}
                                    className="opacity-50"
                                  />
                                }
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100/80">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/70 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-3.5">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación final */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-[12px] text-gray-500">
                Página {pagination.pageIndex + 1} de {table.getPageCount()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-600 text-[12px] font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:hover:bg-white shadow-sm">
                  Anterior
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-600 text-[12px] font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:hover:bg-white shadow-sm">
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  );
}
