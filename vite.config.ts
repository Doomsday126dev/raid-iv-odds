import { defineConfig } from "vite";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, relative } from "node:path";

export default defineConfig({
  appType: "spa",
  plugins: [
    {
      name: "offline-build-manifest",
      apply: "build",
      closeBundle() {
        const root = resolve("dist");
        const files = readdirSync(root, {
          recursive: true,
          withFileTypes: true,
        })
          .filter((entry) => entry.isFile())
          .map((entry) =>
            relative(root, resolve(entry.parentPath, entry.name)).replaceAll(
              "\\",
              "/",
            ),
          )
          .filter((path) => !path.endsWith(".map") && path !== "sw.js")
          .sort();
        const hash = createHash("sha256");
        for (const file of files)
          hash.update(file).update(readFileSync(resolve(root, file)));
        const source = readFileSync("public/sw.js", "utf8")
          .replace("__BUILD_ID__", hash.digest("hex").slice(0, 16))
          .replace(
            "__BUILD_FILES__",
            JSON.stringify(["/", ...files.map((file) => `/${file}`)]),
          );
        writeFileSync(resolve(root, "sw.js"), source);
      },
    },
  ],
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
