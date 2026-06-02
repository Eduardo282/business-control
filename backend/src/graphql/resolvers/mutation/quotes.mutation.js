import { requireRoles } from "../../../middlewares/role.middleware.js";
import { unauthenticated, forbidden } from "../../../errors/appErrors.js";
import { createQuoteAction } from "../../actions/quote_actions/createQuote.action.js";
import { deleteQuoteAction } from "../../actions/quote_actions/deleteQuote.action.js";
import { sendQuoteEmailAction } from "../../actions/quote_actions/sendQuoteEmail.action.js";
import { toggleQuotePortalAction } from "../../actions/quote_actions/toggleQuotePortal.action.js";
import { requestQuoteAction } from "../../actions/quote_actions/requestQuote.action.js";
import { markQuoteNotificationReadAction } from "../../actions/quote_actions/markQuoteNotificationRead.action.js";
import { resolveQuoteRequestAction } from "../../actions/quote_actions/resolveQuoteRequest.action.js";
import { deletePortalQuoteAction } from "../../actions/quote_actions/deletePortalQuote.action.js";
import { updatePortalQuoteRequestAction } from "../../actions/quote_actions/updatePortalQuoteRequest.action.js";
import { rejectPortalQuoteAction } from "../../actions/quote_actions/rejectPortalQuote.action.js";
import { rejectQuoteAction } from "../../actions/quote_actions/rejectQuote.action.js";
import { updateQuoteStatusAction } from "../../actions/quote_actions/updateQuoteStatus.action.js";

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
  { quote_id, contact_email, message, pdf_base64 },
  ctx,
) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return sendQuoteEmailAction({
    quote_id,
    contact_email,
    message,
    pdf_base64,
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
