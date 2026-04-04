import { requireRoles } from "../../../middlewares/role.middleware.js";
import { createProductAction } from "../../actions/product_actions/createProduct.action.js";
import { updateProductAction } from "../../actions/product_actions/updateProduct.action.js";
import { deleteProductAction } from "../../actions/product_actions/deleteProduct.action.js";
import { updateProductPriceAction } from "../../actions/product_actions/updateProductPrice.action.js";
import { clearProductPriceHistoryAction } from "../../actions/product_actions/clearProductPriceHistory.action.js";

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
