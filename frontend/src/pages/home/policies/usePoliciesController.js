import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSaleFromQuoteApi } from "../../../actionsAPI/sales.api";
import { notificationService } from "../../../services/notificationService";
import { normalizeSearchText } from "../../../utils/formatters";
import { SALES_FILTER_BUTTONS } from "./policyConstants";
import { usePolicies } from "./usePolicies";

export default function usePoliciesController() {
  const navigate = useNavigate();
  const [activeFilterPickerField, setActiveFilterPickerField] = useState(null);
  const [filterPickerSearch, setFilterPickerSearch] = useState("");
  const [filterPickerPage, setFilterPickerPage] = useState(0);
  const [creatingSale, setCreatingSale] = useState(false);

  const policiesData = usePolicies();

  const {
    activeFilterCount,
    clearFilters,
    closeSaleSummary,
    error,
    filterOptions,
    filteredSales,
    filters,
    handleDeleteSale,
    handleExportExcel,
    handleExportPDF,
    loading,
    metrics,
    openSaleSummary,
    pagination,
    q,
    selectedSale,
    setFilters,
    setPagination,
    setQ,
    setShowFilters,
    setSorting,
    showFilters,
    sorting,
  } = policiesData;

  const activeFilterPickerConfig = useMemo(
    () =>
      SALES_FILTER_BUTTONS.find(
        (button) => button.fieldName === activeFilterPickerField,
      ) || null,
    [activeFilterPickerField],
  );

  const filterPickerOptions = useMemo(() => {
    if (!activeFilterPickerConfig) return [];

    const options = filterOptions[activeFilterPickerConfig.optionsKey] || [];
    const search = normalizeSearchText(filterPickerSearch);
    if (!search) return options;

    return options.filter((value) =>
      normalizeSearchText(value).includes(search),
    );
  }, [activeFilterPickerConfig, filterOptions, filterPickerSearch]);

  const openFilterPicker = useCallback((fieldName) => {
    setActiveFilterPickerField(fieldName);
    setFilterPickerSearch("");
    setFilterPickerPage(0);
  }, []);

  const applyFilterValue = useCallback((fieldName, value) => {
    setFilters((prev) => ({ ...prev, [fieldName]: value }));
  }, [setFilters]);

  const toggleFilters = useCallback(() => {
    setShowFilters((visible) => {
      if (visible) {
        setActiveFilterPickerField(null);
        setFilterPickerSearch("");
        setFilterPickerPage(0);
      }
      return !visible;
    });
  }, [setShowFilters]);

  const handleCreateSale = useCallback(async (quote, quoteItemIds) => {
    if (!quote?.id || !quoteItemIds?.length) return;

    setCreatingSale(true);
    try {
      const createdSale = await createSaleFromQuoteApi({
        quote_id: quote.id,
        quote_item_ids: quoteItemIds,
      });
      notificationService.toast({
        title: "Venta generada correctamente.",
        icon: "success",
      });
      navigate(`/ventas/${createdSale.id}`);
    } catch (err) {
      notificationService.error(
        "Error",
        err.message || "No se pudo generar la venta.",
      );
    } finally {
      setCreatingSale(false);
    }
  }, [navigate]);

  return {
    activeFilterCount,
    activeFilterPickerConfig,
    activeFilterPickerField,
    applyFilterValue,
    clearFilters,
    closeSaleSummary,
    creatingSale,
    error,
    filterPickerOptions,
    filterPickerPage,
    filterPickerSearch,
    filteredSales,
    filters,
    handleCreateSale,
    handleDeleteSale,
    handleExportExcel,
    handleExportPDF,
    loading,
    metrics,
    openFilterPicker,
    openSaleSummary,
    pagination,
    q,
    selectedSale,
    setActiveFilterPickerField,
    setFilterPickerPage,
    setFilterPickerSearch,
    setPagination,
    setQ,
    setSorting,
    showFilters,
    sorting,
    toggleFilters,
  };
}
