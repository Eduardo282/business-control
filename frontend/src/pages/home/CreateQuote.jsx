import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  calculateDiscountedUnitPrice,
  calculateQuotePricing,
  normalizeDiscount,
} from "@shared/quotePricingRules.js";
import {
  formatCurrency,
  formatDateTime,
  getQuoteStatusLabel,
} from "../../utils/formatters";
import GeneratedQuoteView from "./create-quote/GeneratedQuoteView";
import QuoteClientPanel from "./create-quote/QuoteClientPanel";
import QuoteEntryToolbar from "./create-quote/QuoteEntryToolbar";
import QuoteItemsTable from "./create-quote/QuoteItemsTable";
import CreateQuoteModals from "./create-quote/CreateQuoteModals";
import { useCreateQuote } from "./create-quote/hooks/useCreateQuote";
import { useCreateQuoteTables } from "./create-quote/hooks/useCreateQuoteTables";

export {
  formatQuoteProductVariantOption,
  groupQuoteProductResults,
} from "./create-quote/productGrouping";
export { default as QuoteProductVariantSelect } from "./create-quote/QuoteProductVariantSelect";

const clampDiscount = normalizeDiscount;

export default function CreateQuote() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fixedClientId = searchParams.get("client_id");
  const [productTypeFilter, setProductTypeFilter] = useState("");
  const [selectedProductByGroup, setSelectedProductByGroup] = useState({});
  const quote = useCreateQuote(navigate);

  const { groupedProdResults, itemsTable, productSearchTable } =
    useCreateQuoteTables({
      items: quote.items,
      setItems: quote.setItems,
      tableFilter: quote.tableFilter,
      setTableFilter: quote.setTableFilter,
      tableSorting: quote.tableSorting,
      setTableSorting: quote.setTableSorting,
      tableFilters: quote.tableFilters,
      openEditItem: quote.openEditItem,
      removeItem: quote.removeItem,
      prodResults: quote.prodResults,
      productTypeFilter,
      selectedProductByGroup,
      setSelectedProductByGroup,
      justAdded: quote.justAdded,
      addItemDirectly: quote.addItemDirectly,
      removeItemDirectly: quote.removeItemDirectly,
    });

  const quoteTotals = useMemo(
    () => calculateQuotePricing({ items: quote.items }),
    [quote.items],
  );
  const totals = {
    grossSubtotal: quoteTotals.grossSubtotal,
    totalDiscount: quoteTotals.totalDiscount,
    grandTotal: quoteTotals.subtotal,
    ivaTotal: quoteTotals.iva,
    totalWithIva: quoteTotals.total,
  };
  const editingItemTotals = useMemo(
    () =>
      quote.editingItemDraft ?
        calculateQuotePricing({ items: [quote.editingItemDraft] })
      : null,
    [quote.editingItemDraft],
  );

  if (quote.generatedQuote) {
    return (
      <GeneratedQuoteView
        generatedQuote={quote.generatedQuote}
        formatCurrency={formatCurrency}
        formatDateTime={formatDateTime}
        getQuoteStatusLabel={getQuoteStatusLabel}
        navigate={navigate}
        startNewQuote={quote.startNewQuote}
        clampDiscount={clampDiscount}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {quote.error && (
        <div className="text-sm text-light-error dark:text-red-400 bg-light-error/10 dark:bg-red-500/10 p-3 rounded-xl border border-light-error/20 dark:border-red-500/20 animate-fade-in">
          {quote.error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <QuoteClientPanel
          fixedClientId={fixedClientId}
          selectedClient={quote.selectedClient}
          clientSearch={quote.clientSearch}
          setClientSearch={quote.setClientSearch}
          setSelectedClient={quote.setSelectedClient}
          selectedContactId={quote.selectedContactId}
          setSelectedContactId={quote.setSelectedContactId}
          setShowClientModal={quote.setShowClientModal}
          resetClientData={quote.resetClientData}
          items={quote.items}
          loading={quote.loading}
          ensureQuoteFolio={quote.ensureQuoteFolio}
          setShowPreviewModal={quote.setShowPreviewModal}
        />

        <div className="lg:col-span-2 space-y-6">
          <QuoteEntryToolbar
            items={quote.items}
            resetItemsData={quote.resetItemsData}
            navigate={navigate}
            prodSearch={quote.prodSearch}
            setProdSearch={quote.setProdSearch}
            setShowProductModal={quote.setShowProductModal}
            tableFilter={quote.tableFilter}
            setTableFilter={quote.setTableFilter}
          />

          <QuoteItemsTable
            selectedClient={quote.selectedClient}
            items={quote.items}
            itemsTable={itemsTable}
            showTableFilters={quote.showTableFilters}
            setShowTableFilters={quote.setShowTableFilters}
            tableFilters={quote.tableFilters}
            activeTableFilterPickerField={
              quote.activeTableFilterPickerField
            }
            tableFilterPickerSearch={quote.tableFilterPickerSearch}
            setTableFilterPickerSearch={quote.setTableFilterPickerSearch}
            activeTableFilterCount={quote.activeTableFilterCount}
            openTableFilterPicker={quote.openTableFilterPicker}
            closeTableFilterPicker={quote.closeTableFilterPicker}
            applyTableFilterValue={quote.applyTableFilterValue}
            clearTableFilters={quote.clearTableFilters}
            visibleTableFilterPickerOptions={
              quote.visibleTableFilterPickerOptions
            }
          />
        </div>
      </div>

      <CreateQuoteModals
        quote={quote}
        editingItemTotals={editingItemTotals}
        formatCurrency={formatCurrency}
        productSearchTable={productSearchTable}
        groupedProdResults={groupedProdResults}
        productTypeFilter={productTypeFilter}
        setProductTypeFilter={setProductTypeFilter}
        totals={totals}
        clampDiscount={clampDiscount}
        calculateDiscountedUnitPrice={calculateDiscountedUnitPrice}
      />
    </div>
  );
}
