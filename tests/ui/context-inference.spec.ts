import { test, expect } from "@playwright/test";
test("species and CP infer all four contexts without mandatory controls", async ({
  page,
}) => {
  for (const [species, cp, label] of [
    ["BULBASAUR", "251", "Rocket encounter · Non-weather boosted"],
    ["BULBASAUR", "414", "Rocket encounter · Weather boosted"],
    ["MEWTWO", "2387", "Shadow raid · Non-weather boosted"],
    ["MEWTWO", "2984", "Shadow raid · Weather boosted"],
  ]) {
    await page.goto(`?species=${species}&cp=${cp}&lang=en`);
    await expect(page.locator("[data-encounter]")).toHaveCount(0);
    await expect(page.locator("[data-weather]")).toHaveCount(0);
    await expect(page.locator("#cp-context")).toContainText(label);
    await expect(page.locator(".chance-value")).toHaveText("100%");
  }
  await page.locator("#cp-input").fill("99999");
  await expect(page.locator("#decision h2")).toHaveText(
    "Check your encounter settings",
  );
  await expect(page.locator(".chance-value")).toHaveCount(0);
  await expect(page.locator(".scope-hint")).toContainText(
    "Shadow catch CP only",
  );
  await page.goto("?species=MEWTWO&cp=942&lang=en");
  await expect(page.locator("#decision h2")).toHaveText(
    "Encounter type not supported",
  );
  await expect(page.locator(".chance-value")).toHaveCount(0);
});
test("overlaps clarify only differing chances and preserve common safe conclusions", async ({
  page,
}) => {
  await page.goto("?species=CATERPIE&cp=246&lang=en");
  await expect(page.locator("#decision h2")).toHaveText(
    "Confirm the weather boost",
  );
  await expect(page.locator(".context-chances .chance-value")).toHaveText([
    "75%",
    "0%",
  ]);
  await expect(page.locator("[data-clarify=raid-normal]")).toContainText(
    "Shadow raid · Non-weather boosted",
  );
  await page.locator("[data-clarify=raid-normal]").click();
  await expect(
    page.locator("#decision > .chance-panel .chance-value"),
  ).toHaveText("75%");
  await page.locator("[data-language=ja]").click();
  await expect(
    page.locator("#decision > .chance-panel .chance-value"),
  ).toHaveText("75%");
  await page.goto("?species=MAGIKARP&cp=142&lang=en");
  await expect(page.locator("#decision h2")).toHaveText(
    "Cannot purify to a hundo",
  );
  await expect(
    page.locator("#decision > .chance-panel .chance-value"),
  ).toHaveText("0%");
  await expect(page.locator("[data-clarify]")).toHaveCount(0);
  await page.getByText("Calculation details", { exact: true }).click();
  await expect(page.locator(".context-calculation")).toHaveCount(2);
});
test("Japanese context inference and unsupported-form messaging fit mobile", async ({
  page,
}) => {
  await page.goto("?species=MEWTWO&cp=2984&lang=ja");
  await expect(page.locator("#cp-context")).toContainText(
    "シャドウレイド · 天候ブーストあり",
  );
  await expect(page.locator("[data-encounter]")).toHaveCount(0);
  await expect(page.locator(".chance-value")).toHaveText("100%");
  await page.goto("?species=CATERPIE&cp=246&lang=ja");
  await expect(page.locator(".context-chances .chance-value")).toHaveText([
    "75%",
    "0%",
  ]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("?species=MEWTWO_ARMORED&cp=2387&lang=ja");
  await expect(page.locator("#decision h2")).toHaveText(
    "このすがたはCP早見表で確認",
  );
  await expect(page.locator(".chance-value")).toHaveCount(0);
  await page.goto("?species=MAGIKARP&cp=61&lang=en");
  await page.screenshot({
    path: `qa/${test.info().project.name}-auto-context-en.png`,
    fullPage: true,
  });
  await page.locator("[data-language=ja]").click();
  await page.screenshot({
    path: `qa/${test.info().project.name}-auto-context-ja.png`,
    fullPage: true,
  });
});
