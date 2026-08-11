import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.NEXT_PUBLIC_HUD_CANARY": JSON.stringify("bedelta-stealth"),
  },
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: path.resolve(rootDir, "index.html"),
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8789",
        changeOrigin: true,
      },
    },
  },
});