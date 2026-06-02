import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          if (!normalizedId.includes("node_modules")) return undefined;
          if (
            normalizedId.includes("/react/") ||
            normalizedId.includes("/react-dom/") ||
            normalizedId.includes("/react-router-dom/")
          ) {
            return "react-vendor";
          }
          if (normalizedId.includes("/xlsx/")) return "xlsx";
          if (normalizedId.includes("/jspdf/") || normalizedId.includes("/jspdf-autotable/")) {
            return "pdf-export";
          }
          if (normalizedId.includes("/html2canvas/")) return "canvas-export";
          if (normalizedId.includes("/@tanstack/")) return "table-vendor";
          if (normalizedId.includes("/sweetalert2/")) return "alerts";
          if (normalizedId.includes("/date-fns/")) return "date-utils";
          return undefined;
        },
      },
    },
  },
  server: {
    fs: {
      allow: [
        fileURLToPath(new URL(".", import.meta.url)),
        fileURLToPath(new URL("..", import.meta.url)),
      ],
    },
  },
  resolve: {
    alias: {
      "@icons": fileURLToPath(
        new URL("./src/components/ui/FlatIcons.jsx", import.meta.url),
      ),
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
});
