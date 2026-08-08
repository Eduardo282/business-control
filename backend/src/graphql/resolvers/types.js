import { requireRoles } from "../../middlewares/role.middleware.js";
import { forbidden } from "../../errors/appErrors.js";
import { listContactsByClientAction } from "../../modules/contacts/contactActions.js";
import { getClientAction } from "../../modules/clients/clientActions.js";
import { listContactProductsAction } from "../../modules/contacts/contactActions.js";
import { getContactAction } from "../../modules/contacts/contactActions.js";
import { findUserWithRole } from "../../repositories/user.repository.js";
import { findProductByIdLean } from "../../repositories/product.repository.js";
import { getQuoteItemsAction } from "../../modules/quotes/quoteActions.js";
import { getQuoteAction } from "../../modules/quotes/quoteActions.js";
import { getSaleItemsAction } from "../../modules/sales/saleActions.js";

export const Client = {
  contacts: async (parent, _args, ctx) => {
    requireRoles(ctx.user, ["ADMIN", "VENTAS", "CONTACT_PORTAL"]);
    if (ctx.user.role === "CONTACT_PORTAL" && String(parent.id) !== String(ctx.user.clientId)) {
      throw forbidden();
    }
    return ctx.loaders?.contactsByClientId?.load(parent.id) || listContactsByClientAction(parent.id);
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
    return ctx.loaders?.activeServicesByContactId?.load(parent.id) || listContactProductsAction(parent.id);
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
    if (parent.client_id) {
      const c = await (ctx.loaders?.clientById?.load(parent.client_id) || getClientAction(parent.client_id));
      if (c) return c;
    }
    if (parent.client_name) {
      return { id: String(parent.client_id || "deleted"), business_name: parent.client_name };
    }
    return null;
  },
  contact: async (parent, _args, ctx) => {
    if (parent.contact_id) {
      const c = await (ctx.loaders?.contactById?.load(parent.contact_id) || getContactAction(parent.contact_id));
      if (c) return c;
    }
    if (parent.contact_name) {
      return {
        id: String(parent.contact_id || "deleted"),
        client_id: String(parent.client_id || "deleted"),
        full_name: parent.contact_name,
      };
    }
    return null;
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

export const Sale = {
  quote: async (parent, _args, ctx) => {
    if (!parent.quote_id) return null;
    return ctx.loaders?.quoteById?.load(parent.quote_id) || getQuoteAction(parent.quote_id);
  },
  client: async (parent, _args, ctx) => {
    if (parent.client_id) {
      const c = await (ctx.loaders?.clientById?.load(parent.client_id) || getClientAction(parent.client_id));
      if (c) return c;
    }
    if (parent.client_name) {
      return { id: String(parent.client_id || "deleted"), business_name: parent.client_name };
    }
    return null;
  },
  contact: async (parent, _args, ctx) => {
    if (parent.contact_id) {
      const c = await (ctx.loaders?.contactById?.load(parent.contact_id) || getContactAction(parent.contact_id));
      if (c) return c;
    }
    if (parent.contact_name) {
      return {
        id: String(parent.contact_id || "deleted"),
        client_id: String(parent.client_id || "deleted"),
        full_name: parent.contact_name,
      };
    }
    return null;
  },
  user: async (parent, _args, ctx) => {
    if (!parent.user_id) return null;
    return ctx.loaders?.userById?.load(parent.user_id) || findUserWithRole(parent.user_id);
  },
  items: async (parent, _args, ctx) => {
    return ctx.loaders?.saleItemsBySaleId?.load(parent.id) || getSaleItemsAction(parent.id);
  },
};

export const SaleItem = {
  product: async (parent, _args, ctx) => {
    return ctx.loaders?.productById?.load(parent.product_id) || findProductByIdLean(parent.product_id);
  },
};

export const Product = {
  client: async (parent, _args, ctx) => {
    if (!parent.client_id) return null;
    return ctx.loaders?.clientById?.load(parent.client_id) || getClientAction(parent.client_id);
  },
  category: (parent) => parent.category || "Sin Categoría",
};

export const FormDraft = {
  data_json: (parent) => {
    if (typeof parent.data_json === "string") return parent.data_json;
    return JSON.stringify(parent.data_json || {});
  },
};
