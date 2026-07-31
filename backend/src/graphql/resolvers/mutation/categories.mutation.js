import { requireRoles } from "../../../middlewares/role.middleware.js";
import { assignCategoryTypeAction } from "../../../modules/products/productActions.js";
import { createCategoryAction } from "../../../modules/products/productActions.js";
import { deleteCategoryAction } from "../../../modules/products/productActions.js";

export const createCategory = async (_parent, { name }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return createCategoryAction(name);
};

export const deleteCategory = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return deleteCategoryAction(id);
};

export const assignCategoryType = async (_parent, { name, product_type }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return assignCategoryTypeAction(name, product_type);
};
