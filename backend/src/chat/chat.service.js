import { pool } from "../config/db.js";

/**
 * Chat Service — All database operations for the support chat.
 * Designed for high throughput: uses connection pooling, prepared statements,
 * and proper indexing (see chat_tables.sql).
 */

// ── Conversations ──────────────────────────────────────────

export async function createConversation(contactId, subject = "Soporte General") {
  const [result] = await pool.execute(
    `INSERT INTO support_conversations (contact_id, subject, status)
     VALUES (?, ?, 'WAITING')`,
    [contactId, subject]
  );
  return getConversation(result.insertId);
}

export async function getConversation(id) {
  const [rows] = await pool.execute(
    `SELECT sc.*,
            c.full_name AS contact_name,
            c.email     AS contact_email
     FROM support_conversations sc
     LEFT JOIN client_contacts c ON c.id = sc.contact_id
     WHERE sc.id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function assignAgent(conversationId, agentUserId) {
  await pool.execute(
    `UPDATE support_conversations
     SET agent_user_id = ?, status = 'ACTIVE', updated_at = NOW()
     WHERE id = ? AND status = 'WAITING'`,
    [agentUserId, conversationId]
  );
  return getConversation(conversationId);
}

export async function closeConversation(conversationId, rating = null) {
  await pool.execute(
    `UPDATE support_conversations
     SET status = 'CLOSED', closed_at = NOW(), rating = ?, updated_at = NOW()
     WHERE id = ?`,
    [rating, conversationId]
  );
  return getConversation(conversationId);
}

export async function getWaitingConversations() {
  const [rows] = await pool.execute(
    `SELECT sc.*,
            c.full_name AS contact_name,
            c.email     AS contact_email
     FROM support_conversations sc
     LEFT JOIN client_contacts c ON c.id = sc.contact_id
     WHERE sc.status = 'WAITING'
     ORDER BY sc.created_at ASC`
  );
  return rows;
}

export async function getActiveConversationsByAgent(agentUserId) {
  const [rows] = await pool.execute(
    `SELECT sc.*,
            c.full_name AS contact_name,
            c.email     AS contact_email
     FROM support_conversations sc
     LEFT JOIN client_contacts c ON c.id = sc.contact_id
     WHERE sc.agent_user_id = ? AND sc.status = 'ACTIVE'
     ORDER BY sc.updated_at DESC`,
    [agentUserId]
  );
  return rows;
}

export async function getConversationsByContact(contactId) {
  const [rows] = await pool.execute(
    `SELECT sc.*
     FROM support_conversations sc
     WHERE sc.contact_id = ?
     ORDER BY sc.created_at DESC
     LIMIT 50`,
    [contactId]
  );
  return rows;
}

/** Get the active (non-closed) conversation for a contact, if any */
export async function getOpenConversationByContact(contactId) {
  const [rows] = await pool.execute(
    `SELECT sc.*,
            c.full_name AS contact_name,
            c.email     AS contact_email
     FROM support_conversations sc
     LEFT JOIN client_contacts c ON c.id = sc.contact_id
     WHERE sc.contact_id = ? AND sc.status IN ('WAITING','ACTIVE')
     ORDER BY sc.created_at DESC
     LIMIT 1`,
    [contactId]
  );
  return rows[0] || null;
}

// ── Messages ───────────────────────────────────────────────

export async function addMessage(conversationId, senderType, senderId, body) {
  const [result] = await pool.execute(
    `INSERT INTO support_messages (conversation_id, sender_type, sender_id, body)
     VALUES (?, ?, ?, ?)`,
    [conversationId, senderType, senderId, body]
  );

  // Touch the conversation's updated_at
  await pool.execute(
    `UPDATE support_conversations SET updated_at = NOW() WHERE id = ?`,
    [conversationId]
  );

  return getMessage(result.insertId);
}

export async function getMessage(id) {
  const [rows] = await pool.execute(
    `SELECT * FROM support_messages WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function getMessages(conversationId, limit = 100, beforeId = null) {
  let sql = `SELECT * FROM support_messages WHERE conversation_id = ?`;
  const params = [conversationId];

  if (beforeId) {
    sql += ` AND id < ?`;
    params.push(beforeId);
  }

  sql += ` ORDER BY created_at ASC LIMIT ${Number(limit)}`;

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function deleteMessage(messageId) {
  const msg = await getMessage(messageId);
  if (!msg) return null;
  await pool.execute(
    `DELETE FROM support_messages WHERE id = ?`,
    [messageId]
  );
  return msg;
}
