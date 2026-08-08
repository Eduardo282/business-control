/**
 * QuoteRepository — Puerto de datos para la entidad Quote.
 * Centraliza las consultas, inserciones y actualizaciones de cotizaciones y sus ítems en MySQL.
 * Las acciones de negocio dependen de esta abstracción, cumpliendo con DIP.
 */
import { pool } from "../config/db.js";
import { normalizePagination } from "./pagination.js";

const QUOTE_COLUMNS =
  "id, folio, client_id, contact_id, client_name, contact_name, user_id, created_at, total, notes, status, is_contact_requested, is_registered, registered_at, email_sent_at, is_sent_to_client_portal, portal_responded_at, notification_read, notification_dismissed, is_deleted_admin, is_deleted_portal";

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

    let clientName = null;
    if (client_id) {
      const [cRows] = await connection.query("SELECT business_name FROM clients WHERE id = ?", [client_id]);
      clientName = cRows[0]?.business_name || null;
    }
    let contactName = null;
    if (contact_id) {
      const [ccRows] = await connection.query("SELECT full_name FROM client_contacts WHERE id = ?", [contact_id]);
      contactName = ccRows[0]?.full_name || null;
    }

    const [resQuote] = await connection.query(
      `INSERT INTO quotes (folio, client_id, contact_id, client_name, contact_name, user_id, total, notes, status, is_contact_requested, is_registered)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', 0, 0)`,
      [folio, client_id, contact_id || null, clientName, contactName, user_id, total, notes],
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
  if (!items || items.length === 0) return;
  
  const values = items.map(item => [
    quoteId,
    item.product_id,
    item.quantity,
    item.base_unit_price,
    item.unit_price,
    item.discount,
    item.total,
  ]);
  
  await connection.query(
    `INSERT INTO quote_items (quote_id, product_id, quantity, base_unit_price, unit_price, discount, total) VALUES ?`,
    [values]
  );
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
    "SELECT id, folio, name, category, product_type, current_price FROM products WHERE id IN (?)",
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
    `SELECT id, status, folio, is_registered
     FROM quotes
     WHERE id = ?
       AND contact_id = ?
       AND is_registered = 1
       AND is_sent_to_client_portal = 1
       AND is_deleted_portal = 0`,
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
 * Elimina físicamente una cotización y sus ítems.
 * Las cotizaciones con una venta asociada se conservan para no eliminar la venta.
 * @param {object} params
 * @param {number|string} params.quoteId
 * @param {object} [params.queryRunner]
 * @returns {Promise<number>} Filas afectadas
 */
export async function deleteQuote({ quoteId, queryRunner = pool }) {
  const [sales] = await queryRunner.query(
    "SELECT id FROM sales WHERE quote_id = ? LIMIT 1",
    [quoteId],
  );

  if (sales.length > 0) {
    throw new Error("No se puede eliminar una cotización con una venta asociada.");
  }

  await queryRunner.query("DELETE FROM quote_items WHERE quote_id = ?", [quoteId]);
  const [result] = await queryRunner.query(
    "DELETE FROM quotes WHERE id = ?",
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
export async function updateQuoteTotal({ quoteId, total, folio, queryRunner = pool }) {
  if (folio !== undefined) {
    await queryRunner.query("UPDATE quotes SET total = ?, folio = ? WHERE id = ?", [
      total,
      folio || null,
      quoteId,
    ]);
    return;
  }

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


/**
 * Locks a contact-created quote request for exclusive resolution.
 * @param {number|string} quoteId
 * @param {object} [queryRunner]
 * @returns {Promise<object|null>}
 */
export async function findContactRequestedQuoteForUpdate(
  quoteId,
  queryRunner = pool,
) {
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS}
     FROM quotes
     WHERE id = ?
       AND status = 'SOLICITADA'
       AND is_contact_requested = 1
     FOR UPDATE`,
    [quoteId],
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
 * @returns {Promise<number>}
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
  const [result] = await queryRunner.query(
    `UPDATE quotes
     SET folio = ?, client_id = ?, contact_id = ?, user_id = ?, total = ?, notes = ?, status = 'PENDIENTE', is_registered = 0, created_at = NOW()
     WHERE id = ?
       AND status = 'SOLICITADA'
       AND is_contact_requested = 1`,
    [folio, client_id, contact_id, user_id, total, notes, quoteId],
  );
  return result.affectedRows || 0;
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
    is_contact_requested,
    is_registered,
    is_sent_to_client_portal,
  } = data;

  let clientName = data.client_name || null;
  if (!clientName && client_id) {
    const [cRows] = await queryRunner.query("SELECT business_name FROM clients WHERE id = ?", [client_id]);
    clientName = cRows[0]?.business_name || null;
  }
  let contactName = data.contact_name || null;
  if (!contactName && contact_id) {
    const [ccRows] = await queryRunner.query("SELECT full_name FROM client_contacts WHERE id = ?", [contact_id]);
    contactName = ccRows[0]?.full_name || null;
  }

  const [resQuote] = await queryRunner.query(
    `INSERT INTO quotes (folio, client_id, contact_id, client_name, contact_name, user_id, total, notes, status, is_contact_requested, is_registered, is_sent_to_client_portal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      folio || null,
      client_id,
      contact_id || null,
      clientName,
      contactName,
      user_id || null,
      total,
      notes || null,
      status || "PENDIENTE",
      is_contact_requested ? 1 : 0,
      is_registered !== undefined ? is_registered : 0,
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
 * Obtiene las solicitudes y respuestas del portal para la cola de notificaciones.
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function findUnreadQuoteRequests(queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS}
     FROM quotes
     WHERE (
       (is_contact_requested = 1 AND status IN ('SOLICITADA', 'ACEPTADA', 'RECHAZADA'))
       OR (
         status IN ('ACEPTADA', 'RECHAZADA')
         AND portal_responded_at IS NOT NULL
       )
     )
       AND is_deleted_admin = 0
       AND notification_dismissed = 0
     ORDER BY
       notification_read ASC,
       CASE
         WHEN status = 'SOLICITADA' THEN 0
         WHEN status = 'ACEPTADA' THEN 1
         ELSE 2
       END,
       COALESCE(portal_responded_at, created_at) DESC`
  );
  return rows;
}

/**
 * Cuenta las cotizaciones con estado SOLICITADA.
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function countPendingQuoteRequests(queryRunner = pool) {
  const [rows] = await queryRunner.query(
    "SELECT COUNT(*) as count FROM quotes WHERE status = 'SOLICITADA' AND is_contact_requested = 1 AND is_deleted_admin = 0 AND notification_dismissed = 0"
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
    `UPDATE quotes
     SET is_sent_to_client_portal = ?,
         contact_id = COALESCE(?, contact_id),
         status = CASE
           WHEN status IN ('ACEPTADA', 'RECHAZADA') THEN status
           WHEN ? = 1 AND is_registered = 1 THEN 'ENVIADA'
           ELSE status
         END
     WHERE id = ?`,
    [
      isSentToClientPortal,
      contactId || null,
      isSentToClientPortal,
      quoteId,
    ],
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
    `SELECT ${QUOTE_COLUMNS}
     FROM quotes
     WHERE contact_id = ?
       AND is_registered = 1
       AND is_sent_to_client_portal = 1
       AND is_deleted_portal = 0
     ORDER BY created_at DESC`,
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
 * Guarda la respuesta del contacto sobre una cotizacion enviada al portal.
 * @param {object} params
 * @param {number|string} params.quoteId
 * @param {"ACEPTADA"|"RECHAZADA"} params.status
 * @param {string[]} [params.expectedStatuses]
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function updatePortalQuoteResponseStatus({
  quoteId,
  status,
  expectedStatuses = ["SOLICITADA", "PENDIENTE", "ENVIADA"],
}, queryRunner = pool) {
  const placeholders = expectedStatuses.map(() => "?").join(", ");
  const [result] = await queryRunner.query(
    `UPDATE quotes
     SET status = ?,
         portal_responded_at = NOW(),
         notification_read = 0
     WHERE id = ?
       AND status IN (${placeholders})
       AND portal_responded_at IS NULL`,
    [status, quoteId, ...expectedStatuses],
  );
  return result.affectedRows || 0;
}

export async function markQuoteEmailSent(quoteId, queryRunner = pool) {
  const [result] = await queryRunner.query(
    `UPDATE quotes
     SET email_sent_at = NOW(),
         status = CASE
           WHEN status IN ('ACEPTADA', 'RECHAZADA') THEN status
           ELSE 'ENVIADA'
         END
     WHERE id = ?`,
    [quoteId],
  );
  return result.affectedRows || 0;
}

/**
 * Marca una cotización como registrada.
 * @param {number|string} quoteId
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function registerQuote(quoteId, queryRunner = pool) {
  const [result] = await queryRunner.query(
    `UPDATE quotes
     SET is_registered = 1,
         registered_at = COALESCE(registered_at, NOW()),
         is_sent_to_client_portal = CASE
           WHEN contact_id IS NOT NULL THEN 1
           ELSE is_sent_to_client_portal
         END,
         status = CASE
           WHEN status IN ('ACEPTADA', 'RECHAZADA') THEN status
           WHEN contact_id IS NOT NULL THEN 'ENVIADA'
           WHEN status = 'ENVIADA' THEN 'ENVIADA'
           ELSE 'PENDIENTE'
         END
     WHERE id = ?`,
    [quoteId],
  );
  return result.affectedRows || 0;
}

/**
 * Marks a portal-requested quote as accepted after the admin resolves it.
 * Normal admin-created quotes remain ENVIADA until the contact responds.
 * @param {number|string} quoteId
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function acceptResolvedQuoteRequest(quoteId, queryRunner = pool) {
  const [result] = await queryRunner.query(
    `UPDATE quotes
     SET status = 'ACEPTADA'
     WHERE id = ?
       AND status = 'ENVIADA'
       AND is_contact_requested = 1
       AND is_registered = 1
       AND is_sent_to_client_portal = 1`,
    [quoteId],
  );
  return result.affectedRows || 0;
}

/**
 * Lista todas las cotizaciones excluyendo las que tienen estado SOLICITADA y que no estén eliminadas.
 * @param {{ limit?: number, offset?: number }} [pagination]
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listAllNonRequestedQuotes(pagination = {}, queryRunner = pool) {
  const { limit, offset } = normalizePagination(pagination);
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS} FROM quotes WHERE status != 'SOLICITADA' AND is_deleted_admin = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows;
}

/**
 * Lista las cotizaciones de un cliente excluyendo las que tienen estado SOLICITADA y que no estén eliminadas.
 * @param {number|string} clientId
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listQuotesByClientId(clientId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS} FROM quotes WHERE client_id = ? AND status != 'SOLICITADA' AND is_deleted_admin = 0 ORDER BY created_at DESC`,
    [clientId]
  );
  return rows;
}

/**
 * Lista las cotizaciones de un usuario ejecutor excluyendo las que tienen estado SOLICITADA y que no estén eliminadas.
 * @param {number|string} userId
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listQuotesByUserId(userId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${QUOTE_COLUMNS} FROM quotes WHERE user_id = ? AND status != 'SOLICITADA' AND is_deleted_admin = 0 ORDER BY created_at DESC`,
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
 * Dismisses a single quote notification so it no longer appears in the queue.
 * @param {number|string} quoteId
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function dismissQuoteNotification(quoteId, queryRunner = pool) {
  const [result] = await queryRunner.query(
    "UPDATE quotes SET notification_dismissed = 1, notification_read = 1 WHERE id = ?",
    [quoteId]
  );
  return result.affectedRows || 0;
}

/**
 * Dismisses all quote notifications from the notification queue.
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function dismissAllQuoteNotifications(queryRunner = pool) {
  const [result] = await queryRunner.query(
    `UPDATE quotes SET notification_dismissed = 1, notification_read = 1
     WHERE (
       (is_contact_requested = 1 AND status IN ('ACEPTADA', 'RECHAZADA'))
       OR (
         status IN ('ACEPTADA', 'RECHAZADA')
         AND portal_responded_at IS NOT NULL
       )
     )
       AND is_deleted_admin = 0
       AND notification_dismissed = 0`
  );
  return result.affectedRows || 0;
}
