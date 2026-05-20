import { useEffect, useState, useContext, useMemo } from "react";
import { createPortal } from "react-dom";
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
  Search,
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
import { exportRowsToExcel } from "../../utils/excelExport";

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
function getProductKeyword(name) {
  const n = String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (n.includes("taco")) return "tacos,mexican-food";
  if (n.includes("comida") || n.includes("restaurante"))
    return "food,restaurant";
  if (n.includes("nube") || n.includes("cloud")) return "cloud,technology";
  if (n.includes("banco") || n.includes("finanza")) return "finance,business";
  if (n.includes("factura") || n.includes("venta") || n.includes("comercial"))
    return "sales,business";
  if (n.includes("nomina") || n.includes("rrhh")) return "office,team";
  if (n.includes("contabilidad") || n.includes("conta"))
    return "accounting,business";
  if (n.includes("seguro") || n.includes("poliza")) return "insurance,business";
  return "business,product";
}

function ProductAvatar({ name = "", category = "" }) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const [bg, fg] = getAvatarColors(category + name);

  if (!imgError && name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    }
    const keyword = getProductKeyword(name + " " + category);
    const imgUrl = `https://loremflickr.com/100/100/${keyword}?lock=${(h % 1000) + 1}`;

    return (
      <div className="flex-shrink-0 size-9 rounded-lg overflow-hidden bg-white border border-zinc-100 shadow-sm">
        <img
          src={imgUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 size-9 rounded-lg flex items-center justify-center text-[11px] font-extrabold tracking-tight select-none"
      style={{ backgroundColor: bg, color: fg }}
    >
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

function normalizeCategory(category = "") {
  return String(category)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function inferProductType(product) {
  const source = `${product?.name || ""} ${product?.category || ""}`;
  const normalized = normalizeCategory(source);

  if (normalized.includes("poliza")) return "POLICY";
  if (normalized.includes("servicio")) return "SERVICE";
  return "PRODUCT";
}

function getTypeFilterLabel(type) {
  if (type === "POLICY") return "Pólizas";
  if (type === "SERVICE") return "Servicios";
  if (type === "PRODUCT") return "Productos";
  return "Todos";
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
  const [filterType, setFilterType] = useState("");
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
    filterType,
    filterPriceMin,
    filterPriceMax,
    filterUsers,
    categoryFilter,
  ]);

  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);

  const visibleProducts = useMemo(() => allProducts, [allProducts]);

  const categories = useMemo(
    () =>
      [
        ...new Set(visibleProducts.map((p) => p.category).filter(Boolean)),
      ].sort(),
    [visibleProducts],
  );

  const CATEGORY_CHIPS_PAGE_SIZE = 12;
  const categoriesWithAll = useMemo(
    () => ["Todas", ...categories],
    [categories],
  );
  const totalCategoryPages = Math.max(
    1,
    Math.ceil(categoriesWithAll.length / CATEGORY_CHIPS_PAGE_SIZE),
  );
  const safeCategoryPage = Math.min(categoryPage, totalCategoryPages);

  const visibleCategories = useMemo(() => {
    const start = (safeCategoryPage - 1) * CATEGORY_CHIPS_PAGE_SIZE;
    return categoriesWithAll.slice(start, start + CATEGORY_CHIPS_PAGE_SIZE);
  }, [categoriesWithAll, safeCategoryPage]);

  const filteredProducts = useMemo(() => {
    const filtered = visibleProducts.filter((p) => {
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
      if (filterType && inferProductType(p) !== filterType) return false;
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

    // Agrupar productos idénticos
    const map = new Map();
    filtered.forEach((p) => {
      const nName = String(p.name || "")
        .trim()
        .toLowerCase();
      const nCat = String(p.category || "")
        .trim()
        .toLowerCase();
      const key = `${nName}|${nCat}`;
      if (!map.has(key)) {
        map.set(key, { ...p, _groupCount: 1, _groupItems: [p] });
      } else {
        const existing = map.get(key);
        existing._groupCount += 1;
        existing._groupItems.push(p);
      }
    });

    return Array.from(map.values());
  }, [
    visibleProducts,
    q,
    filterCategory,
    filterType,
    filterPriceMin,
    filterPriceMax,
    filterUsers,
    categoryFilter,
  ]);

  const activeFilterCount = [
    q.trim(),
    filterCategory,
    filterType,
    filterPriceMin,
    filterPriceMax,
    filterUsers,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setQ("");
    setFilterCategory("");
    setFilterType("");
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
            <div className="relative">
              <ProductAvatar name={p.name} category={p.category} />
              {p._groupCount > 1 && (
                <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 border-2 border-white shadow-sm">
                  x{p._groupCount}
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-[13px] tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {p.name}
              </span>
              <span className="text-[11px] text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
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
          <span className="inline-flex px-2 py-1 bg-zinc-100 dark:bg-dark-700 text-zinc-600 dark:text-zinc-300 rounded text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
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
            <span className="font-medium text-zinc-800 dark:text-zinc-100 text-[13px]">
              ${formatPrice(getValue())}
            </span>
            <span className="block text-[10px] text-zinc-400 mt-0.5">MXN</span>
          </div>
        ),
      },
      {
        accessorKey: "users_count",
        header: "LÍMITE USUARIOS.",
        enableSorting: true,
        cell: ({ row: { original: p }, getValue }) => {
          const type = inferProductType(p);
          const isServiceOrPolicy = type === "SERVICE" || type === "POLICY";
          const v = isServiceOrPolicy ? 1 : getValue();

          if (!v) return <span className="text-zinc-300 text-xs">—</span>;
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              <Users size={12} className="text-zinc-400 dark:text-zinc-500" />{" "}
              {v}
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
              className="px-4 py-1.5 text-sm font-semibold text-[#2277B4] dark:text-primary-400 bg-white dark:bg-dark-800 rounded-xl border border-[#CBD5E1] dark:border-dark-700 hover:bg-[#F8FAFC] dark:hover:bg-dark-700 hover:border-[#B8C6D8] dark:hover:border-dark-600 shadow-sm transition-colors duration-150 flex items-center gap-1"
            >
              <ExternalLink size={16} /> Detalles
            </Link>
            {user?.role?.name !== "SOPORTE" && (
              <button
                onClick={() => remove(p.id)}
                className="px-3 py-1.5 rounded-lg text-red-800 dark:text-red-400 transition-all text-sm font-bold border-red-200 flex items-center gap-1 hover:scale-90"
                title="Eliminar producto"
              >
                <Trash2 size={16} className="text-red-700 dark:text-red-400" />
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
      doc.addImage(LogoImg, "PNG", 15, 12, 50, 38);

      doc.setFontSize(22);
      doc.setTextColor(26, 43, 76);
      doc.text("Catálogo de Productos", 15, 62);

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Fecha de exportación: ${new Date().toLocaleDateString()}`,
        15,
        72,
      );
      doc.text(`Total de registros: ${filteredProducts.length}`, 15, 80);

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
          [
            "PRODUCTO",
            "CATEGORÍA",
            "PRECIO",
            "LÍMITE DE USUARIOS",
            "DESCRIPCIÓN",
          ],
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
      const data = filteredProducts.map((p) => ({
        Producto: p.name || "",
        Categoría: p.category || "",
        Precio: parseFloat(p.current_price || 0),
        "Límite Usuarios": parseInt(p.users_count || 0, 10),
        Descripción: p.description || "",
      }));

      await exportRowsToExcel({
        rows: data,
        sheetName: "Productos",
        fileName: "Productos_BusinessControl.xlsx",
      });
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
      <div className="bg-white dark:bg-dark-800 p-6 rounded-md border border-zinc-200 dark:border-dark-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">
              {categoryFilter ? categoryFilter + "s" : "Catálogo de Productos"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {categoryFilter
                ? `Administra el inventario de ${categoryFilter}s disponibles.`
                : "Productos para clientes."}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              {!q && (
                <Search
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
              )}
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, categoría…"
                className="w-full pl-4 pr-9 py-2 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold border border-red-200 dark:border-red-900/50 bg-white dark:bg-dark-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap"
              title="Exportar a PDF"
            >
              <FileText size={14} />
              Exportar a PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-dark-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors whitespace-nowrap"
              title="Exportar a Excel"
            >
              <FileSpreadsheet size={14} />
              Exportar a Excel
            </button>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-[#2277B4] text-white border-transparent"
                  : "bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-dark-700 hover:border-zinc-400 dark:hover:border-zinc-500"
              }`}
            >
              <SlidersHorizontal size={15} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-white text-[#1a2b4c] text-[10px] font-bold rounded-full size-4 flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Panel filtros */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-zinc-100 animate-fade-in">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 min-w-[180px]">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Categoría
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryPage(1);
                    setIsCategoriesModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-between w-full shadow-sm hover:bg-zinc-50 dark:hover:bg-dark-800 cursor-pointer"
                >
                  <span className="truncate">
                    {filterCategory === "" ? "Todas" : filterCategory}
                  </span>
                  <ChevronDown
                    size={16}
                    className="text-zinc-400 dark:text-zinc-500 ml-2 flex-shrink-0"
                  />
                </button>
              </div>
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Tipo
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Todos</option>
                  <option value="PRODUCT">Productos</option>
                  <option value="SERVICE">Servicios</option>
                  <option value="POLICY">Pólizas</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 w-[120px]">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Precio mín $
                </label>
                <input
                  type="number"
                  min="0"
                  value={filterPriceMin}
                  onChange={(e) => setFilterPriceMin(e.target.value)}
                  placeholder="0"
                  className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1 w-[120px]">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Precio máx $
                </label>
                <input
                  type="number"
                  min="0"
                  value={filterPriceMax}
                  onChange={(e) => setFilterPriceMax(e.target.value)}
                  placeholder="∞"
                  className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1 w-[130px]">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Usuarios (mín)
                </label>
                <input
                  type="number"
                  min="0"
                  value={filterUsers}
                  onChange={(e) => setFilterUsers(e.target.value)}
                  placeholder="Cualquiera"
                  className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors self-end"
                >
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
                {filterType && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
                    Tipo: {getTypeFilterLabel(filterType)}{" "}
                    <button onClick={() => setFilterType("")}>
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="w-full">
        {loading ? (
          <div className="p-16 text-center bg-white dark:bg-dark-800 rounded-3xl border border-zinc-100 dark:border-dark-700 shadow-sm">
            <div className="animate-spin size-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 scale-110" />
            <p className="text-zinc-400 font-medium tracking-wide">
              Analizando catálogo de productos...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-20 text-center bg-white dark:bg-dark-800 rounded-3xl border border-zinc-100 dark:border-dark-700 shadow-sm">
            <div className="flex justify-center mb-6 opacity-20">
              <PackageX size={64} />
            </div>
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              No se encontraron productos
            </h3>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-zinc-200 dark:border-dark-700 shadow-sm overflow-hidden glass-panel">
            {/* Toolbar de tabla */}
            <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center justify-end gap-3 bg-zinc-50/50 dark:bg-dark-900/50">
              <span className="text-[12px] text-zinc-500">
                Pág. {pagination.pageIndex + 1} de {table.getPageCount()}
              </span>
            </div>

            {/* Tabla Tradicional */}
            <div
              className={`overflow-x-auto ${isTableScrollable ? "max-h-[65vh] overflow-y-auto" : ""}`}
            >
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className={isTableScrollable ? "sticky top-0 z-20" : ""}>
                  {table.getHeaderGroups().map((hg) => (
                    <tr
                      key={hg.id}
                      className="bg-zinc-50/80 dark:bg-dark-900/50 border-b border-zinc-200 dark:border-dark-700"
                    >
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className={`px-5 py-3 text-[11px] font-bold text-[#2277B4] dark:text-primary-400 uppercase tracking-wider ${
                            header.column.getCanSort()
                              ? "cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-dark-800 transition-colors"
                              : ""
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 ${header.column.id === "actions" ? "justify-center" : ""}`}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanSort() && (
                              <span className="text-zinc-400">
                                {header.column.getIsSorted() === "asc" ? (
                                  <ChevronUp
                                    size={12}
                                    className="text-blue-600"
                                  />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ChevronDown
                                    size={12}
                                    className="text-blue-600"
                                  />
                                ) : (
                                  <ChevronsUpDown
                                    size={12}
                                    className="opacity-50"
                                  />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-zinc-100/80 dark:divide-dark-700/80">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-dark-700/50 transition-colors"
                    >
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

            <div className="px-5 py-3 border-t border-zinc-100 dark:border-dark-700 flex items-center justify-between bg-zinc-50/50 dark:bg-dark-900/50">
              <label className="text-[12px] text-zinc-500 flex items-center gap-2">
                Mostrar
                <select
                  value={pagination.pageSize}
                  onChange={(e) =>
                    setPagination({
                      pageIndex: 0,
                      pageSize: Number(e.target.value),
                    })
                  }
                  className="px-2 py-1 rounded-md border border-zinc-200 dark:border-dark-700 text-[12px] text-zinc-700 dark:text-zinc-300 bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                >
                  {[10, 25, 50, 100].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="px-2 py-1.5 rounded-md border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-400 text-[12px] font-medium hover:bg-zinc-50 dark:hover:bg-dark-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-dark-900 shadow-sm"
                >
                  ««
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-400 text-[12px] font-medium hover:bg-zinc-50 dark:hover:bg-dark-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-dark-900 shadow-sm"
                >
                  Anterior
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-400 text-[12px] font-medium hover:bg-zinc-50 dark:hover:bg-dark-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-dark-900 shadow-sm"
                >
                  Siguiente
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="px-2 py-1.5 rounded-md border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-400 text-[12px] font-medium hover:bg-zinc-50 dark:hover:bg-dark-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-dark-900 shadow-sm"
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal de categorías */}
        {isCategoriesModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-zinc-500/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in relative border border-zinc-200 dark:border-dark-700">
                <div className="p-4 border-b border-white/10 bg-[#1a2b4c] flex items-center justify-between">
                  <h2 className="font-semibold text-white text-lg">
                    Categorías
                  </h2>
                  <button
                    onClick={() => setIsCategoriesModalOpen(false)}
                    className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase mb-3 tracking-wider">
                      Selecciona una categoría
                    </h3>
                    {categories.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Aún no hay categorías registradas.
                      </p>
                    ) : (
                      <div className="min-h-[190px] flex flex-col justify-between">
                        <div className="flex flex-wrap content-start gap-2 h-[138px] overflow-hidden pr-1">
                          {visibleCategories.map((cat) => {
                            const isSelected =
                              cat === "Todas"
                                ? filterCategory === ""
                                : cat === filterCategory;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setFilterCategory(cat === "Todas" ? "" : cat);
                                  setIsCategoriesModalOpen(false);
                                }}
                                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${
                                  isSelected
                                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-dark-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                                }`}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-dark-700 flex items-center justify-between">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                            Página {safeCategoryPage} de {totalCategoryPages}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setCategoryPage((prev) => Math.max(1, prev - 1))
                              }
                              disabled={safeCategoryPage === 1}
                              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-dark-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-dark-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
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
                              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-dark-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-dark-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}
