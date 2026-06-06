import { pool } from "../../../config/db.js";
import {
  findProductById,
  findProductByIdLean,
  insertProductUpdateHistory,
  updateProduct,
} from "../../../repositories/product.repository.js";

const PRODUCT_FIELD_LABELS = {
  name: "nombre",
  category: "categoría",
  users_count: "usuarios",
  description: "descripción",
};

function buildProductUpdateSummary(fields) {
  const labels = Object.keys(fields)
    .map((key) => PRODUCT_FIELD_LABELS[key] || key)
    .join(", ");

  return labels ? `Datos editados: ${labels}` : "Datos del producto editados";
}

export async function updateProductAction(
  id,
  { name, category, description, users_count },
) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const current = await findProductByIdLean(id, conn);
    if (!current) throw new Error("Producto no encontrado");

    const fields = {};

    if (name !== undefined && String(current.name ?? "") !== String(name ?? "")) {
      fields.name = name;
    }
    if (category !== undefined && String(current.category ?? "") !== String(category ?? "")) {
      fields.category = category;
    }
    if (
      users_count !== undefined &&
      Number(current.users_count || 0) !== Number(users_count || 0)
    ) {
      fields.users_count = users_count;
    }
    if (
      description !== undefined &&
      String(current.description ?? "") !== String(description ?? "")
    ) {
      fields.description = description;
    }

    if (Object.keys(fields).length > 0) {
      await updateProduct(id, fields, conn, { bumpRevision: true });
      const updated = await findProductByIdLean(id, conn);
      await insertProductUpdateHistory(
        {
          product_id: id,
          update_version: updated.update_version,
          change_type: "DETAILS",
          summary: buildProductUpdateSummary(fields),
        },
        conn,
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  return await findProductById(id);
}
