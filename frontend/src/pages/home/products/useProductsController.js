import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteProductApi, listProductsApi } from "../../../actionsAPI/products.api";
import { notificationService } from "../../../services/notificationService";
import { QUICK_FILTER_BUTTONS } from "./productConstants";
import {
  groupProductsByName,
  inferProductType,
  normalizeCategory,
} from "./productHelpers";

export default function useProductsController({ categoryFilter } = {}) {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFolio, setFilterFolio] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterUsers, setFilterUsers] = useState("");
  const [activeFilterPickerField, setActiveFilterPickerField] = useState(null);
  const [filterPickerSearch, setFilterPickerSearch] = useState("");
  const [filterPickerPage, setFilterPickerPage] = useState(0);
  const [selectedProductByGroup, setSelectedProductByGroup] = useState({});
  const [activeFolioGroup, setActiveFolioGroup] = useState(null);

  const loadProducts = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await listProductsApi();
      setAllProducts(data);
    } catch (e) {
      setError(e.message || "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!showFilters) {
      setActiveFilterPickerField(null);
      setFilterPickerSearch("");
      setFilterPickerPage(0);
    }
  }, [showFilters]);

  const visibleProducts = useMemo(() => allProducts, [allProducts]);

  const categories = useMemo(
    () =>
      [
        ...new Set(visibleProducts.map((p) => p.category).filter(Boolean)),
      ].sort(),
    [visibleProducts],
  );

  const folios = useMemo(
    () =>
      [...new Set(visibleProducts.map((p) => p.folio).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "es", { sensitivity: "base" }),
      ),
    [visibleProducts],
  );

  const quickFilterButtons = QUICK_FILTER_BUTTONS;

  const activeFilterPickerConfig =
    quickFilterButtons.find(
      (button) => button.id === activeFilterPickerField,
    ) || null;

  const filterPickerOptions = useMemo(() => {
    const options =
      activeFilterPickerField === "category"
        ? categories
        : activeFilterPickerField === "folio"
          ? folios
          : [];
    const search = normalizeCategory(filterPickerSearch);
    if (!search) return options;
    return options.filter((value) =>
      normalizeCategory(value).includes(search),
    );
  }, [activeFilterPickerField, categories, folios, filterPickerSearch]);

  const productFilters = useMemo(
    () => ({ category: filterCategory, folio: filterFolio }),
    [filterCategory, filterFolio],
  );

  const filteredProducts = useMemo(() => {
    const filtered = visibleProducts.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        if (
          ![p.folio, p.name, p.category, p.description]
            .join(" ")
            .toLowerCase()
            .includes(needle)
        )
          return false;
      }
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterFolio && p.folio !== filterFolio) return false;
      if (filterType && inferProductType(p) !== filterType) return false;
      if (
        filterPriceMin !== "" &&
        Number(p.current_price) < Number(filterPriceMin)
      )
        return false;
      if (
        filterPriceMax !== "" &&
        Number(p.current_price) > Number(filterPriceMax)
      )
        return false;
      if (
        filterUsers !== "" &&
        Number(p.users_count) < Number(filterUsers)
      )
        return false;
      return true;
    });

    return groupProductsByName(filtered, selectedProductByGroup);
  }, [
    visibleProducts,
    q,
    filterCategory,
    filterFolio,
    filterType,
    filterPriceMin,
    filterPriceMax,
    filterUsers,
    categoryFilter,
    selectedProductByGroup,
  ]);

  const activeFilterCount = [
    filterCategory,
    filterFolio,
    filterType,
    filterPriceMin,
    filterPriceMax,
    filterUsers,
  ].filter((value) => value !== "").length;

  const clearFilters = useCallback(() => {
    setFilterCategory("");
    setFilterFolio("");
    setFilterType("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterUsers("");
    setActiveFilterPickerField(null);
    setFilterPickerSearch("");
    setFilterPickerPage(0);
  }, []);

  const applyFilterValue = useCallback((fieldName, value) => {
    if (fieldName === "category") setFilterCategory(value);
    if (fieldName === "folio") setFilterFolio(value);
  }, []);

  const remove = useCallback(async (id) => {
    const confirmed = await notificationService.confirm({
      title: "¿Estás seguro de eliminar el producto?",
      text: "Esta acción no se puede deshacer.",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      await deleteProductApi(id);
      setAllProducts((prev) => prev.filter((p) => p.id !== id));
      notificationService.toast({ title: "¡Producto eliminado exitosamente!", icon: "success" });
    } catch (e) {
      notificationService.error("Error", e.message || "Error eliminando producto.");
    }
  }, []);

  const handleSelectGroupProduct = useCallback((groupKey, product) => {
    setSelectedProductByGroup((current) => ({
      ...current,
      [groupKey]: product.id,
    }));
    setActiveFolioGroup(null);
  }, []);

  return {
    activeFilterCount,
    activeFilterPickerConfig,
    activeFilterPickerField,
    activeFolioGroup,
    allProducts,
    applyFilterValue,
    categoryFilter,
    clearFilters,
    error,
    filterCategory,
    filteredProducts,
    filterFolio,
    filterPickerOptions,
    filterPickerPage,
    filterPickerSearch,
    filterPriceMax,
    filterPriceMin,
    filterType,
    filterUsers,
    handleSelectGroupProduct,
    loading,
    productFilters,
    q,
    quickFilterButtons,
    remove,
    setActiveFilterPickerField,
    setActiveFolioGroup,
    setFilterCategory,
    setFilterFolio,
    setFilterPickerPage,
    setFilterPickerSearch,
    setFilterPriceMax,
    setFilterPriceMin,
    setFilterType,
    setFilterUsers,
    setQ,
    setShowFilters,
    showFilters,
  };
}
