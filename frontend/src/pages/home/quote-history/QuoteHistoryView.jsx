import React from "react";
import ClientFilterPicker from "../clients/ClientFilterPicker";
import { QuoteHistoryTable } from "./QuoteHistoryTable";
import { QuoteHistoryToolbar } from "./QuoteHistoryToolbar";

export default function QuoteHistoryView({ controller, tableState }) {
  const {
    activeFilterCount,
    activeFilterPickerField,
    applyFilterValue,
    clearFilters,
    clearSingleFilter,
    closeFilterPicker,
    error,
    filteredQuotes,
    filterPickerSearch,
    filters,
    handleExportExcel,
    handleExportPDF,
    loading,
    openFilterPicker,
    q,
    quotes,
    showFilters,
    visibleFilterPickerOptions,
  } = controller;

  const filterFieldLabels = {
    client: "Cliente",
    status: "Estado",
    folio: "Folio",
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <QuoteHistoryToolbar
        activeFilterCount={activeFilterCount}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPDF}
        onQueryChange={(query) => controller.dispatchFilter({ type: "SET_Q", payload: query })}
        onToggleFilters={() => controller.dispatchFilter({ type: "TOGGLE_FILTERS" })}
        query={q}
        showFilters={showFilters}
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <QuoteHistoryTable
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        filters={filters}
        loading={loading}
        onClearSingleFilter={clearSingleFilter}
        onOpenFilterPicker={openFilterPicker}
        quotes={quotes}
        showFilters={showFilters}
        tableState={tableState}
      />

      {activeFilterPickerField && showFilters && (
        <ClientFilterPicker
          isOpen={!!activeFilterPickerField && showFilters}
          onClose={closeFilterPicker}
          fieldName={activeFilterPickerField}
          fieldConfig={{
            fieldName: activeFilterPickerField,
            buttonLabel: filterFieldLabels[activeFilterPickerField] || activeFilterPickerField,
          }}
          filters={filters}
          options={visibleFilterPickerOptions}
          filterPickerSearch={filterPickerSearch}
          setFilterPickerSearch={(search) =>
            controller.dispatchFilter({ type: "SET_FILTER_PICKER_SEARCH", payload: search })
          }
          filterPickerPage={0}
          setFilterPickerPage={() => {}}
          onApplyFilter={(fieldName, value) => applyFilterValue(value)}
        />
      )}
    </div>
  );
}
