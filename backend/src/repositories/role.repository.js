/**
 * RoleRepository — Puerto de datos para la entidad Role.
 * Centraliza TODAS las consultas SQL de roles.
 */
import { pool } from "../config/db.js";

/**
 * Lista todos los roles.
 * @returns {Promise<object[]>}
 */
export async function listRoles() {
  const [rows] = await pool.query("SELECT * FROM roles ORDER BY name ASC");
  return rows;
}

/**
 * Busca un rol por ID.
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
export async function findRoleById(id) {
  const [rows] = await pool.query("SELECT * FROM roles WHERE id = ?", [id]);
  return rows?.[0] || null;
}

/**
 * Busca un rol por nombre.
 * @param {string} name
 * @returns {Promise<object|null>}
 */
export async function findRoleByName(name) {
  const [rows] = await pool.query(
    "SELECT id, name FROM roles WHERE name = ? LIMIT 1",
    [name],
  );
  return rows?.[0] || null;
}

/**
 * Inserta un nuevo rol.
 * @param {string} name
 * @returns {Promise<number>} ID del rol creado
 */
export async function insertRole(name) {
  const [result] = await pool.query("INSERT INTO roles (name) VALUES (?)", [name]);
  return result.insertId;
}

/**
 * Elimina un rol por ID.
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export async function deleteRole(id) {
  await pool.query("DELETE FROM roles WHERE id = ?", [id]);
}

/**
 * Lista todos los roles ordenados por ID.
 * @returns {Promise<object[]>}
 */
export async function listRolesOrderedById() {
  const [rows] = await pool.query("SELECT id, name FROM roles ORDER BY id ASC");
  return rows;
}

