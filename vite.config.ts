import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    sourcemap: false,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ["leaflet"],
          exifr: ["exifr"],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
