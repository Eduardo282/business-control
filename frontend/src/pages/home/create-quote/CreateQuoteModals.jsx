import EditItemModal from "./EditItemModal";
import ClientSearchModal from "./ClientSearchModal";
import ProductSearchModal from "./ProductSearchModal";
import QuotePreviewModal from "./QuotePreviewModal";

export default function CreateQuoteModals({
  quote,
  editingItemTotals,
  formatCurrency,
  productSearchTable,
  groupedProdResults,
  productTypeFilter,
  setProductTypeFilter,
  totals,
  clampDiscount,
  calculateDiscountedUnitPrice,
}) {
  return (
    <>
      <EditItemModal
        editingItemDraft={quote.editingItemDraft}
        editingItemTotals={editingItemTotals}
        formatCurrency={formatCurrency}
        onClose={() => quote.setEditingItemDraft(null)}
        onApply={quote.applyItemEdit}
        onChangeField={quote.updateEditingItemField}
      />

      <ClientSearchModal
        isOpen={quote.showClientModal}
        clientSearch={quote.clientSearch}
        isClientSearching={quote.isClientSearching}
        clientResults={quote.clientResults}
        visibleClientResults={quote.visibleClientResults}
        onClose={() => quote.setShowClientModal(false)}
        onSearchChange={(value) => {
          quote.setClientSearch(value);
          quote.setSelectedClient(null);
        }}
        onSelectClient={quote.selectClient}
      />

      <ProductSearchModal
        isOpen={quote.showProductModal}
        prodSearch={quote.prodSearch}
        onSearchChange={quote.setProdSearch}
        onClose={quote.closeProductModal}
        productSearchTable={productSearchTable}
        isProductSearching={quote.isProductSearching}
        prodResults={quote.prodResults}
        filteredProductCount={groupedProdResults.length}
        productTypeFilter={productTypeFilter}
        onProductTypeFilterChange={(value) => {
          setProductTypeFilter(value);
          productSearchTable.setPageIndex(0);
        }}
      />

      <QuotePreviewModal
        isOpen={quote.showPreviewModal}
        onClose={() => quote.setShowPreviewModal(false)}
        selectedClient={quote.selectedClient}
        selectedContact={quote.selectedContact}
        folio={quote.folio}
        items={quote.items}
        totals={totals}
        clampDiscount={clampDiscount}
        calculateDiscountedUnitPrice={calculateDiscountedUnitPrice}
        onSave={quote.save}
        loading={quote.loading}
      />
    </>
  );
}
