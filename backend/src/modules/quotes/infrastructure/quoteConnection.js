import { pool } from "../../../config/db.js";

export function getConnection() {
  return pool.getConnection();
}
