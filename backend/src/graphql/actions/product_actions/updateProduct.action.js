import { pool } from "../../../config/db.js";
import { getProductAction } from "./getProduct.action.js";

export async function updateProductAction(
  id,
  { name, category, description, users_count },
) {
  const updates = [];
  const params = { id };

  if (name !== undefined) {
    updates.push("name = :name");
    params.name = name;
  }
  if (category !== undefined) {
    updates.push("category = :category");
    params.category = category;
  }
  if (users_count !== undefined) {
    updates.push("users_count = :users_count");
    params.users_count = users_count;
  }
  if (description !== undefined) {
    updates.push("description = :description");
    params.description = description;
  }

  if (updates.length > 0) {
    await pool.query(
      `UPDATE products SET ${updates.join(", ")} WHERE id = :id`,
      params,
    );
  }
  return getProductAction(id);
}
