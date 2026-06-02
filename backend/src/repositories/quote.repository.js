/**
 * QuoteRepository — Puerto de datos para la entidad Quote.
 * Centraliza las consultas, inserciones y actualizaciones de cotizaciones y sus ítems en MySQL.
 * Las acciones de negocio dependen de esta abstracción, cumpliendo con DIP.
 */
import { pool } from "../config/db.js";
import { normalizePagination } from "./pagination.js";

const QUOTE_COLUMNS =
  "id, folio, client_id, contact_id, user_id, created_at, total, notes, status, is_sent_to_client_portal, notification_read, is_deleted_admin, is_deleted_portal";

const QUOTE_ITEM_COLUMNS =
  "id, quote_id, product_id, quantity, base_unit_price, unit_price, discount, total";

/**
 * Inserta una cotización y sus ítems asociados dentro de una transacción.
 * @param {object} params
 * @param {string} params.folio
 * @param {number|string} params.client_id
 * @param {number|string|null} params.contact_id
 * @param {number|string} params.user_id
 * @param {number} params.total
 * @param {string|null} params.notes
 * @param {object[]} params.items — Lista de ítems formateados
 * @returns {Promise<number>} ID de la cotización insertada
 */
export async function createQuoteWithItems({
  folio,
  client_id,
  contact_id,
  user_id,
  total,
  notes,
  items,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [resQuote] = await connection.query(
      `INSERT INTO quotes (folio, client_id, contact_id, user_id, total, notes, status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [folio, client_id, contact_id || null, user_id, total, notes],
    );
    const quoteId = resQuote.insertId;

    await insertQuoteItems(connection, { quoteId, items });

    await connection.commit();
    return quoteId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function insertQuoteItems(connection, { quoteId, items }) {
  for (const item of items) {
    await connection.query(
      `INSERT INTO quote_items (quote_id, product_id, quantity, base_unit_price, unit_price, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        quoteId,
        item.product_id,
        item.quantity,
        item.base_unit_price,
        item.unit_price,
        item.discount,
        item.total,
      ],
    );
  }
}

export async function replaceQuoteItems(connection, { quoteId, items }) {
  await connection.query("DELETE FROM quote_items WHERE quote_id = ?", [
    quoteId,
  ]);
  await insertQuoteItems(connection, { quoteId, items });
}

/**
 * Obtiene los productos del catálogo asociados a una lista de IDs (para validación masiva).
 * @param {number[]} productIds
 * @returns {Promise<object[]>}
 */
export async function fetchProductsForQuote(productIds, queryRunner = pool) {
  if (!productIds.length) return [];
  const [rows] = await queryRunner.query(
    "SELECT id, name, category, product_type, current_price FROM products WHERE id IN (?)",
    [productIds],
  );
  return rows;
}

/**
 * Busca una cotizacion del portal por id y contacto.
 * @param {object} params
 * @param {number|string} params.quoteId
 * @param {number|string} params.contactId
 * @param {object} [params.queryRunner]
 * @returns {Promise<object|null>}
 */
export async function findPortalQuote({ quoteId, contactId, queryRunner = pool }) {
  const [rows] = await queryRunner.query(
    "SELECT id, status FROM quotes WHERE id = ? AND contact_id = ? AND is_deleted_portal = 0",
    [quoteId, contactId],
  );
  return rows?.[0] || null;
}

/**
 * Marca una cotizacion como eliminada.
 * @param {object} params
 * @param {number|string} params.quoteId
 * @param {object} [params.queryRunner]
 * @returns {Promise<number>} Filas afectadas
 */
export async function softDeleteQuote({ quoteId, queryRunner = pool }) {
  const [result] = await queryRunner.query(
    "UPDATE quotes SET is_deleted_admin = 1 WHERE id = ?",
    [quoteId],
  );
  return result.affectedRows || 0;
}

/**
 * Marca una cotizacion como eliminada solo para el portal del contacto.
 * @param {object} params
 * @param {number|string} params.quoteId
 * @param {object} [params.queryRunner]
 * @returns {Promise<number>} Filas afectadas
 */
export async function softDeletePortalQuote({ quoteId, queryRunner = pool }) {
  const [result] = await queryRunner.query(
    "UPDATE quotes SET is_deleted_portal = 1 WHERE id = ?",
    [quoteId],
  );
  return result.affectedRows || 0;
}

/**
 * Actualiza el total de una cotizacion.
 * @param {object} params
 * @param {number|string} params.quoteId
 * @param {number} params.total
 * @param {object} [params.queryRunner]
 * @returns {Promise<void>}
 */
export async function updateQuoteTotal({ quoteId, total, queryRunner = pool }) {
  await queryRunner.query("UPDATE quotes SET total = ? WHERE id = ?", [total, quoteId]);
}

/**
 * Busca una cotizacion por id y status.
 * @param {object} params
 * @param {number|string} params.quoteId
 * @param {string} params.status
 * @param {object} [params.queryRunner]
 * @returns {Promise<object|null>}
 */
export async function findQuoteByStatus({ quoteId, status, queryRunner = pool }) {
  const [rows] = await queryRunner.query(
    "SELECT id FROM quotes WHERE id = ? AND status = ?",
    [quoteId, status],
  );
  return rows?.[0] || null;
}

/**
 * Actualiza la cotizacion al resolver una solicitud.
 * @param {object} params
 * @param {number|string} params.quoteId
 * @param {string} params.folio
 * @param {number|string} params.client_id
 * @param {number|string|null} params.contact_id
 * @param {number|string} params.user_id
 * @param {number} params.total
 * @param {string|null} params.notes
 * @param {object} [params.queryRunner]
 * @returns {Promise<void>}
 */
export async function resolveQuoteRequest({
  quoteId,
  folio,
  client_id,
  contact_id,
  user_id,
  total,
  notes,
  queryRunner = pool,
}) {
  await queryRunner.query(
    `UPDATE quotes
     SET folio = ?, client_id = ?, contact_id = ?, user_id = ?, total = ?, notes = ?, status = 'ACCEPTED', created_at = NOW()
     WHERE id = ?`,
    [folio, client_id, contact_id, user_id, total, notes, quoteId],
  );
}

/**
 * Crea una nueva cotización.
 * @param {object} data
 * @param {object} [queryRunner]
 * @returns {Promise<number>} ID de la cotización insertada
 */
export async function createQuote(data, queryRunner = pool) {
  const {
    folio,
    client_id,
    contact_id,
    user_id,
    total,
    notes,
    status,
    is_sent_to_client_portal,
  } = data;

  const [resQuote] = await queryRunner.query(
    `INSERT INTO quotes (folio, client_id, contact_id, user_id, total, notes, status, is_sent_to_client_portal) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      folio || null,
      client_id,
      contact_id || null,
      user_id || null,
      total,
      notes || null,
      status || "PENDING",
      is_sent_to_client_portal !== undefined ? is_sent_to_client_portal : 0,
    ],
  );

  return resQuote.insertId;
}

/**
 * Busca una cotización por ID.
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<object|null>}
 */
export async function findQuoteById(id, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS} FROM quotes WHERE id = ?`,
    [id],
  );
  return rows?.[0] || null;
}

/**
 * Obtiene las cotizaciones activas o rechazadas para la cola de notificaciones.
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function findUnreadQuoteRequests(queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS}
     FROM quotes
     WHERE status IN ('REQUESTED', 'REJECTED') AND is_deleted_admin = 0
     ORDER BY CASE WHEN status = 'REQUESTED' THEN 0 ELSE 1 END, created_at DESC`
  );
  return rows;
}

/**
 * Cuenta las cotizaciones con estado REQUESTED.
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function countPendingQuoteRequests(queryRunner = pool) {
  const [rows] = await queryRunner.query(
    "SELECT COUNT(*) as count FROM quotes WHERE status = 'REQUESTED' AND is_deleted_admin = 0"
  );
  return rows?.[0]?.count || 0;
}

/**
 * Obtiene los ítems asociados a una cotización.
 * @param {number|string} quoteId
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function findQuoteItemsByQuoteId(quoteId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_ITEM_COLUMNS} FROM quote_items WHERE quote_id = ?`,
    [quoteId]
  );
  return rows;
}

/**
 * Lista cotizaciones filtrando opcionalmente por status, user_id e is_deleted_admin.
 * @param {object} filter
 * @param {string} [filter.status]
 * @param {number|string} [filter.user_id]
 * @param {number} [filter.is_deleted_admin]
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listQuotesFiltered({ status, user_id, is_deleted_admin = 0 } = {}, queryRunner = pool) {
  let query = `SELECT ${QUOTE_COLUMNS} FROM quotes WHERE is_deleted_admin = ?`;
  const params = [is_deleted_admin];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (user_id) {
    query += " AND user_id = ?";
    params.push(user_id);
  }

  query += " ORDER BY created_at DESC";

  const [rows] = await queryRunner.query(query, params);
  return rows;
}

/**
 * Actualiza el estado del portal de una cotización.
 * @param {object} params
 * @param {number|string} params.quoteId
 * @param {number} params.isSentToClientPortal
 * @param {number|string|null} params.contactId
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function updateQuotePortalStatus({ quoteId, isSentToClientPortal, contactId }, queryRunner = pool) {
  const [result] = await queryRunner.query(
    "UPDATE quotes SET is_sent_to_client_portal = ?, contact_id = ? WHERE id = ?",
    [isSentToClientPortal, contactId || null, quoteId]
  );
  return result.affectedRows || 0;
}

/**
 * Marca una cotización como leída.
 * @param {number|string} quoteId
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function markQuoteAsRead(quoteId, queryRunner = pool) {
  const [result] = await queryRunner.query(
    "UPDATE quotes SET notification_read = 1 WHERE id = ?",
    [quoteId]
  );
  return result.affectedRows || 0;
}

/**
 * Lista las cotizaciones del portal asociadas a un contacto.
 * @param {number|string} contactId
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listPortalQuotesByContact(contactId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS} FROM quotes WHERE contact_id = ? AND is_sent_to_client_portal = 1 AND is_deleted_portal = 0 ORDER BY created_at DESC`,
    [contactId]
  );
  return rows;
}

/**
 * Actualiza el estado de una cotización.
 * @param {object} params
 * @param {number|string} params.quoteId
 * @param {string} params.status
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function updateQuoteStatus({ quoteId, status }, queryRunner = pool) {
  const [result] = await queryRunner.query(
    "UPDATE quotes SET status = ? WHERE id = ?",
    [status, quoteId]
  );
  return result.affectedRows || 0;
}

/**
 * Lista todas las cotizaciones excluyendo las que tienen estado REQUESTED y que no estén eliminadas.
 * @param {{ limit?: number, offset?: number }} [pagination]
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listAllNonRequestedQuotes(pagination = {}, queryRunner = pool) {
  const { limit, offset } = normalizePagination(pagination);
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS} FROM quotes WHERE status != 'REQUESTED' AND is_deleted_admin = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows;
}

/**
 * Lista las cotizaciones de un cliente excluyendo las que tienen estado REQUESTED y que no estén eliminadas.
 * @param {number|string} clientId
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listQuotesByClientId(clientId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS} FROM quotes WHERE client_id = ? AND status != 'REQUESTED' AND is_deleted_admin = 0 ORDER BY created_at DESC`,
    [clientId]
  );
  return rows;
}

/**
 * Lista las cotizaciones de un usuario ejecutor excluyendo las que tienen estado REQUESTED y que no estén eliminadas.
 * @param {number|string} userId
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listQuotesByUserId(userId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS} FROM quotes WHERE user_id = ? AND status != 'REQUESTED' AND is_deleted_admin = 0 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Marca la notificación de una cotización como leída.
 * @param {number|string} quoteId
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function markQuoteNotificationAsRead(quoteId, queryRunner = pool) {
  const [result] = await queryRunner.query(
    "UPDATE quotes SET notification_read = 1 WHERE id = ?",
    [quoteId]
  );
  return result.affectedRows || 0;
}

/**
 * Lista las cotizaciones del portal asociadas a un cliente.
 * @param {number|string} clientId
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listPortalQuotesByClientId(clientId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS} FROM quotes 
     WHERE client_id = ? 
     AND is_sent_to_client_portal = 1 
     AND is_deleted_portal = 0
     ORDER BY created_at DESC`,
    [clientId]
  );
  return rows;
}
