import { unauthenticated, forbidden } from "../../../errors/appErrors.js";
import { requireRoles } from "../../../middlewares/role.middleware.js";
import { createSaleFromQuoteAction } from "../../../modules/sales/saleActions.js";
import { deletePortalSaleAction, deleteSaleAction } from "../../../modules/sales/saleActions.js";
import { sendSaleEmailAction } from "../../../modules/sales/saleActions.js";
import { toggleSalePortalAction } from "../../../modules/sales/saleActions.js";

export const createSaleFromQuote = async (_parent, { input }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return createSaleFromQuoteAction(input, ctx.user);
};

export const sendSaleEmail = async (
  _parent,
  { sale_id, contact_email, message },
  ctx,
) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return sendSaleEmailAction({ sale_id, contact_email, message });
};

export const toggleSalePortal = async (
  _parent,
  { id, access, contact_id },
  ctx,
) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return toggleSalePortalAction(id, access, contact_id);
};

export const deleteSale = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return deleteSaleAction(id);
};

export const deletePortalSale = async (_parent, { id }, ctx) => {
  if (!ctx.user) throw unauthenticated();
  if (ctx.user.role !== "CONTACT_PORTAL") throw forbidden();
  return deletePortalSaleAction({
    id,
    contactId: ctx.user.contactId,
  });
};
