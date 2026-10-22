import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
let server: Server,
  origin: string,
  release: "old" | "new" = "new";
const oldWorker = execFileSync("git", ["show", "5a61d41:public/sw.js"], {
  encoding: "utf8",
});
test.beforeAll(async () => {
  server = createServer((req, res) => {
    const path = new URL(req.url!, "http://local").pathname.replace(
      "/raid-iv-odds/",
      "",
    );
    if (path === "sw.js") {
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "no-cache");
      res.end(release === "old" ? oldWorker : readFileSync("dist/sw.js"));
      return;
    }
    if (release === "old" && (path === "" || path === "index.html")) {
      res.setHeader("Content-Type", "text/html");
      res.end("<!doctype html><title>Old app</title><h1>Old calculator</h1>");
      return;
    }
    try {
      const file = path || "index.html";
      res.setHeader(
        "Content-Type",
        file.endsWith(".html")
          ? "text/html"
          : file.endsWith(".js")
            ? "application/javascript"
            : file.endsWith(".css")
              ? "text/css"
              : file.endsWith(".json")
                ? "application/json"
                : "image/png",
      );
      res.end(readFileSync(resolve("dist", file)));
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const address = server.address();
  origin = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}/raid-iv-odds/`;
});
test.afterAll(() => {
  server.close();
  server.closeAllConnections();
});
async function install(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("./sw.js");
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
}
test("fresh installation opens check, reference and advanced offline", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Playwright WebKit does not implement service workers; native Safari registration is a separate device check.",
  );
  release = "new";
  await page.goto(origin);
  await install(page);
  const assets = await page.evaluate(async () => {
    const key = (await caches.keys()).find((k) =>
      k.startsWith("raid-iv-odds-shell-"),
    )!;
    return (await (await caches.open(key)).keys()).map((r) => r.url);
  });
  expect(assets.some((p) => /assets\/main-.*\.js$/.test(p))).toBe(true);
  await context.setOffline(true);
  await page.goto(`${origin}?species=MAGIKARP&encounter=rocket&cp=61`);
  await expect(page.locator("#decision h2")).toHaveText(
    "Possible purified hundo",
  );
  await page.locator("[data-view=reference]").click();
  await page.locator("#reference-search").fill("Bulbasaur");
  await expect(page.locator("#reference-rows")).toContainText("414");
  await page.locator('[data-language="ja"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("#reference-rows")).toContainText("フシギダネ");
  await expect(page.locator("#reference-rows")).toContainText("414");
  await page.goto(`${origin}advanced.html`);
  await expect(page.locator("#pageTitle")).toHaveText("リトレーン100%個体値の確率");
  await page.locator('.settings-drawer summary').click();
  await page.locator('[data-language-choice=de]').click();
  await expect(page.locator('#pageTitle')).toHaveText('Chance auf ein erlöstes Hundo');
  await page.locator('a[href="./"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.goto(`${origin}?species=MAGIKARP&cp=61&lang=de`);
  await expect(page.locator('#species-search')).toHaveValue('Karpador');
  await expect(page.locator('.chance-value')).toHaveText('80%');
});
test("v8 cache and controller migrate to new build without deleting unrelated caches", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Playwright WebKit does not implement service workers.",
  );
  release = "old";
  await page.goto(origin);
  await expect(page.locator("h1")).toHaveText("Old calculator");
  await install(page);
  await page.evaluate(async () => {
    await caches.open("unrelated-app-cache");
  });
  expect(await page.evaluate(() => caches.keys())).toContain(
    "raid-iv-odds-shell-v8",
  );
  release = "new";
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())!.update();
  });
  await expect
    .poll(() => page.evaluate(() => caches.keys()))
    .not.toContain("raid-iv-odds-shell-v8");
  expect(await page.evaluate(() => caches.keys())).toContain(
    "unrelated-app-cache",
  );
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Purified hundo check");
  await context.setOffline(true);
  await page.goto(`${origin}?species=WEEDLE&encounter=rocket&cp=102`);
  await expect(page.locator("#decision h2")).toHaveText(
    "Every match can purify to a hundo",
  );
});
