import { listCategoriesAction } from "../../../modules/products/productActions.js";

export const productCategories = async (_parent, _args, ctx) => {
  return listCategoriesAction();
};
