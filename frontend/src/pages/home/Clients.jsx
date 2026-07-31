import { memo } from "react";

import { useAuth } from "../../hooks/useAuth";
import ClientsView from "./clients/ClientsView";
import useClientExports from "./clients/useClientExports";
import useClientsController from "./clients/useClientsController";
import useClientsTable from "./clients/useClientsTable";

function Clients() {
  const { user } = useAuth();
  const controller = useClientsController();
  const userRole = user?.role?.name;
  const tableState = useClientsTable({
    tableData: controller.tableData,
    tableColumnsFromView: controller.tableColumnsFromView,
    primaryTableColumns: controller.primaryTableColumns,
    userRole,
    getRowDetailColumns: controller.rowDetailColumns,
    expandedRows: controller.expandedRows,
    onToggleExpanded: controller.toggleExpandedRow,
    onCreate: controller.openCreateModal,
    onEdit: controller.openEditModal,
    onRemove: controller.removeClient,
  });
  const exportActions = useClientExports(tableState.getExportContext);

  return (
    <ClientsView
      controller={controller}
      exportActions={exportActions}
      tableState={tableState}
      userRole={userRole}
    />
  );
}

export default memo(Clients);
