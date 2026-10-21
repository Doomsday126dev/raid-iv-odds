import { defineConfig } from "vite";

export default defineConfig({
  appType: "spa",
  base: "/raid-iv-odds/",
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: { input: { main: "index.html", advanced: "advanced.html" } },
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
