import { forbidden, notFound } from "../../../errors/appErrors.js";
import { requireRoles } from "../../../middlewares/role.middleware.js";
import { getSaleAction } from "../../../modules/sales/saleActions.js";
import { listPortalSalesAction, listSalesAction, listSalesByUserAction } from "../../../modules/sales/saleActions.js";
import { canContactAccessSale } from "../../policies/saleAccess.policy.js";

export const sales = async (_parent, { limit, offset }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "CONTACT_PORTAL"]);
  if (ctx.user.role === "CONTACT_PORTAL") {
    return listPortalSalesAction(ctx.user.contactId);
  }
  if (ctx.user.role === "VENTAS") {
    return listSalesByUserAction(ctx.user.userId || ctx.user.id);
  }
  return listSalesAction({ limit, offset });
};

export const sale = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "CONTACT_PORTAL"]);
  const found = await getSaleAction(id);
  if (!found) throw notFound("Venta no encontrada");

  if (ctx.user.role === "CONTACT_PORTAL" && !canContactAccessSale(found, ctx.user.contactId)) {
    throw forbidden();
  }

  return found;
};
