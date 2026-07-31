import { requireRoles } from "../../../middlewares/role.middleware.js";
import { createProductAction } from "../../../modules/products/productActions.js";
import { updateProductAction } from "../../../modules/products/productActions.js";
import { deleteProductAction } from "../../../modules/products/productActions.js";
import { updateProductPriceAction } from "../../../modules/products/productActions.js";
import { clearProductPriceHistoryAction } from "../../../modules/products/productActions.js";

export const createProduct = async (_parent, { input }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return createProductAction(input);
};

export const updateProduct = async (_parent, { id, input }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return updateProductAction(id, input);
};

export const deleteProduct = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN"]);
  return deleteProductAction(id);
};

export const updateProductPrice = async (_parent, { id, price }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return updateProductPriceAction(id, price);
};

export const clearProductPriceHistory = async (_parent, { product_id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return clearProductPriceHistoryAction(product_id);
};
