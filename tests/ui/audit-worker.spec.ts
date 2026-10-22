import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { resolve, extname } from "node:path";
let server: Server,
  origin: string,
  navigationFailure: number | null = null;
test.beforeAll(async () => {
  server = createServer((req, res) => {
    const path =
      new URL(req.url!, "http://local").pathname.replace(
        "/raid-iv-odds/",
        "",
      ) || "index.html";
    if (navigationFailure && (path === "index.html" || !extname(path))) {
      res
        .writeHead(navigationFailure, { "Content-Type": "text/html" })
        .end("Temporarily unavailable");
      return;
    }
    try {
      const file = resolve("dist", path),
        body = readFileSync(file);
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader(
        "Content-Type",
        (
          {
            ".html": "text/html",
            ".js": "application/javascript",
            ".css": "text/css",
            ".json": "application/json",
            ".webmanifest": "application/manifest+json",
            ".svg": "image/svg+xml",
            ".png": "image/png",
          } as Record<string, string>
        )[extname(file)] || "application/octet-stream",
      );
      // Entry's dynamic UI import can complete after the document load event.
      if (
        path.includes("/main-") &&
        path.endsWith(".js") &&
        body.includes(Buffer.from("#species-search"))
      )
        setTimeout(() => res.end(body), 350);
      else res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const a = server.address();
  origin = `http://audit.localhost:${typeof a === "object" && a ? a.port : 0}/raid-iv-odds/`;
});
test.beforeEach(() => {
  navigationFailure = null;
});
test.afterAll(() => {
  server.close();
  server.closeAllConnections();
});
test("automatic worker registration survives a UI bundle that arrives after load", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Playwright WebKit does not implement service workers.",
  );
  await page.goto(origin + "?species=MAGIKARP&cp=61&lang=ja");
  await expect(page.locator(".chance-value")).toHaveText("80%");
  expect(await page.evaluate(() => isSecureContext)).toBe(true);
  expect(await page.evaluate(() => document.readyState)).toBe("complete");
  await expect
    .poll(
      () =>
        page.evaluate(async () =>
          Boolean((await navigator.serviceWorker.getRegistration())?.active),
        ),
      { timeout: 10000 },
    )
    .toBe(true);
});
test("installed shell handles a transient navigation503 without losing the calculator", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Playwright WebKit does not implement service workers.",
  );
  await page.goto(origin + "?species=MAGIKARP&cp=61&lang=ja");
  await expect(page.locator(".chance-value")).toHaveText("80%");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("./sw.js");
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  navigationFailure = 503;
  await page.reload();
  await expect(page.locator(".chance-value")).toHaveText("80%");
  await expect(page.locator("#species-search")).toHaveValue("コイキング");
  navigationFailure = 404;
  const missing = await page.reload();
  expect(missing?.status()).toBe(404);
  await expect(page.locator(".chance-value")).toHaveCount(0);
});
