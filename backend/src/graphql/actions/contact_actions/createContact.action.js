import { pool } from '../../../config/db.js';

export async function createContactAction({ client_id, full_name, email, phone, position_title }) {
  const [result] = await pool.query(
    `INSERT INTO client_contacts (client_id, full_name, email, phone, position_title)
     VALUES (:client_id, :full_name, :email, :phone, :position_title)`,
    {
      client_id,
      full_name,
      email: email || null,
      phone: phone || null,
      position_title: position_title || null,
    }
  );

  return {
    id: result.insertId,
    client_id,
    full_name,
    email: email || null,
    phone: phone || null,
    position_title: position_title || null,
  };
}
