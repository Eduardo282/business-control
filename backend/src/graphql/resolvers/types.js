import { requireRoles } from "../../middlewares/role.middleware.js";
import { listContactsByClientAction } from "../actions/contact_actions/listContactsByClient.action.js";
import { getClientAction } from "../actions/client_actions/getClient.action.js";
import { listContactProductsAction } from "../actions/contact_actions/listContactProducts.action.js";
import { getContactAction } from "../actions/contact_actions/getContact.action.js";
import { pool } from "../../config/db.js";
import { getQuoteItemsAction } from "../actions/quote_actions/getQuoteItems.action.js";

export const Client = {
  contacts: async (parent, _args, ctx) => {
    requireRoles(ctx.user, ["ADMIN", "VENTAS", "CONTACT_PORTAL"]);
    if (ctx.user.role === "CONTACT_PORTAL" && String(parent.id) !== String(ctx.user.clientId)) {
      throw new Error("No autorizado");
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
  contact: async (parent) => {
    if (parent.contact) return parent.contact;
    if (!parent.contact_id) return null;
    return getContactAction(parent.contact_id);
  },
  client: async (parent) => {
    if (parent.client) return parent.client;
    if (parent.client_id) return getClientAction(parent.client_id);
    // Fallback: get client via contact
    if (!parent.contact_id) return null;
    const c = await getContactAction(parent.contact_id);
    if (!c) return null;
    return getClientAction(c.client_id);
  },
};

export const Quote = {
  client: async (parent) => {
    return getClientAction(parent.client_id);
  },
  contact: async (parent) => {
    if (!parent.contact_id) return null;
    return getContactAction(parent.contact_id);
  },
  user: async (parent) => {
    // Consulta directa simple para el usuario
    const [rows] = await pool.query(
      "SELECT id, full_name, email, role_id FROM users WHERE id = ?",
      [parent.user_id],
    );
    if (rows.length === 0) return null;
    // Mapear role_id al objeto de rol (el esquema espera user.role)
    const user = rows[0];
    const [roles] = await pool.query(
      "SELECT id, name FROM roles WHERE id = ?",
      [user.role_id],
    );
    return { ...user, role: roles[0] };
  },
  items: async (parent) => {
    return getQuoteItemsAction(parent.id);
  },
};

export const QuoteItem = {
  product: async (parent) => {
    // Consulta directa simple para el producto
    // O reutilizar getProductAction si existe (asumiendo que podría crearse más tarde o en línea)
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [
      parent.product_id,
    ]);
    return rows[0];
  },
};

export const Product = {
  client: async (parent) => {
    if (!parent.client_id) return null;
    return getClientAction(parent.client_id);
  },
};
