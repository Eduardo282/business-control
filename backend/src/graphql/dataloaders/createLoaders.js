import { pool } from "../../config/db.js";

class BatchLoader {
  constructor(batchLoadFn) {
    this.batchLoadFn = batchLoadFn;
    this.cache = new Map();
    this.queue = [];
    this.scheduled = false;
  }

  load(key) {
    const cacheKey = String(key);
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const promise = new Promise((resolve, reject) => {
      this.queue.push({ key, cacheKey, resolve, reject });
    });
    this.cache.set(cacheKey, promise);

    if (!this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => this.flush());
    }

    return promise;
  }

  async flush() {
    const batch = this.queue;
    this.queue = [];
    this.scheduled = false;

    try {
      const keys = batch.map((entry) => entry.key);
      const values = await this.batchLoadFn(keys);
      batch.forEach((entry, index) => entry.resolve(values[index] ?? null));
    } catch (error) {
      batch.forEach((entry) => {
        this.cache.delete(entry.cacheKey);
        entry.reject(error);
      });
    }
  }
}

function uniqueKeys(keys) {
  return [...new Set(keys.filter((key) => key !== null && key !== undefined).map(String))];
}

function mapRowsById(rows) {
  return new Map(rows.map((row) => [String(row.id), row]));
}

export function createLoaders() {
  return {
    clientById: new BatchLoader(async (keys) => {
      const ids = uniqueKeys(keys);
      if (!ids.length) return keys.map(() => null);
      const [rows] = await pool.query(
        "SELECT id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad, address FROM clients WHERE id IN (?)",
        [ids],
      );
      const byId = mapRowsById(rows);
      return keys.map((key) => byId.get(String(key)) || null);
    }),

    contactById: new BatchLoader(async (keys) => {
      const ids = uniqueKeys(keys);
      if (!ids.length) return keys.map(() => null);
      const [rows] = await pool.query(
        "SELECT id, client_id, full_name, email, phone, position_title, has_portal_access, is_active, created_at, updated_at FROM client_contacts WHERE id IN (?)",
        [ids],
      );
      const byId = mapRowsById(rows);
      return keys.map((key) => byId.get(String(key)) || null);
    }),

    contactsByClientId: new BatchLoader(async (keys) => {
      const ids = uniqueKeys(keys);
      if (!ids.length) return keys.map(() => []);
      const [rows] = await pool.query(
        "SELECT id, client_id, full_name, email, phone, position_title, has_portal_access, is_active, created_at, updated_at FROM client_contacts WHERE client_id IN (?) ORDER BY is_active DESC, full_name ASC",
        [ids],
      );
      const byClientId = new Map();
      for (const row of rows) {
        const cId = String(row.client_id);
        if (!byClientId.has(cId)) byClientId.set(cId, []);
        byClientId.get(cId).push(row);
      }
      return keys.map((key) => byClientId.get(String(key)) || []);
    }),

    activeServicesByContactId: new BatchLoader(async (keys) => {
      const ids = uniqueKeys(keys);
      if (!ids.length) return keys.map(() => []);
      const [rows] = await pool.query(
        `SELECT cp.*, p.name as product_name, p.folio as product_folio
         FROM contact_products cp
         JOIN products p ON p.id = cp.product_id
         WHERE cp.contact_id IN (?) AND cp.status = 'ACTIVE'`,
        [ids],
      );
      const byContactId = new Map();
      for (const row of rows) {
        const cId = String(row.contact_id);
        if (!byContactId.has(cId)) byContactId.set(cId, []);
        // Match the shape expected by listContactProductsAction
        byContactId.get(cId).push({
          ...row,
          start_date: row.start_date && !isNaN(new Date(row.start_date)) ? new Date(row.start_date).toISOString() : null,
          expiration_date: row.expiration_date && !isNaN(new Date(row.expiration_date)) ? new Date(row.expiration_date).toISOString() : null,
          product: { id: row.product_id, name: row.product_name, folio: row.product_folio },
        });
      }
      return keys.map((key) => byContactId.get(String(key)) || []);
    }),

    userById: new BatchLoader(async (keys) => {
      const ids = uniqueKeys(keys);
      if (!ids.length) return keys.map(() => null);
      const [rows] = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.telefono, u.role_id, r.name AS role_name
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
         WHERE u.id IN (?)`,
        [ids],
      );
      const byId = new Map(
        rows.map((row) => [
          String(row.id),
          {
            id: row.id,
            full_name: row.full_name,
            email: row.email,
            telefono: row.telefono,
            role_id: row.role_id,
            role: row.role_id ? { id: row.role_id, name: row.role_name } : null,
          },
        ]),
      );
      return keys.map((key) => byId.get(String(key)) || null);
    }),

    quoteItemsByQuoteId: new BatchLoader(async (keys) => {
      const ids = uniqueKeys(keys);
      if (!ids.length) return keys.map(() => []);
      const [rows] = await pool.query(
        "SELECT id, quote_id, product_id, quantity, base_unit_price, unit_price, discount, total FROM quote_items WHERE quote_id IN (?)",
        [ids],
      );
      const grouped = new Map();
      rows.forEach((row) => {
        const key = String(row.quote_id);
        const items = grouped.get(key) || [];
        items.push(row);
        grouped.set(key, items);
      });
      return keys.map((key) => grouped.get(String(key)) || []);
    }),

    productById: new BatchLoader(async (keys) => {
      const ids = uniqueKeys(keys);
      if (!ids.length) return keys.map(() => null);
      const [rows] = await pool.query(
        "SELECT id, folio, client_id, name, category, product_type, current_price, users_count, description FROM products WHERE id IN (?)",
        [ids],
      );
      const byId = mapRowsById(rows);
      return keys.map((key) => byId.get(String(key)) || null);
    }),

    quoteById: new BatchLoader(async (keys) => {
      const ids = uniqueKeys(keys);
      if (!ids.length) return keys.map(() => null);
      const [rows] = await pool.query(
        "SELECT * FROM quotes WHERE id IN (?)",
        [ids],
      );
      const byId = mapRowsById(rows);
      return keys.map((key) => byId.get(String(key)) || null);
    }),

    saleItemsBySaleId: new BatchLoader(async (keys) => {
      const ids = uniqueKeys(keys);
      if (!ids.length) return keys.map(() => []);
      const [rows] = await pool.query(
        "SELECT id, sale_id, product_id, quantity, base_unit_price, unit_price, discount, total FROM sale_items WHERE sale_id IN (?)",
        [ids],
      );
      const grouped = new Map();
      rows.forEach((row) => {
        const key = String(row.sale_id);
        const items = grouped.get(key) || [];
        items.push(row);
        grouped.set(key, items);
      });
      return keys.map((key) => grouped.get(String(key)) || []);
    }),
  };
}
