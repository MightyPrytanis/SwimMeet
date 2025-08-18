import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Minimal Vite config without Replit plugins to test if they're causing the issue
export default defineConfig({
  plugins: [
    react({
      // Explicit React plugin configuration
      jsxImportSource: undefined,
      babel: undefined,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true, // Enable source maps for debugging
  },
  esbuild: {
    jsx: 'automatic', // Ensure proper JSX transformation
  },
  server: {
    fs: {
      strict: false, // Less restrictive file system access
    },
  },
});