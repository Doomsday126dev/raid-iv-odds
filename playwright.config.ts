import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/ui",
  reporter: "list",
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173/raid-iv-odds/" },
  projects: [
    {
      name: "webkit",
      use: { browserName: "webkit", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "webkit-mobile",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
    {
      name: "desktop",
      use: { channel: "chrome", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        channel: "chrome",
      },
    },
  ],
});
