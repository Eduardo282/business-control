import ClientBulkModal from "./ClientBulkModal";
import ClientCreateModal from "./ClientCreateModal";
import ClientEditModal from "./ClientEditModal";
import ClientFilterPicker from "./ClientFilterPicker";
import ClientsDetailsBar from "./ClientsDetailsBar";
import ClientsPagination from "./ClientsPagination";
import ClientsTable from "./ClientsTable";
import ClientsToolbar from "./ClientsToolbar";

export default function ClientsView({
  controller,
  exportActions,
  tableState,
  userRole,
}) {
  const {
    activeFilterCount,
    activeFilterPickerConfig,
    activeFilterPickerField,
    applyFilterValue,
    clearFilters,
    clients,
    closeEditModal,
    detailColumns,
    dynamicColumns,
    editingClient,
    error,
    expandedRows,
    filterPickerPage,
    filterPickerSearch,
    filters,
    handleBulkSuccess,
    handleCreateSuccess,
    handleEditSuccess,
    loading,
    openBulkModal,
    primaryTableColumns,
    query,
    quickFilterButtons,
    rowDetailColumns,
    setActiveFilterPickerField,
    setFilterPickerPage,
    setFilterPickerSearch,
    setQuery,
    setShowBulkModal,
    setShowCreateModal,
    setShowFilters,
    showBulkModal,
    showCreateModal,
    showEditModal,
    showFilters,
    tableColumnsFromView,
    visibleFilterPickerOptions,
  } = controller;
  const { columns, isTableScrollable, table } = tableState;
  const canManageClients = userRole === "ADMIN" || userRole === "VENTAS";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            Clientes Registrados
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiones y permisos al portal del cliente
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="glass-panel bg-white dark:bg-dark-800 rounded-md border border-zinc-200 dark:border-dark-700 overflow-hidden">
        <ClientsToolbar
          activeFilterCount={activeFilterCount}
          canManageClients={canManageClients}
          clientCount={clients.length}
          onClearFilters={clearFilters}
          onExportExcel={exportActions.exportExcel}
          onExportPdf={exportActions.exportPdf}
          onOpenBulk={openBulkModal}
          onQueryChange={setQuery}
          onToggleFilters={() => setShowFilters((visible) => !visible)}
          pageCount={table.getPageCount()}
          pageIndex={table.getState().pagination.pageIndex}
          query={query}
          showFilters={showFilters}
        />

        <ClientsDetailsBar
          detailColumnCount={detailColumns.length}
          filters={filters}
          onClearSingleFilter={(fieldName) => applyFilterValue(fieldName, "")}
          onDownloadTemplate={exportActions.downloadTemplate}
          onOpenFilterPicker={setActiveFilterPickerField}
          quickFilterButtons={quickFilterButtons}
          showFilters={showFilters}
        />

        <ClientsTable
          columns={columns}
          expandedRows={expandedRows}
          getRowDetailColumns={rowDetailColumns}
          isTableScrollable={isTableScrollable}
          loading={loading}
          primaryTableColumns={primaryTableColumns}
          table={table}
        />

        <ClientsPagination clientCount={clients.length} table={table} />
      </div>

      <ClientCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        dynamicColumns={tableColumnsFromView}
      />

      <ClientEditModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        client={editingClient}
        onSuccess={handleEditSuccess}
        dynamicColumns={tableColumnsFromView}
      />

      <ClientBulkModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={handleBulkSuccess}
      />

      <ClientFilterPicker
        isOpen={!!activeFilterPickerField && showFilters}
        onClose={() => setActiveFilterPickerField(null)}
        fieldName={activeFilterPickerField}
        fieldConfig={activeFilterPickerConfig}
        filters={filters}
        options={visibleFilterPickerOptions}
        filterPickerSearch={filterPickerSearch}
        setFilterPickerSearch={setFilterPickerSearch}
        filterPickerPage={filterPickerPage}
        setFilterPickerPage={setFilterPickerPage}
        onApplyFilter={applyFilterValue}
      />
    </div>
  );
}
