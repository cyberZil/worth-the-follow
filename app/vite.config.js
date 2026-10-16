import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: here,
  base: process.env.VITE_BASE_PATH || "/",
  resolve: {
    alias: { "@importers": resolve(here, "../importers") },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "InfluencerCheck — Worth the Follow",
        short_name: "Worth the Follow",
        description: "Audit who you follow against your own values. Everything stays on your device.",
        theme_color: "#1b1a17",
        background_color: "#f6f1e8",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,json}"] },
    }),
  ],
  build: { outDir: resolve(here, "dist"), emptyOutDir: true },
});
