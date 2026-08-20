import React from "react";
import ClientFilterPicker from "../clients/ClientFilterPicker";
import { FolioSelectionModal } from "./FolioSelectionModal";
import { ProductsTable } from "./ProductsTable";
import { ProductsToolbar } from "./ProductsToolbar";

export default function ProductsView({
  categoryFilter,
  controller,
  exportActions,
  tableState,
}) {
  const {
    activeFilterCount,
    activeFilterPickerConfig,
    activeFilterPickerField,
    activeFolioGroup,
    applyFilterValue,
    clearFilters,
    error,
    filteredProducts,
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
    setActiveFilterPickerField,
    setActiveFolioGroup,
    setFilterPickerPage,
    setFilterPickerSearch,
    setFilterPriceMax,
    setFilterPriceMin,
    setFilterType,
    setFilterUsers,
    setQ,
    setShowFilters,
    showFilters,
  } = controller;

  const { isTableScrollable } = tableState;

  return (
    <div className="space-y-5 pb-20">
      {/* Toolbar / Header */}
      <ProductsToolbar
        activeFilterCount={activeFilterCount}
        categoryFilter={categoryFilter}
        onExportExcel={exportActions.handleExportExcel}
        onExportPdf={exportActions.handleExportPDF}
        onQueryChange={setQ}
        onToggleFilters={() => setShowFilters((v) => !v)}
        query={q}
        showFilters={showFilters}
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Main Table */}
      <ProductsTable
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        filteredProductsCount={filteredProducts.length}
        filterPriceMax={filterPriceMax}
        filterPriceMin={filterPriceMin}
        filterType={filterType}
        filterUsers={filterUsers}
        isTableScrollable={isTableScrollable}
        loading={loading}
        onClearSingleFilter={(fieldId) => applyFilterValue(fieldId, "")}
        onOpenFilterPicker={(fieldId) => {
          setActiveFilterPickerField(fieldId);
          setFilterPickerSearch("");
          setFilterPickerPage(0);
        }}
        productFilters={productFilters}
        quickFilterButtons={quickFilterButtons}
        setFilterPriceMax={setFilterPriceMax}
        setFilterPriceMin={setFilterPriceMin}
        setFilterType={setFilterType}
        setFilterUsers={setFilterUsers}
        showFilters={showFilters}
        tableState={tableState}
      />

      {/* Quick Filter Picker Modal */}
      <ClientFilterPicker
        isOpen={!!activeFilterPickerField && showFilters}
        onClose={() => setActiveFilterPickerField(null)}
        fieldName={activeFilterPickerField}
        fieldConfig={activeFilterPickerConfig}
        filters={productFilters}
        options={filterPickerOptions}
        filterPickerSearch={filterPickerSearch}
        setFilterPickerSearch={setFilterPickerSearch}
        filterPickerPage={filterPickerPage}
        setFilterPickerPage={setFilterPickerPage}
        onApplyFilter={applyFilterValue}
      />

      {/* Folio Selection Modal */}
      <FolioSelectionModal
        group={activeFolioGroup}
        onClose={() => setActiveFolioGroup(null)}
        onSelect={handleSelectGroupProduct}
      />
    </div>
  );
}
