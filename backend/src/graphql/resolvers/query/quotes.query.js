import { requireRoles } from "../../../middlewares/role.middleware.js";
import { forbidden, notFound } from "../../../errors/appErrors.js";
import { listQuotesAction, listQuotesByClientAction, listQuotesByUserAction } from "../../../modules/quotes/quoteActions.js";
import { listPortalQuotesAction } from "../../../modules/quotes/quoteActions.js";
import { getQuoteAction } from "../../../modules/quotes/quoteActions.js";
import { getUnreadQuoteRequestsAction } from "../../../modules/quotes/quoteActions.js";
import { getPendingQuoteRequestsCountAction } from "../../../modules/quotes/quoteActions.js";
import { generateQuotePdfAction } from "../../../modules/quotes/quoteActions.js";
import { canContactAccessQuote } from "../../policies/quoteAccess.policy.js";

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
    if (!canContactAccessQuote(found, ctx.user.contactId)) {
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

export const generateQuotePdf = async (_parent, { quote_id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "CONTACT_PORTAL"]);

  if (ctx.user.role === "CONTACT_PORTAL") {
    const found = await getQuoteAction(quote_id);
    if (!found) throw notFound("Cotización no encontrada");
    if (!canContactAccessQuote(found, ctx.user.contactId)) {
      throw forbidden();
    }
  }

  return generateQuotePdfAction({ quote_id });
};
