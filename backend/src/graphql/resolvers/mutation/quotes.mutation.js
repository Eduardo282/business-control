import { requireRoles } from "../../../middlewares/role.middleware.js";
import { unauthenticated, forbidden } from "../../../errors/appErrors.js";
import { createQuoteAction } from "../../../modules/quotes/createQuote.js";
import { deleteQuoteAction } from "../../../modules/quotes/quoteActions.js";
import { sendQuoteEmailAction } from "../../../modules/quotes/quoteActions.js";
import { toggleQuotePortalAction } from "../../../modules/quotes/quoteActions.js";
import { requestQuoteAction } from "../../../modules/quotes/quoteActions.js";
import { markQuoteNotificationReadAction } from "../../../modules/quotes/quoteActions.js";
import { dismissQuoteNotificationAction } from "../../../modules/quotes/quoteActions.js";
import { dismissAllQuoteNotificationsAction } from "../../../modules/quotes/quoteActions.js";
import { resolveQuoteRequestAction } from "../../../modules/quotes/quoteActions.js";
import { deletePortalQuoteAction } from "../../../modules/quotes/quoteActions.js";
import { updatePortalQuoteRequestAction } from "../../../modules/quotes/quoteActions.js";
import { acceptPortalQuoteAction } from "../../../modules/quotes/quoteActions.js";
import { rejectPortalQuoteAction } from "../../../modules/quotes/quoteActions.js";
import { rejectQuoteAction } from "../../../modules/quotes/quoteActions.js";
import { updateQuoteStatusAction } from "../../../modules/quotes/quoteActions.js";
import { registerQuoteAction } from "../../../modules/quotes/quoteActions.js";

export const createQuote = async (_parent, { input }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return createQuoteAction(input, ctx.user);
};

export const requestQuote = async (_parent, { input }, ctx) => {
  if (!ctx.user) throw unauthenticated();
  if (ctx.user.role !== "CONTACT_PORTAL") throw forbidden();
  return requestQuoteAction(input, ctx.user);
};

export const deleteQuote = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]); // Solo admin o ventas pueden borrar
  return deleteQuoteAction(id);
};

export const sendQuoteEmail = async (
  _parent,
  { quote_id, contact_email, message },
  ctx,
) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return sendQuoteEmailAction({
    quote_id,
    contact_email,
    message,
  });
};


export const toggleQuotePortal = async (
  _parent,
  { id, access, contact_id },
  ctx,
) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return toggleQuotePortalAction(id, access, contact_id);
};

export const markQuoteNotificationRead = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return markQuoteNotificationReadAction(id);
};

export const dismissQuoteNotification = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return dismissQuoteNotificationAction(id);
};

export const dismissAllQuoteNotifications = async (_parent, _args, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return dismissAllQuoteNotificationsAction();
};

export const resolveQuoteRequest = async (
  _parent,
  { requestId, input },
  ctx,
) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return resolveQuoteRequestAction(requestId, input, ctx.user);
};

export const deletePortalQuote = async (_parent, { id }, ctx) => {
  if (!ctx.user) throw unauthenticated();
  if (ctx.user.role !== "CONTACT_PORTAL") throw forbidden();
  return deletePortalQuoteAction(id, ctx.user);
};

export const updatePortalQuoteRequest = async (_parent, { id, input }, ctx) => {
  if (!ctx.user) throw unauthenticated();
  if (ctx.user.role !== "CONTACT_PORTAL") throw forbidden();
  return updatePortalQuoteRequestAction(id, input, ctx.user);
};

export const acceptPortalQuote = async (_parent, { id }, ctx) => {
  if (!ctx.user) throw unauthenticated();
  if (ctx.user.role !== "CONTACT_PORTAL") throw forbidden();
  return acceptPortalQuoteAction(id, ctx.user);
};

export const rejectPortalQuote = async (_parent, { id }, ctx) => {
  if (!ctx.user) throw unauthenticated();
  if (ctx.user.role !== "CONTACT_PORTAL") throw forbidden();
  return rejectPortalQuoteAction(id, ctx.user);
};

export const rejectQuote = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return rejectQuoteAction(id);
};

export const updateQuoteStatus = async (_parent, { id, status }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return updateQuoteStatusAction(id, status);
};

export const registerQuote = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return registerQuoteAction(id);
};
