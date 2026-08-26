import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { VitePWA } from "vite-plugin-pwa";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);

function versionToCode(version) {
  const [major = "0", minor = "0", patch = "0"] = String(version)
    .split("-")[0]
    .split(".");
  return String(Number(major) * 10000 + Number(minor) * 100 + Number(patch));
}

const appVersion = pkg.version || "1.0.0";
const appVersionCode = pkg.versionCode || versionToCode(appVersion);

export default defineConfig({
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    "import.meta.env.VITE_APP_VERSION_CODE": JSON.stringify(appVersionCode),
    "import.meta.env.VITE_APP_BUILD_DATE": JSON.stringify(
      new Date().toISOString().split("T")[0]
    ),
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.js"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "Milc",
        short_name: "Milc",
        description: "Milc livestock management app",
        theme_color: "#1a8898",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache" },
          },
        ],
      },
    }),
  ],
  server: {
    open: true,
  },
});
