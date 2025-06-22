import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Rule 1: Most specific routes go first.
      // Requests to /api/products are sent to the catalog-service.
      "/api/products": {
        target: "http://catalog-service:8082",
        changeOrigin: true,
      },
      // Rule 2: More general routes go last.
      // Any other request starting with /api is sent to the user-service.
      "/api": {
        target: "http://user-service:8081",
        changeOrigin: true,
      },
    },
  },
});
