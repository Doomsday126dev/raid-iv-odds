import { test, expect } from "@playwright/test";
test("Japanese IME confirmation does not commit a suggested species or clear CP", async ({
  page,
}) => {
  for (const event of [
    { key: "Enter", isComposing: true },
    { key: "Enter", keyCode: 229 },
  ]) {
    await page.goto("?species=MAGIKARP&cp=61&lang=ja");
    await page.locator("#species-search").fill("ガラル");
    await page.locator("#species-search").dispatchEvent("keydown", event);
    await expect(page.locator("#species-search")).toHaveValue("ガラル");
    await expect(page.locator("#cp-input")).toHaveValue("61");
    await page.locator("#species-search").dispatchEvent("keydown", {
      key: "Enter",
      isComposing: false,
      keyCode: 13,
    });
    await expect(page.locator("#species-search")).toHaveValue(
      "ニャース（ガラルのすがた）",
    );
    await expect(page.locator("#cp-input")).toHaveValue("");
  }
});
test("species combobox has one Tab stop with keyboard options still selectable", async ({
  page,
}) => {
  await page.goto("?lang=en");
  await page.locator("#species-search").fill("Bulba");
  await page.keyboard.press("Tab");
  await expect(page.locator("#cp-input")).toBeFocused();
  await expect(page.locator("#species-list")).toBeHidden();
  await page.locator("#species-search").focus();
  await page.locator("#species-search").fill("Bulba");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator("#species-search")).toHaveValue("Bulbasaur");
});
test("unknown or uncommitted and reference-only species never claim an inferred context", async ({
  page,
}) => {
  await page.goto("?species=UNKNOWN&cp=2387&lang=ja");
  await expect(page.locator("#cp-context")).toBeHidden();
  await expect(page.locator("#cp-input")).toHaveAccessibleDescription("");
  await expect(page.locator(".chance-value")).toHaveCount(0);
  await page.goto("?species=MEWTWO_ARMORED&cp=1821&lang=en");
  await expect(page.locator("#cp-context")).toBeHidden();
  await expect(page.locator("#cp-input")).toHaveAccessibleDescription("");
  await expect(page.locator(".chance-value")).toHaveCount(0);
  await page.goto("?species=MEWTWO&cp=2387&lang=en");
  await expect(page.locator("#cp-context")).toContainText("Shadow raid");
  await page.locator("#species-search").fill("Gira");
  await expect(page.locator("#cp-context")).toBeHidden();
  await expect(page.locator("#cp-input")).toHaveAccessibleDescription("");
});
test("fullwidth Japanese CP digits preserve exact odds and canonical shared links", async ({
  page,
}, info) => {
  await page.goto("?species=MAGIKARP&cp=６１&lang=ja");
  await expect(page.locator(".chance-value")).toHaveText("80%");
  await expect(page).toHaveURL(/cp=61/);
  await page.screenshot({
    path: `qa/audit-${info.project.name}-ja-fullwidth.png`,
    fullPage: true,
  });
  await page.locator("#cp-input").fill("６1");
  await expect(page.locator(".chance-value")).toHaveText("80%");
  expect(
    await page
      .locator("#cp-input")
      .evaluate((e: HTMLInputElement) => e.validity.patternMismatch),
  ).toBe(false);
  await expect(page.locator("#cp-input")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  await page.locator("#cp-input").fill("６１.５");
  await expect(page.locator(".chance-value")).toHaveCount(0);
});
