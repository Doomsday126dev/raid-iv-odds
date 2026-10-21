import { chromium, webkit } from "playwright";
import { expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
const root = new URL("./refinement/", import.meta.url),
  reports = [];
for (const engine of ["chrome", "webkit"]) {
  const browser = await (engine === "chrome" ? chromium : webkit).launch(
    engine === "chrome" ? { channel: "chrome" } : {},
  );
  const page = await browser.newPage({ hasTouch: true });
  for (const lang of ["en", "ja"])
    for (const mode of ["reference", "modal"])
      for (const variant of ["before", "dotted", "label"]) {
        const theme = mode === "modal" ? "dark" : "light",
          file = `${variant}-${mode}-${lang}-${theme}`;
        await page.setViewportSize(
          mode === "reference"
            ? { width: 1440, height: 1000 }
            : { width: 390, height: 844 },
        );
        await page.goto(new URL(file + ".html", root).href);
        if (variant !== "before") {
          await expect(page.locator(".collision-icon")).toHaveCount(0);
          if (mode === "modal") {
            await expect(page.locator(".reference-ivs thead th")).toHaveCount(
              3,
            );
            await expect(page.locator(".reference-ivs tbody tr")).toHaveCount(
              4,
            );
            await expect(
              page.locator(".reference-assumptions"),
            ).not.toHaveAttribute("open");
            await expect(page.locator(".combination-count")).toContainText("4");
            expect(
              await page
                .locator("#reference-dialog")
                .evaluate((e) => e.scrollWidth <= e.clientWidth),
            ).toBe(true);
            await page.locator(".reference-assumptions summary").click();
            await expect(
              page.locator(".reference-assumptions"),
            ).toHaveAttribute("open", "");
            await page.locator(".reference-assumptions summary").click();
          } else {
            for (const group of ["rocket", "raid"])
              for (const boosted of ["false", "true"]) {
                const edges = await page
                  .locator(
                    `[data-cp-group=${group}][data-cp-boosted=${boosted}] .cp-value`,
                  )
                  .evaluateAll((els) =>
                    els.map((e) => e.getBoundingClientRect().right),
                  );
                expect(Math.max(...edges) - Math.min(...edges)).toBeLessThan(
                  0.2,
                );
              }
            const cell = page
              .locator(".cp-reference[data-ambiguous=true]")
              .first();
            await cell.focus();
            await expect(cell.locator("[role=tooltip]")).toBeVisible();
            await cell.click();
            await expect(page.locator("#reference-dialog")).toBeVisible();
            await expect(
              page.locator("#reference-dialog-content"),
            ).toContainText(lang === "en" ? "IV spreads" : "個体値");
            await page.keyboard.press("Escape");
          }
        }
        if (engine === "chrome") {
          await page
            .locator("body")
            .click({ position: { x: 5, y: 5 }, force: true });
          await page.screenshot({
            path: fileURLToPath(new URL(file + ".png", root)),
            fullPage: true,
          });
          await page
            .locator(
              mode === "reference" ? ".reference-table" : "#reference-dialog",
            )
            .screenshot({
              path: fileURLToPath(new URL(file + "-crop.png", root)),
            });
          if (mode === "modal") {
            await page.evaluate(
              () => (document.documentElement.dataset.theme = "light"),
            );
            await page
              .locator("#reference-dialog")
              .screenshot({
                path: fileURLToPath(
                  new URL(`${variant}-modal-${lang}-light-crop.png`, root),
                ),
              });
            await page.evaluate(
              () => (document.documentElement.dataset.theme = "dark"),
            );
          }
        }
        if (variant !== "before" && mode === "reference") {
          await page.setViewportSize({ width: 320, height: 800 });
          for (const theme of ["light", "dark"]) {
            await page.evaluate(
              (theme) => (document.documentElement.dataset.theme = theme),
              theme,
            );
            expect(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
            ).toBe(true);
            const cells = page.locator(
              ".reference-table[data-mode=rocket] td[data-reference-group=rocket]",
            );
            for (const cell of await cells.all())
              expect(
                await cell.evaluate((e) => e.scrollWidth <= e.clientWidth),
              ).toBe(true);
            const ambiguous = page
              .locator(
                ".cp-reference[data-cp-group=rocket][data-ambiguous=true]",
              )
              .first();
            await ambiguous.tap();
            await expect(page.locator("#reference-dialog")).toBeVisible();
            await page.locator("#reference-dialog-close").tap();
          }
          if (engine === "chrome")
            await page
              .locator(".reference-table")
              .screenshot({
                path: fileURLToPath(
                  new URL(`${variant}-table-mobile-${lang}-dark.png`, root),
                ),
              });
        }
        reports.push({ engine, lang, mode, variant, status: "passed" });
      }
  await browser.close();
}
writeFileSync(
  new URL("verification.json", root),
  JSON.stringify(reports, null, 2),
);
console.log(`${reports.length} static-preview checks passed`);
