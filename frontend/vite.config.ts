import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// El proxy reenvía /api al backend en desarrollo, así el
// frontend nunca necesita conocer la URL completa del backend.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
