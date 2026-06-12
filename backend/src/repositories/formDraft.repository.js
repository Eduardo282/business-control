import { pool } from "../config/db.js";

const FORM_DRAFT_COLUMNS =
  "id, user_id, form_key, scope_key, data_json, created_at, updated_at";

function normalizeDraftKey(value, fallback = "global") {
  const normalized = String(value || "")
    .trim()
    .slice(0, 255);
  return normalized || fallback;
}

function serializeDraftData(dataJson) {
  const raw = String(dataJson || "").trim();
  if (!raw) return "{}";

  JSON.parse(raw);
  return raw;
}

export async function findFormDraft({
  userId,
  formKey,
  scopeKey = "global",
  queryRunner = pool,
}) {
  const [rows] = await queryRunner.query(
    `SELECT ${FORM_DRAFT_COLUMNS}
     FROM form_drafts
     WHERE user_id = ? AND form_key = ? AND scope_key = ?
     LIMIT 1`,
    [userId, normalizeDraftKey(formKey), normalizeDraftKey(scopeKey)],
  );

  return rows?.[0] || null;
}

export async function upsertFormDraft({
  userId,
  formKey,
  scopeKey = "global",
  dataJson,
  queryRunner = pool,
}) {
  const safeFormKey = normalizeDraftKey(formKey);
  const safeScopeKey = normalizeDraftKey(scopeKey);
  const safeDataJson = serializeDraftData(dataJson);

  await queryRunner.query(
    `INSERT INTO form_drafts (user_id, form_key, scope_key, data_json)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       data_json = VALUES(data_json),
       updated_at = CURRENT_TIMESTAMP`,
    [userId, safeFormKey, safeScopeKey, safeDataJson],
  );

  return findFormDraft({
    userId,
    formKey: safeFormKey,
    scopeKey: safeScopeKey,
    queryRunner,
  });
}

export async function deleteFormDraft({
  userId,
  formKey,
  scopeKey = "global",
  queryRunner = pool,
}) {
  const [result] = await queryRunner.query(
    `DELETE FROM form_drafts
     WHERE user_id = ? AND form_key = ? AND scope_key = ?`,
    [userId, normalizeDraftKey(formKey), normalizeDraftKey(scopeKey)],
  );

  return result.affectedRows > 0;
}
