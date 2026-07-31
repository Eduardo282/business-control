import React, { memo } from "react";
import { useAuth } from "../../hooks/useAuth";
import ProductDetailView from "./product-detail/ProductDetailView";
import useProductDetailController from "./product-detail/useProductDetailController";

function ProductDetail() {
  const { user } = useAuth();
  const controller = useProductDetailController();

  return (
    <ProductDetailView
      controller={controller}
      userRole={user?.role?.name}
    />
  );
}

export default memo(ProductDetail);
