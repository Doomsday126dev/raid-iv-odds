import { test, expect } from "@playwright/test";
test("advanced language changes remain selected when returning to main", async ({
  page,
}) => {
  for (const [start, next] of [
    ["en", "ja"],
    ["ja", "en"],
  ] as const) {
    await page.goto(`?lang=${next}`);
    await page.locator(`[data-language=${start}]`).click();
    await page.locator(".disclosure").last().locator("summary").click();
    await page.locator(`a[href="./advanced.html?lang=${start}"]`).click();
    await expect(page.locator("html")).toHaveAttribute("lang", start);
    await page.locator(".settings-drawer summary").click();
    await page.locator(`[data-language-choice=${next}]`).click();
    await expect(page.locator("html")).toHaveAttribute("lang", next);
    await page.locator('a[href="./"]').click();
    await expect(page.locator("html")).toHaveAttribute("lang", next);
    await expect(page.locator(`[data-language=${next}]`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", next);
  }
  await page.evaluate(() => localStorage.setItem("hundo-check-language", "en"));
  await page.goto("advanced.html?lang=ja");
  await page.locator(".settings-drawer summary").click();
  await page.locator("[data-language-choice=ja]").click();
  await page.locator('a[href="./"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
});
