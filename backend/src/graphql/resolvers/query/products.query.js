import {
  listProductsAction,
  searchProductsAction,
} from "../../actions/product_actions/listProducts.action.js";
import { getProductAction } from "../../actions/product_actions/getProduct.action.js";
import { requireRoles } from "../../../middlewares/role.middleware.js";
import { unauthenticated, forbidden } from "../../../errors/appErrors.js";

export const products = async (_parent, { client_id, limit, offset }, ctx) => {
  if (!ctx.user) throw unauthenticated();
  if (ctx.user?.role === "CONTACT_PORTAL") {
    return listProductsAction({ client_id: ctx.user.clientId });
  }
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "SOPORTE"]);
  return listProductsAction({ client_id, limit, offset });
};

export const portalProducts = async (_parent, _args, ctx) => {
  // Only for portal contacts
  if (!ctx.user) throw unauthenticated();
  if (ctx.user.role !== "CONTACT_PORTAL") throw forbidden();
  // Reuse list, but schema filters fields
  return listProductsAction({ client_id: ctx.user.clientId });
};

export const product = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "SOPORTE"]);
  return getProductAction(id);
};

export const searchProducts = async (_parent, { q, client_id }, ctx) => {
  if (!ctx.user) throw unauthenticated();
  if (ctx.user?.role === "CONTACT_PORTAL") {
    return searchProductsAction(q, ctx.user.clientId);
  }
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "SOPORTE"]);
  return searchProductsAction(q, client_id);
};
