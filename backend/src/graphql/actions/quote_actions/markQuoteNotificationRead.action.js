import { markQuoteNotificationAsRead } from "../../../repositories/quote.repository.js";

export const markQuoteNotificationReadAction = async (id) => {
  const affected = await markQuoteNotificationAsRead(id);
  return affected > 0;
};
