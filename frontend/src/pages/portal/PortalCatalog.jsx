import React, { memo } from "react";
import PortalCatalogView from "./catalog/PortalCatalogView";
import usePortalCatalogController from "./catalog/usePortalCatalogController";
import usePortalCatalogTable from "./catalog/usePortalCatalogTable";

function PortalCatalog() {
  const controller = usePortalCatalogController();
  const tableState = usePortalCatalogTable({
    tableData: controller.tableData,
    globalFilter: controller.globalFilter,
    setGlobalFilter: controller.setGlobalFilter,
    getQuantity: controller.getQuantity,
    updateCart: controller.updateCart,
    setSelectedProduct: controller.setSelectedProduct,
    setActiveFolioGroup: controller.setActiveFolioGroup,
    cart: controller.cart,
    activeFolioGroup: controller.activeFolioGroup,
  });

  return (
    <PortalCatalogView
      controller={controller}
      tableState={tableState}
    />
  );
}

export default memo(PortalCatalog);
