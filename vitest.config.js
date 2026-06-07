import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["frontend/src/**/*.{test,spec}.{js,jsx}"],
    setupFiles: ["./frontend/src/test/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage/frontend",
      include: [
        "frontend/src/components/ui/Button.jsx",
        "frontend/src/components/ui/Card.jsx",
        "frontend/src/components/ui/Input.jsx",
        "frontend/src/pages/home/clients/ClientCreateModal.jsx",
        "frontend/src/pages/home/clients/ClientFilterPicker.jsx",
        "frontend/src/pages/home/create-quote/ClientSearchModal.jsx",
        "frontend/src/pages/home/create-quote/EditItemModal.jsx",
        "frontend/src/pages/home/create-quote/ProductSearchModal.jsx",
        "frontend/src/pages/home/create-quote/QuotePreviewModal.jsx",
        "frontend/src/pages/home/quotes/EmailQuoteModal.jsx",
        "frontend/src/pages/home/registrar-products/CategoryManagerModal.jsx",
        "frontend/src/pages/home/registrar-products/ProductSelectorModal.jsx",
        "frontend/src/pages/home/registrar-products/SourceSelectionModal.jsx",
        "frontend/src/utils/formatters.js",
        "frontend/src/utils/graphqlClient.js",
      ],
      exclude: [
        "frontend/src/main.jsx",
        "frontend/src/**/*.test.{js,jsx}",
        "frontend/src/test/**",
      ],
      thresholds: {
        statements: 90,
        branches: 70,
        functions: 75,
        lines: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@icons": fileURLToPath(
        new URL("./frontend/src/components/ui/FlatIcons.jsx", import.meta.url),
      ),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
});
