import React, { memo } from "react";
import AcceptedSalesView from "./accepted-sales/AcceptedSalesView";
import useAcceptedSalesController from "./accepted-sales/useAcceptedSalesController";

function AcceptedSales() {
  const controller = useAcceptedSalesController();

  return <AcceptedSalesView controller={controller} />;
}

export default memo(AcceptedSales);
