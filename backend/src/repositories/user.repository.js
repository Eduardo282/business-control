/**
 * UserRepository — Puerto de datos para la entidad User.
 * Centraliza TODAS las consultas SQL de usuarios en un solo lugar.
 * Las acciones de negocio importan este repositorio en lugar de `pool` directamente.
 *
 * Beneficio DIP: si se cambia de MySQL a PostgreSQL u otro motor,
 * solo se modifica este archivo sin tocar la lógica de negocio.
 */
import { pool } from "../config/db.js";

/**
 * Busca un usuario activo por email (para login).
 * @param {string} email
 * @returns {Promise<object|null>} Usuario con rol adjunto, o null
 */
export async function findActiveUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.telefono, r.id AS role_id, r.name AS role_name, u.password_hash
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = :email AND u.is_active = 1
     LIMIT 1`,
    { email },
  );
  return rows?.[0] || null;
}

/**
 * Busca un usuario por su ID.
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
export async function findUserById(id) {
  const [rows] = await pool.query(
    "SELECT id, full_name, email, telefono, role_id FROM users WHERE id = ?",
    [id],
  );
  return rows?.[0] || null;
}

/**
 * Busca un usuario por ID con su rol resuelto.
 * @param {number|string} userId
 * @returns {Promise<object|null>} Usuario con { ...user, role: { id, name } }
 */
export async function findUserWithRole(userId) {
  const [rows] = await pool.query(
    "SELECT id, full_name, email, telefono, role_id FROM users WHERE id = ?",
    [userId],
  );
  if (!rows.length) return null;

  const user = rows[0];
  const [roles] = await pool.query(
    "SELECT id, name FROM roles WHERE id = ?",
    [user.role_id],
  );
  return { ...user, role: roles[0] || null };
}

/**
 * Busca un usuario activo por ID con su rol resuelto.
 * @param {number|string} userId
 * @returns {Promise<object|null>}
 */
export async function findActiveUserWithRoleById(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.telefono, r.id AS role_id, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = :userId AND u.is_active = 1
     LIMIT 1`,
    { userId }
  );
  if (!rows.length) return null;
  const u = rows[0];
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    telefono: u.telefono,
    role: { id: u.role_id, name: u.role_name },
  };
}


/**
 * Busca un usuario por email (para verificar existencia antes de registro).
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export async function findUserByEmail(email) {
  const [rows] = await pool.query(
    "SELECT id, full_name, email FROM users WHERE email = ?",
    [email],
  );
  return rows?.[0] || null;
}

/**
 * Busca un usuario por rol.
 * @param {number|string} role_id
 * @returns {Promise<object|null>}
 */
export async function findUserByRoleId(role_id) {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE role_id = ? LIMIT 1",
    [role_id],
  );
  return rows?.[0] || null;
}

/**
 * Actualiza credenciales de un usuario existente.
 * @param {object} params
 * @param {number|string} params.user_id
 * @param {string} params.full_name
 * @param {string} params.email
 * @param {string} params.telefono
 * @param {string} params.password_hash
 * @returns {Promise<void>}
 */
export async function updateUserCredentials({
  user_id,
  full_name,
  email,
  telefono,
  password_hash,
}) {
  await pool.query(
    `UPDATE users
     SET full_name = ?, email = ?, telefono = ?, password_hash = ?, updated_at = NOW()
     WHERE id = ?`,
    [full_name, email, telefono, password_hash, user_id],
  );
}

/**
 * Inserta un nuevo usuario.
 * @param {object} userData — { full_name, email, telefono, password_hash, role_id }
 * @returns {Promise<number>} ID del usuario insertado
 */
export async function insertUser({ full_name, email, telefono, password_hash, role_id }) {
  const [result] = await pool.query(
    `INSERT INTO users (full_name, email, telefono, password_hash, role_id)
     VALUES (?, ?, ?, ?, ?)`,
    [full_name, email, telefono || null, password_hash, role_id],
  );
  return result.insertId;
}
