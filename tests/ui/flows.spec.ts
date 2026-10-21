import { test, expect } from "@playwright/test";
test("primary check handles mixed, impossible and no-purification outcomes", async ({
  page,
}) => {
  await page.goto("?species=MAGIKARP&encounter=rocket&cp=61");
  await expect(page.locator("#decision h2")).toHaveText(
    "Worth checking appraisal",
  );
  await page.getByText("Why this result?").click();
  await expect(page.locator("#decision")).toContainText("80%");
  await expect(page.locator("#decision")).toContainText("15 / 12 / 15");
  await page.locator("#cp-input").fill("99999");
  await expect(page.locator("#decision h2")).toHaveText(
    "Check your encounter settings",
  );
  await page.locator("#cp-input").fill("1.5");
  await expect(page.locator("#decision h2")).toHaveText(
    "Enter a valid catch CP",
  );
  await page.goto("?species=BULBASAUR&encounter=rocket&weather=boosted&cp=402");
  await expect(page.locator("#decision h2")).toHaveText(
    "Cannot purify to a hundo",
  );
  await expect(page.locator("#cp-context")).toContainText(
    "Level 13 · IV floor 4/4/4",
  );
});
test("search supports keyboard selection, forms, weather and watchlist", async ({
  page,
}) => {
  await page.goto("");
  const search = page.locator("#species-search");
  await search.fill("Weedle");
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(search).toHaveValue("Weedle");
  await expect(search).toHaveAttribute("aria-expanded", "false");
  await page.locator("[data-encounter=rocket]").click();
  await page.locator("#cp-input").fill("102");
  await expect(page.locator("#decision h2")).toHaveText(
    "Every match can purify to a hundo",
  );
  await page.getByText("CPs worth checking", { exact: true }).click();
  await page.locator("[data-cp]").first().click();
  await expect(page.locator("#cp-input")).not.toHaveValue("");
  await search.fill("Rattata");
  await page.locator("[data-choice=RATTATA_ALOLAN]").click();
  await expect(search).toHaveValue("Rattata (Alolan)");
  await page.locator("[data-weather=boosted]").click();
  await expect(page.locator("#cp-context")).toContainText("Level 13");
});
test("reference shows ordinary species CPs, collision caveat and routes to Rocket", async ({
  page,
}) => {
  await page.goto("?view=reference");
  await page.locator("#reference-search").fill("Bulbasaur");
  const row = page.locator("#reference-rows tr").first();
  await expect(row).toContainText("251");
  await expect(row).toContainText("414");
  await expect(page.locator(".context-note")).toContainText(
    "matching CP alone does not prove perfect IVs",
  );
  await page.screenshot({
    path: `qa/${test.info().project.name}-reference.png`,
    fullPage: true,
  });
  await row.getByRole("button").click();
  await expect(page.locator("#cp-context")).toContainText("Level 8");
  await expect(page.locator("#species-search")).toHaveValue("Bulbasaur");
  await page.locator("#cp-input").fill("243");
  await expect(page.locator("#decision h2")).toHaveText(
    "Worth checking appraisal",
  );
  await expect(page.locator("body")).not.toHaveJSProperty("scrollWidth", 0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("visual QA: result, dark mode, mobile layout and legacy advanced", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("?species=MAGIKARP&encounter=rocket&cp=61");
  await page.screenshot({
    path: `qa/${test.info().project.name}-check.png`,
    fullPage: true,
  });
  await page.locator("#decision").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `qa/${test.info().project.name}-result.png` });
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await page.screenshot({
    path: `qa/${test.info().project.name}-dark.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("advanced.html");
  await expect(page.locator("#pageTitle")).toHaveText("Purified Hundo Odds");
  expect(errors).toEqual([]);
});
