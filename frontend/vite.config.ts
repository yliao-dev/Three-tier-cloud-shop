import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 1: Most specific routes go first.
      "/api/products": {
        target: "http://catalog-service:8082",
        changeOrigin: true,
      },

      "/api/cart": {
        target: "http://cart-service:8083",
        changeOrigin: true,
      },

      //2: More general routes go last.
      // Any other request starting with /api is sent to the user-service.
      "/api": {
        target: "http://user-service:8081",
        changeOrigin: true,
      },
    },
  },
});
