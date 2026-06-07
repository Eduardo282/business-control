import { requireRoles } from "../../../middlewares/role.middleware.js";
import { forbidden, notFound } from "../../../errors/appErrors.js";
import {
  listQuotesAction,
  listQuotesByClientAction,
  listQuotesByUserAction,
} from "../../actions/quote_actions/listQuotes.action.js";
import { listPortalQuotesAction } from "../../actions/quote_actions/listPortalQuotes.action.js";
import { getQuoteAction } from "../../actions/quote_actions/getQuote.action.js";
import { getUnreadQuoteRequestsAction } from "../../actions/quote_actions/getUnreadQuoteRequests.action.js";
import { getPendingQuoteRequestsCountAction } from "../../actions/quote_actions/getPendingQuoteRequestsCount.action.js";

export const quotes = async (_parent, { limit, offset }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "CONTACT_PORTAL"]);
  if (ctx.user.role === "VENTAS") {
    return listQuotesByUserAction(ctx.user.userId || ctx.user.id);
  }
  if (ctx.user.role === "CONTACT_PORTAL") {
    return listPortalQuotesAction(ctx.user.contactId);
  }
  return listQuotesAction({ limit, offset });
};

export const quote = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "CONTACT_PORTAL"]);
  const found = await getQuoteAction(id);
  if (!found) throw notFound("Cotización no encontrada");

  if (ctx.user.role === "CONTACT_PORTAL") {
    const canAccessPortalQuote =
      String(found.contact_id) === String(ctx.user.contactId) &&
      Boolean(found.is_registered) &&
      Boolean(found.is_sent_to_client_portal) &&
      !found.is_deleted_portal;

    if (!canAccessPortalQuote) {
      throw forbidden();
    }
  }

  return found;
};

export const quotesByClient = async (_parent, { client_id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return listQuotesByClientAction(client_id);
};

export const pendingQuoteRequestsCount = async (_parent, _args, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return getPendingQuoteRequestsCountAction();
};

export const unreadQuoteRequests = async (_parent, _args, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return getUnreadQuoteRequestsAction();
};
