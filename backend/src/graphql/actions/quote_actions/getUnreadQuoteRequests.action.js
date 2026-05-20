import { findUnreadQuoteRequests } from "../../../repositories/quote.repository.js";

export async function getUnreadQuoteRequestsAction() {
  return await findUnreadQuoteRequests();
}
