import { clearPriceHistory } from "../../../repositories/product.repository.js";

export async function clearProductPriceHistoryAction(productId) {
  await clearPriceHistory(productId);
  return true;
}
