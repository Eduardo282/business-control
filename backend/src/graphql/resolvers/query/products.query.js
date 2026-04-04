import {
  listProductsAction,
  searchProductsAction,
} from "../../actions/product_actions/listProducts.action.js";
import { getProductAction } from "../../actions/product_actions/getProduct.action.js";

export const products = async (_parent, { client_id }, ctx) => {
  if (ctx.user?.role === "CONTACT_PORTAL") {
    // Legacy support or if we decided to use same query
    return listProductsAction({ client_id: ctx.user.clientId });
  }
  return listProductsAction({ client_id });
};

export const portalProducts = async (_parent, _args, ctx) => {
  // Only for portal contacts
  if (ctx.user?.role !== "CONTACT_PORTAL") {
    throw new Error("Access denied");
  }
  // Reuse list, but schema filters fields
  return listProductsAction({ client_id: ctx.user.clientId });
};

export const product = async (_parent, { id }) => {
  return getProductAction(id);
};

export const searchProducts = async (_parent, { q, client_id }, ctx) => {
  if (ctx.user?.role === "CONTACT_PORTAL") {
    return searchProductsAction(q, ctx.user.clientId);
  }
  return searchProductsAction(q, client_id);
};
