import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const readSource = (relativePath) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const readFeatureSource = (paths) =>
  paths.map((path) => readSource(path)).join("\n");

const clientsSource = readFeatureSource([
  "./Clients.jsx",
  "./clients/ClientsDetailsBar.jsx",
  "./clients/ClientsPagination.jsx",
  "./clients/ClientsTable.jsx",
  "./clients/ClientsToolbar.jsx",
  "./clients/ClientsView.jsx",
  "./clients/clientTableColumns.jsx",
]);
const clientDetailSource = readFeatureSource([
  "./ClientDetail.jsx",
  "./client-detail/ClientDetailHeader.jsx",
  "./client-detail/ClientDetailView.jsx",
  "./client-detail/ClientGeneralDetails.jsx",
  "./client-detail/ContactCreateForm.jsx",
  "./client-detail/ContactPagination.jsx",
  "./client-detail/ContactTable.jsx",
  "./client-detail/ContactsPanel.jsx",
  "./client-detail/ContactsToolbar.jsx",
  "./client-detail/DisabledContactsTable.jsx",
  "./client-detail/useContactTableColumns.jsx",
]);
const registrarProductsSource = readFeatureSource([
  "./RegistrarProducts.jsx",
  "./registrar-products/RegisterProductForm.jsx",
  "./registrar-products/RegistrarProductModals.jsx",
]);
const productsSource = readFeatureSource([
  "./Products.jsx",
  "./products/FolioSelectionModal.jsx",
  "./products/productColumns.jsx",
  "./products/ProductsPagination.jsx",
  "./products/ProductsTable.jsx",
  "./products/ProductsToolbar.jsx",
  "./products/ProductsView.jsx",
]);

const quoteHistorySource = readFeatureSource([
  "./QuoteHistory.jsx",
  "./quote-history/quoteHistoryColumns.jsx",
  "./quote-history/quoteHistoryConstants.js",
  "./quote-history/quoteHistoryHelpers.jsx",
  "./quote-history/QuoteHistoryTable.jsx",
  "./quote-history/QuoteHistoryToolbar.jsx",
  "./quote-history/QuoteHistoryView.jsx",
]);

const productDetailFeatureSource = readFeatureSource([
  "./ProductDetail.jsx",
  "./product-detail/productDetailHelpers.jsx",
  "./product-detail/ProductDetailView.jsx",
]);

const policiesFeatureSource = readFeatureSource([
  "./Policies.jsx",
  "./policies/policiesHelpers.jsx",
  "./policies/policiesColumns.jsx",
  "./policies/PoliciesView.jsx",
]);

const ownedSources = [
  "./AgentSupport.jsx",
  "./Home.jsx",
  "./clients/ClientBulkModal.jsx",
  "./clients/ClientCreateModal.jsx",
  "./clients/ClientEditModal.jsx",
  "./clients/ClientFilterPicker.jsx",
  "./client-detail/ClientPoliciesTab.jsx",
  "./client-detail/ManagePortalModal.jsx",
  "./client-detail/ServicesSection.jsx",
  "./registrar-products/CategoryManagerModal.jsx",
  "./registrar-products/ProductSelectorModal.jsx",
  "./registrar-products/SourceSelectionModal.jsx",
].map((path) => [path, readSource(path)]);

ownedSources.push(
  ["Clients feature", clientsSource],
  ["ClientDetail feature", clientDetailSource],
  ["RegistrarProducts feature", registrarProductsSource],
  ["Products feature", productsSource],
  ["QuoteHistory feature", quoteHistorySource],
  ["ProductDetail feature", productDetailFeatureSource],
  ["Policies feature", policiesFeatureSource],
);

describe("ADMIN/HOME theme class contracts", () => {
  it("keeps every owned workflow explicitly dark-theme aware", () => {
    for (const [path, source] of ownedSources) {
      expect(source, path).toContain("dark:");
      expect(source, path).not.toMatch(
        /dark:(?:bg|border|text|hover:bg|hover:border)-dark-[1-6]00/,
      );
    }
  });

  it("pairs selected filter surfaces and inverse count chips", () => {
    for (const path of [
      "./clients/ClientFilterPicker.jsx",
      "./client-detail/ClientPoliciesTab.jsx",
      "./registrar-products/CategoryManagerModal.jsx",
      "./products/ProductsTable.jsx",
    ]) {
      const source = readSource(path);
      expect(source, path).toContain("dark:bg-blue-500/10");
      expect(source, path).toContain("dark:text-blue-300");
    }

    expect(clientsSource, "Clients feature").toContain(
      "dark:bg-blue-200 dark:text-blue-950",
    );
    expect(clientDetailSource, "ClientDetail feature").toContain(
      "dark:bg-blue-200 dark:text-blue-950",
    );

    for (const path of [
      "./client-detail/ClientPoliciesTab.jsx",
      "./products/ProductsToolbar.jsx",
    ]) {
      expect(readSource(path), path).toContain(
        "dark:bg-blue-200 dark:text-blue-950",
      );
    }
  });

  it("guards the known component-specific regressions", () => {
    const agentSupport = readSource("./AgentSupport.jsx");
    expect(agentSupport).not.toContain('color="black"');
    expect(agentSupport).not.toContain("scrollbarColor:");
    expect(agentSupport).toContain("dark:[scrollbar-color:#52525b_transparent]");

    expect(clientDetailSource).toContain(
      "text-[#52525b] dark:text-zinc-300",
    );
    expect(clientDetailSource).toContain(
      "dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
    );

    const managePortal = readSource("./client-detail/ManagePortalModal.jsx");
    expect(managePortal).toContain(
      "bg-zinc-50/50 dark:bg-dark-900/60",
    );

    expect(productDetailFeatureSource).toMatch(
      /<textarea[\s\S]*?bg-white dark:bg-dark-900[\s\S]*?dark:placeholder:text-zinc-500/,
    );

    expect(registrarProductsSource).not.toContain("text-[#00]");
    expect(
      registrarProductsSource.match(
        /text-\[#2277B4\] dark:text-blue-300 hover:bg-\[#dcecff\] dark:hover:bg-zinc-700/g,
      ),
    ).toHaveLength(4);

    const productSelector = readSource(
      "./registrar-products/ProductSelectorModal.jsx",
    );
    expect(productSelector).toContain(
      "dark:text-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/30",
    );
    expect(productSelector).toContain(
      "dark:text-blue-300 dark:bg-blue-500/15 dark:border-blue-500/30",
    );
  });
});
