import { countPendingQuoteRequests } from "../../../repositories/quote.repository.js";

export async function getPendingQuoteRequestsCountAction() {
  return await countPendingQuoteRequests();
}