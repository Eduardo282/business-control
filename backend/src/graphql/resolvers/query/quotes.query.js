import { requireRoles } from "../../../middlewares/role.middleware.js";
import {
  listQuotesAction,
  listQuotesByClientAction,
  listQuotesByUserAction,
} from "../../actions/quote_actions/listQuotes.action.js";
import { listPortalQuotesAction } from "../../actions/quote_actions/listPortalQuotes.action.js";
import { getQuoteAction } from "../../actions/quote_actions/getQuote.action.js";
import { getUnreadQuoteRequestsAction } from "../../actions/quote_actions/getUnreadQuoteRequests.action.js";
import { getPendingQuoteRequestsCountAction } from "../../actions/quote_actions/getPendingQuoteRequestsCount.action.js";
import { pool } from "../../../config/db.js";

export const quotes = async (_parent, _args, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "CONTACT_PORTAL"]);
  if (ctx.user.role === "VENTAS") {
    return listQuotesByUserAction(ctx.user.userId || ctx.user.id);
  }
  if (ctx.user.role === "CONTACT_PORTAL") {
    return listPortalQuotesAction(ctx.user.clientId);
  }
  return listQuotesAction();
};

export const quote = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "CONTACT_PORTAL"]);
  const found = await getQuoteAction(id);
  if (!found) throw new Error("Cotización no encontrada");

  if (ctx.user.role === "CONTACT_PORTAL" && String(found.client_id) !== String(ctx.user.clientId)) {
    throw new Error("No autorizado");
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
