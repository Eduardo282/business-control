/**
 * QuoteRepository — Responsabilidad Única: consultar y ensamblar datos de cotización desde MySQL.
 * No sabe nada de correos, PDFs ni validaciones externas.
 */
import { pool } from "../config/db.js";

/**
 * Obtiene una cotización completa con cliente, vendedor, contacto e items.
 * @param {number|string} quoteId
 * @returns {Promise<object>} Cotización ensamblada
 */
export async function fetchFullQuote(quoteId) {
  const connection = await pool.getConnection();
  try {
    // Cotización base
    const [rows] = await connection.query("SELECT * FROM quotes WHERE id = ?", [quoteId]);
    if (rows.length === 0) throw new Error("Cotización no encontrada");
    const quote = rows[0];

    // Cliente
    const [clientRows] = await connection.query("SELECT * FROM clients WHERE id = ?", [quote.client_id]);
    quote.client = clientRows[0];

    // Vendedor
    if (quote.user_id) {
      const [userRows] = await connection.query("SELECT * FROM users WHERE id = ?", [quote.user_id]);
      quote.user = userRows[0];
    }
    if (!quote.user) {
      quote.user = {
        full_name: "Ventas en Línea",
        email: "ventas@businesscontrol.com",
      };
    }

    // Contacto
    if (quote.contact_id) {
      const [contactRows] = await connection.query("SELECT * FROM client_contacts WHERE id = ?", [quote.contact_id]);
      quote.contact = contactRows[0] || null;
    } else {
      quote.contact = null;
    }

    // Items con productos
    const [itemRows] = await connection.query(
      `SELECT
         qi.*,
         COALESCE(qi.base_unit_price, qi.unit_price) as base_unit_price,
         COALESCE(qi.discount, 0) as discount,
         p.folio as product_folio,
         p.name as product_name,
         p.description as product_desc,
         p.category as product_category,
         p.users_count as product_users_count
       FROM quote_items qi
       JOIN products p ON qi.product_id = p.id
       WHERE qi.quote_id = ?`,
      [quoteId],
    );

    quote.items = itemRows;
    return quote;
  } finally {
    connection.release();
  }
}
