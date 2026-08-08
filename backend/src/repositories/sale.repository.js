import { pool } from "../config/db.js";
import { normalizePagination } from "./pagination.js";

const SALE_COLUMNS =
  "id, folio, quote_id, client_id, contact_id, client_name, contact_name, user_id, created_at, total, notes, status, email_sent_at, is_sent_to_client_portal, portal_sent_at, is_deleted_admin, is_deleted_portal";

const SALE_ITEM_COLUMNS =
  "id, sale_id, quote_item_id, product_id, quantity, base_unit_price, unit_price, discount, total";

export async function createSale(data, queryRunner = pool) {
  let clientName = data.client_name || null;
  if (!clientName && data.client_id) {
    const [cRows] = await queryRunner.query("SELECT business_name FROM clients WHERE id = ?", [data.client_id]);
    clientName = cRows[0]?.business_name || null;
  }
  let contactName = data.contact_name || null;
  if (!contactName && data.contact_id) {
    const [ccRows] = await queryRunner.query("SELECT full_name FROM client_contacts WHERE id = ?", [data.contact_id]);
    contactName = ccRows[0]?.full_name || null;
  }

  const [result] = await queryRunner.query(
    `INSERT INTO sales (quote_id, client_id, contact_id, client_name, contact_name, user_id, total, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.quote_id,
      data.client_id,
      data.contact_id || null,
      clientName,
      contactName,
      data.user_id || null,
      data.total,
      data.notes || null,
    ],
  );
  return result.insertId;
}

export async function updateSaleFolio({ saleId, folio, queryRunner = pool }) {
  await queryRunner.query("UPDATE sales SET folio = ? WHERE id = ?", [
    folio,
    saleId,
  ]);
}

export async function insertSaleItems(connection, { saleId, items }) {
  if (!items || items.length === 0) return;
  
  const values = items.map(item => [
    saleId,
    item.quote_item_id,
    item.product_id,
    item.quantity,
    item.base_unit_price,
    item.unit_price,
    item.discount,
    item.total,
  ]);
  
  await connection.query(
    `INSERT INTO sale_items (sale_id, quote_item_id, product_id, quantity, base_unit_price, unit_price, discount, total) VALUES ?`,
    [values]
  );
}

export async function findSaleById(id, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${SALE_COLUMNS} FROM sales WHERE id = ?`,
    [id],
  );
  return rows?.[0] || null;
}

export async function findSaleItemsBySaleId(saleId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${SALE_ITEM_COLUMNS} FROM sale_items WHERE sale_id = ? ORDER BY id ASC`,
    [saleId],
  );
  return rows;
}

export async function listSales(pagination = {}, queryRunner = pool) {
  const { limit, offset } = normalizePagination(pagination);
  const [rows] = await queryRunner.query(
    `SELECT ${SALE_COLUMNS}
     FROM sales
     WHERE is_deleted_admin = 0
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows;
}

export async function listSalesByUserId(userId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${SALE_COLUMNS}
     FROM sales
     WHERE user_id = ?
       AND is_deleted_admin = 0
     ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}

export async function listPortalSalesByContact(contactId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${SALE_COLUMNS}
     FROM sales
     WHERE contact_id = ?
       AND is_sent_to_client_portal = 1
       AND is_deleted_portal = 0
     ORDER BY created_at DESC`,
    [contactId],
  );
  return rows;
}

export async function findAcceptedQuoteForSale(quoteId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT id, folio, client_id, contact_id, user_id, status
     FROM quotes
     WHERE id = ?
       AND status = 'ACEPTADA'
       AND is_deleted_admin = 0
     LIMIT 1`,
    [quoteId],
  );
  return rows?.[0] || null;
}

export async function findQuoteItemsForSale({ quoteId, quoteItemIds }, queryRunner = pool) {
  if (!quoteItemIds.length) return [];
  const [items] = await queryRunner.query(
    `SELECT id AS quote_item_id,
            product_id,
            quantity,
            base_unit_price,
            unit_price,
            discount,
            total
     FROM quote_items
     WHERE quote_id = ?
       AND id IN (?)`,
    [quoteId, quoteItemIds],
  );
  return items;
}

export async function findSoldQuoteItemIds({ quoteItemIds }, queryRunner = pool) {
  if (!quoteItemIds.length) return [];
  const [rows] = await queryRunner.query(
    "SELECT quote_item_id FROM sale_items WHERE quote_item_id IN (?)",
    [quoteItemIds],
  );
  return rows.map((row) => String(row.quote_item_id));
}

export async function markSaleEmailSent(saleId, queryRunner = pool) {
  const [result] = await queryRunner.query(
    "UPDATE sales SET email_sent_at = NOW(), status = 'ENVIADA' WHERE id = ?",
    [saleId],
  );
  return result.affectedRows || 0;
}

export async function updateSalePortalStatus({
  saleId,
  isSentToClientPortal,
  contactId,
}, queryRunner = pool) {
  const [result] = await queryRunner.query(
    `UPDATE sales
     SET is_sent_to_client_portal = ?,
         contact_id = COALESCE(?, contact_id),
         portal_sent_at = CASE WHEN ? = 1 THEN COALESCE(portal_sent_at, NOW()) ELSE portal_sent_at END,
         status = CASE WHEN ? = 1 THEN 'ENVIADA' ELSE status END
     WHERE id = ?`,
    [
      isSentToClientPortal,
      contactId || null,
      isSentToClientPortal,
      isSentToClientPortal,
      saleId,
    ],
  );
  return result.affectedRows || 0;
}

export async function deleteSale({ saleId, queryRunner = pool }) {
  await queryRunner.query(
    "DELETE FROM sale_items WHERE sale_id = ?",
    [saleId],
  );

  const [result] = await queryRunner.query(
    "DELETE FROM sales WHERE id = ?",
    [saleId],
  );

  return result.affectedRows || 0;
}

export async function softDeleteSale({ saleId, queryRunner = pool }) {
  const [result] = await queryRunner.query(
    "UPDATE sales SET is_deleted_admin = 1 WHERE id = ?",
    [saleId],
  );
  return result.affectedRows || 0;
}

export async function softDeletePortalSale({ saleId, contactId, queryRunner = pool }) {
  const [result] = await queryRunner.query(
    "UPDATE sales SET is_deleted_portal = 1 WHERE id = ? AND contact_id = ?",
    [saleId, contactId],
  );
  return result.affectedRows || 0;
}
