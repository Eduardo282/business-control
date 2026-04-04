import { pool } from "../../../config/db.js";

export const markQuoteNotificationReadAction = async (id) => {
  const [res] = await pool.query(
    "UPDATE quotes SET notification_read = 1 WHERE id = ?",
    [id],
  );
  return res.affectedRows > 0;
};
