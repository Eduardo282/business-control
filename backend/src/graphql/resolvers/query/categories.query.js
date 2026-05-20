import { listCategoriesAction } from "../../actions/product_actions/listCategories.action.js";

export const productCategories = async (_parent, _args, ctx) => {
  return listCategoriesAction();
};
