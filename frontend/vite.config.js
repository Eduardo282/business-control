import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@icons": fileURLToPath(
        new URL("./src/components/ui/FlatIcons.jsx", import.meta.url),
      ),
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
});
