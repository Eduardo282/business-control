import { requireRoles } from "../../../middlewares/role.middleware.js";
import { createContactAction } from "../../../modules/contacts/contactActions.js";
import { bulkCreateContactsAction } from "../../../modules/contacts/contactActions.js";
import { updateContactAction } from "../../../modules/contacts/contactActions.js";
import { deleteContactAction } from "../../../modules/contacts/contactActions.js";
import { createContactProductAction } from "../../../modules/contacts/contactActions.js";
import { deleteContactProductAction } from "../../../modules/contacts/contactActions.js";
import { deletePortalContactProductAction } from "../../../modules/contacts/contactActions.js";
import { updateContactProductDatesAction } from "../../../modules/policies/policyActions.js";
import { unauthenticated, forbidden } from "../../../errors/appErrors.js";

export const createContact = async (_parent, { input }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return createContactAction(input);
};

export const bulkCreateContacts = async (_parent, { inputs }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return bulkCreateContactsAction(inputs);
};

export const updateContact = async (_parent, { id, input }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return updateContactAction(id, input);
};

export const deleteContact = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return deleteContactAction(id);
};

export const createContactProduct = async (_parent, { input }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return createContactProductAction(input);
};

export const deleteContactProduct = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN"]);
  return deleteContactProductAction(id);
};

export const deletePortalContactProduct = async (_parent, { id }, ctx) => {
  if (!ctx.user) throw unauthenticated();
  if (ctx.user.role !== "CONTACT_PORTAL") throw forbidden();
  return deletePortalContactProductAction(id, ctx.user);
};

export const updateContactProductDates = async (_parent, { id, start_date, expiration_date, status, license_key }, ctx) => {
  requireRoles(ctx.user, ["ADMIN"]);
  return updateContactProductDatesAction(id, { start_date, expiration_date, status, license_key });
};
