import { memo } from "react";
import { useAuth } from "../../hooks/useAuth";
import ProductsView from "./products/ProductsView";
import useProductExports from "./products/useProductExports";
import useProductsController from "./products/useProductsController";
import useProductsTable from "./products/useProductsTable";

export { FolioSelectionModal } from "./products/FolioSelectionModal";
export {
  buildProductsPdfTableData,
  groupProductsByName,
} from "./products/productHelpers";

function Products({ categoryFilter }) {
  const { user } = useAuth();
  const controller = useProductsController({ categoryFilter });
  const tableState = useProductsTable({
    filteredProducts: controller.filteredProducts,
    user,
    onOpenFolioGroup: controller.setActiveFolioGroup,
    onRemove: controller.remove,
  });
  const exportActions = useProductExports(controller.filteredProducts);

  return (
    <ProductsView
      categoryFilter={categoryFilter}
      controller={controller}
      exportActions={exportActions}
      tableState={tableState}
    />
  );
}

export default memo(Products);
