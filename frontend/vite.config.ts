import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Any request starting with /api will be proxied
      "/api": {
        // Forward the request to our user-service container
        // We use the service name 'user-service' from docker-compose.yaml
        target: "http://user-service:8081",
        changeOrigin: true,
      },
      // Requests to /api/products... go to the catalog-service on port 8082
      "/api/products": {
        target: "http://catalog-service:8082",
        changeOrigin: true,
      },
    },
  },
});
