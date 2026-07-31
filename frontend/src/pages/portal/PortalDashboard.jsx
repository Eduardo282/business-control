import React, { memo } from "react";
import PortalDashboardView from "./dashboard/PortalDashboardView";
import usePortalDashboardController from "./dashboard/usePortalDashboardController";

function PortalDashboard() {
  const controller = usePortalDashboardController();

  return <PortalDashboardView controller={controller} />;
}

export default memo(PortalDashboard);
