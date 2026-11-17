import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_CENTRAL_URL || "http://localhost:3000",
        changeOrigin: true,
      },
      "/banners": {
        target: process.env.VITE_CENTRAL_URL || "http://localhost:3000",
        changeOrigin: true,
      },
      "/uploads": {
        target: process.env.VITE_CENTRAL_URL || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
