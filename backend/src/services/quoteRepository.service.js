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

    // Run independent queries in parallel for speed
    const [clientResult, userResult, contactResult, itemResult] = await Promise.all([
      // Cliente
      connection.query("SELECT * FROM clients WHERE id = ?", [quote.client_id]),
      // Vendedor
      quote.user_id
        ? connection.query("SELECT * FROM users WHERE id = ?", [quote.user_id])
        : Promise.resolve([[]]),
      // Contacto
      quote.contact_id
        ? connection.query("SELECT * FROM client_contacts WHERE id = ?", [quote.contact_id])
        : Promise.resolve([[]]),
      // Items con productos
      connection.query(
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
      ),
    ]);

    quote.client = clientResult[0][0];
    quote.user = userResult[0][0] || {
      full_name: "Ventas en Línea",
      email: "ventas@businesscontrol.com",
    };
    quote.contact = contactResult[0][0] || null;
    const itemRows = itemResult[0];

    quote.items = itemRows;
    return quote;
  } finally {
    connection.release();
  }
}
