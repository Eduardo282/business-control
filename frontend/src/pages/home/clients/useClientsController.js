import { useCallback, useEffect, useMemo, useState } from "react";

import {
  deleteClientApi,
  listClientsDynamicApi,
} from "../../../actionsAPI/clients.api";
import { notificationService } from "../../../services/notificationService";
import {
  DEFAULT_VISIBLE_CLIENT_COLUMNS,
  EXCEL_VIEW_STORAGE_KEY,
} from "./clientConstants";
import {
  filterClients,
  filterPickerOptions,
  getDetailColumns,
  getFilterableColumns,
  getFilterPickerOptions,
  getFixedMainColumnNames,
  getPrimaryTableColumns,
  getQuickFilterButtons,
  getRowDetailColumns,
  getTableColumnsFromView,
  sortClientRowsForExcelView,
} from "./clientTableHelpers";

export default function useClientsController() {
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [dynamicColumns, setDynamicColumns] = useState([]);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [columnLabelOverrides, setColumnLabelOverrides] = useState({});
  const [excelViewColumns, setExcelViewColumns] = useState(null);
  const [activeFilterPickerField, setActiveFilterPickerField] = useState(null);
  const [filterPickerSearch, setFilterPickerSearch] = useState("");
  const [filterPickerPage, setFilterPickerPage] = useState(0);

  const filterableColumns = useMemo(
    () => getFilterableColumns(dynamicColumns),
    [dynamicColumns],
  );

  const quickFilterButtons = useMemo(
    () => getQuickFilterButtons(filterableColumns, columnLabelOverrides),
    [filterableColumns, columnLabelOverrides],
  );

  const activeFilterPickerConfig = useMemo(
    () =>
      quickFilterButtons.find(
        (button) => button.fieldName === activeFilterPickerField,
      ) || null,
    [quickFilterButtons, activeFilterPickerField],
  );

  const availableFilterPickerOptions = useMemo(
    () => getFilterPickerOptions(allClients, activeFilterPickerField),
    [allClients, activeFilterPickerField],
  );

  const visibleFilterPickerOptions = useMemo(
    () =>
      filterPickerOptions(availableFilterPickerOptions, filterPickerSearch),
    [availableFilterPickerOptions, filterPickerSearch],
  );

  const fixedMainColumnNames = useMemo(
    () => getFixedMainColumnNames(excelViewColumns),
    [excelViewColumns],
  );

  const tableColumnsFromView = useMemo(
    () =>
      getTableColumnsFromView({
        filterableColumns,
        excelViewColumns,
        columnLabelOverrides,
        fixedMainColumnNames,
      }),
    [
      filterableColumns,
      excelViewColumns,
      columnLabelOverrides,
      fixedMainColumnNames,
    ],
  );

  const primaryTableColumns = useMemo(
    () =>
      getPrimaryTableColumns(tableColumnsFromView, fixedMainColumnNames),
    [tableColumnsFromView, fixedMainColumnNames],
  );

  const detailColumns = useMemo(
    () => getDetailColumns(tableColumnsFromView, primaryTableColumns),
    [tableColumnsFromView, primaryTableColumns],
  );

  const tableData = useMemo(
    () => sortClientRowsForExcelView(clients, excelViewColumns),
    [clients, excelViewColumns],
  );

  const loadClients = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const data = await listClientsDynamicApi();
      const nextColumns = data.columns || [];
      const nextRows = data.rows || [];

      setDynamicColumns(nextColumns);
      setClients(nextRows);
      setAllClients(nextRows);

      const hasSavedViewConfig = !!localStorage.getItem(
        EXCEL_VIEW_STORAGE_KEY,
      );
      if (
        !hasSavedViewConfig &&
        Array.isArray(data.viewColumns) &&
        data.viewColumns.length
      ) {
        setExcelViewColumns(data.viewColumns);
      }
    } catch (loadError) {
      setError(loadError.message || "Error cargando clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(EXCEL_VIEW_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (parsed?.columnLabelOverrides) {
        setColumnLabelOverrides(parsed.columnLabelOverrides);
      }
      if (Array.isArray(parsed?.excelViewColumns)) {
        setExcelViewColumns(parsed.excelViewColumns);
      }
    } catch {
      localStorage.removeItem(EXCEL_VIEW_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (!showFilters) {
      setActiveFilterPickerField(null);
      setFilterPickerSearch("");
    }
  }, [showFilters]);

  useEffect(() => {
    const searchableColumns = filterableColumns.length
      ? filterableColumns
      : tableColumnsFromView;

    setClients(
      filterClients({
        allClients,
        query,
        filters,
        searchableColumns,
      }),
    );
    // Filtering intentionally follows query, field filters, and loaded rows only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters, allClients]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setFilters({});
    setActiveFilterPickerField(null);
    setFilterPickerSearch("");
  }, []);

  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const openBulkModal = useCallback(() => {
    setShowBulkModal(true);
  }, []);

  const removeClient = useCallback(
    async (id) => {
      const isConfirmed = await notificationService.confirm({
        title: "¿Estás seguro?",
        text: "Se eliminará el cliente y se desactivarán sus contactos. Las cotizaciones y ventas se conservarán.",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (!isConfirmed) return;

      try {
        await deleteClientApi(id);
        await loadClients();
        notificationService.toast({
          title: "El cliente ha sido eliminado",
          icon: "success",
        });
      } catch (removeError) {
        notificationService.error(
          "Error",
          removeError.message || "Error eliminando cliente",
        );
      }
    },
    [loadClients],
  );

  const openEditModal = useCallback((client) => {
    setEditingClient(client);
    setShowEditModal(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingClient(null);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setShowCreateModal(false);
    loadClients();
  }, [loadClients]);

  const handleEditSuccess = useCallback(() => {
    closeEditModal();
    loadClients();
  }, [closeEditModal, loadClients]);

  const handleBulkSuccess = useCallback(
    (data) => {
      if (data.type === "drive" && data.report) {
        const report = data.report;
        const mappedHeadersByColumn = report.mappedHeadersByColumn || {};
        const preferredViewColumns =
          Array.isArray(report.preferredViewColumns) &&
          report.preferredViewColumns.length
            ? report.preferredViewColumns
            : Object.keys(mappedHeadersByColumn);

        if (preferredViewColumns.length) {
          setExcelViewColumns(preferredViewColumns);
          setColumnLabelOverrides((previousOverrides) => {
            const nextOverrides = {
              ...previousOverrides,
              ...mappedHeadersByColumn,
            };

            localStorage.setItem(
              EXCEL_VIEW_STORAGE_KEY,
              JSON.stringify({
                columnLabelOverrides: nextOverrides,
                excelViewColumns: preferredViewColumns,
              }),
            );

            return nextOverrides;
          });
        }
      }

      loadClients();
    },
    [loadClients],
  );

  const applyFilterValue = useCallback((field, value) => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      [field]: value,
    }));
  }, []);

  const rowDetailColumns = useCallback(
    (row) => getRowDetailColumns(row, detailColumns),
    [detailColumns],
  );

  const toggleExpandedRow = useCallback((clientId) => {
    setExpandedRows((previousRows) => ({
      ...previousRows,
      [clientId]: !previousRows[clientId],
    }));
  }, []);

  const activeFilterCount =
    Object.values(filters).filter(
      (value) => String(value || "").trim() !== "",
    ).length + (query.trim() ? 1 : 0);

  return {
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
    loadClients,
    loading,
    openBulkModal,
    openCreateModal,
    openEditModal,
    primaryTableColumns,
    query,
    quickFilterButtons,
    removeClient,
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
    tableData,
    toggleExpandedRow,
    visibleFilterPickerOptions,
  };
}
