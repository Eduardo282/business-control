import { requireRoles } from "../../middlewares/role.middleware.js";
import { forbidden } from "../../errors/appErrors.js";
import { listContactsByClientAction } from "../actions/contact_actions/listContactsByClient.action.js";
import { getClientAction } from "../actions/client_actions/getClient.action.js";
import { listContactProductsAction } from "../actions/contact_actions/listContactProducts.action.js";
import { getContactAction } from "../actions/contact_actions/getContact.action.js";
import { findUserWithRole } from "../../repositories/user.repository.js";
import { findProductByIdLean } from "../../repositories/product.repository.js";
import { getQuoteItemsAction } from "../actions/quote_actions/getQuoteItems.action.js";

export const Client = {
  contacts: async (parent, _args, ctx) => {
    requireRoles(ctx.user, ["ADMIN", "VENTAS", "CONTACT_PORTAL"]);
    if (ctx.user.role === "CONTACT_PORTAL" && String(parent.id) !== String(ctx.user.clientId)) {
      throw forbidden();
    }
    return listContactsByClientAction(parent.id);
  },
  address: (parent) => {
    const parts = [parent.ciudad, parent.codigo_postal].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  },
};

export const Contact = {
  active_services: async (parent, _args, ctx) => {
    // Permitir si es Admin/Ventas O si es el propio contacto
    if (ctx.user?.role === "CONTACT_PORTAL") {
      if (ctx.user.contactId != parent.id) {
        // Si soy un contacto, solo puedo ver MIS servicios
        return [];
      }
    } else {
      // Los admins pueden ver los servicios de todos
      requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
    }
    return listContactProductsAction(parent.id);
  },
};

export const ContactProduct = {
  product: (parent) => parent.product,
  contact: async (parent, _args, ctx) => {
    if (parent.contact) return parent.contact;
    if (!parent.contact_id) return null;
    return ctx.loaders?.contactById?.load(parent.contact_id) || getContactAction(parent.contact_id);
  },
  client: async (parent, _args, ctx) => {
    if (parent.client) return parent.client;
    if (parent.client_id) {
      return ctx.loaders?.clientById?.load(parent.client_id) || getClientAction(parent.client_id);
    }
    if (!parent.contact_id) return null;
    const c = await (ctx.loaders?.contactById?.load(parent.contact_id) || getContactAction(parent.contact_id));
    if (!c) return null;
    return ctx.loaders?.clientById?.load(c.client_id) || getClientAction(c.client_id);
  },
};

export const Quote = {
  client: async (parent, _args, ctx) => {
    return ctx.loaders?.clientById?.load(parent.client_id) || getClientAction(parent.client_id);
  },
  contact: async (parent, _args, ctx) => {
    if (!parent.contact_id) return null;
    return ctx.loaders?.contactById?.load(parent.contact_id) || getContactAction(parent.contact_id);
  },
  user: async (parent, _args, ctx) => {
    return ctx.loaders?.userById?.load(parent.user_id) || findUserWithRole(parent.user_id);
  },
  items: async (parent, _args, ctx) => {
    return ctx.loaders?.quoteItemsByQuoteId?.load(parent.id) || getQuoteItemsAction(parent.id);
  },
};

export const QuoteItem = {
  product: async (parent, _args, ctx) => {
    return ctx.loaders?.productById?.load(parent.product_id) || findProductByIdLean(parent.product_id);
  },
};

export const Product = {
  client: async (parent, _args, ctx) => {
    if (!parent.client_id) return null;
    return ctx.loaders?.clientById?.load(parent.client_id) || getClientAction(parent.client_id);
  },
};

export const FormDraft = {
  data_json: (parent) => {
    if (typeof parent.data_json === "string") return parent.data_json;
    return JSON.stringify(parent.data_json || {});
  },
};
