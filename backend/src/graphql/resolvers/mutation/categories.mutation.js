import { requireRoles } from "../../../middlewares/role.middleware.js";
import { createCategoryAction } from "../../actions/product_actions/createCategory.action.js";
import { deleteCategoryAction } from "../../actions/product_actions/deleteCategory.action.js";

export const createCategory = async (_parent, { name }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return createCategoryAction(name);
};

export const deleteCategory = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return deleteCategoryAction(id);
};
