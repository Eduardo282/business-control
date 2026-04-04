import { requireRoles } from "../../../middlewares/role.middleware.js";
import { createContactAction } from "../../actions/contact_actions/createContact.action.js";
import { bulkCreateContactsAction } from "../../actions/contact_actions/bulkCreateContacts.action.js";
import { updateContactAction } from "../../actions/contact_actions/updateContact.action.js";
import { deleteContactAction } from "../../actions/contact_actions/deleteContact.action.js";
import { createContactProductAction } from "../../actions/contact_actions/createContactProduct.action.js";
import { deleteContactProductAction } from "../../actions/contact_actions/deleteContactProduct.action.js";

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
