import { updateProduct, findProductById } from "../../../repositories/product.repository.js";

export async function updateProductAction(
  id,
  { name, category, description, users_count },
) {
  const fields = {};

  if (name !== undefined) fields.name = name;
  if (category !== undefined) fields.category = category;
  if (users_count !== undefined) fields.users_count = users_count;
  if (description !== undefined) fields.description = description;

  if (Object.keys(fields).length > 0) {
    await updateProduct(id, fields);
  }

  return await findProductById(id);
}
