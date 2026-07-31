import React, { memo } from "react";
import { useAuth } from "../../hooks/useAuth";
import QuoteHistoryView from "./quote-history/QuoteHistoryView";
import useQuoteHistoryController from "./quote-history/useQuoteHistoryController";
import useQuoteHistoryTable from "./quote-history/useQuoteHistoryTable";

export { QUOTE_HISTORY_STATUS_OPTIONS } from "./quote-history/quoteHistoryConstants";
export { StatusCell } from "./quote-history/quoteHistoryHelpers";

function QuoteHistory() {
  const { user } = useAuth();
  const controller = useQuoteHistoryController();
  const tableState = useQuoteHistoryTable({
    filteredQuotes: controller.filteredQuotes,
    userRole: user?.role?.name,
    handleStatusChange: controller.handleStatusChange,
    handleDeleteQuote: controller.handleDeleteQuote,
  });

  return (
    <QuoteHistoryView
      controller={controller}
      tableState={tableState}
    />
  );
}

export default memo(QuoteHistory);
