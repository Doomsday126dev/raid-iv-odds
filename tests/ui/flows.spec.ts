import { test, expect } from "@playwright/test";
test("primary check handles mixed, impossible and no-purification outcomes", async ({
  page,
}) => {
  await page.goto("?species=MAGIKARP&encounter=rocket&cp=61");
  await expect(page.locator("#decision h2")).toHaveText(
    "Possible purified hundo",
  );
  await page.getByText("Calculation details").click();
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
  await expect(page.locator("#cp-context")).toContainText("Weather boosted");
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
  await page.locator("#cp-input").fill("102");
  await expect(page.locator("#decision h2")).toHaveText(
    "Every match can purify to a hundo",
  );
  await page.getByText("Purifiable CP candidates", { exact: true }).click();
  await page.locator("[data-cp]").first().click();
  await expect(page.locator("#cp-input")).not.toHaveValue("");
  await search.fill("Rattata");
  await page.locator("[data-choice=RATTATA_ALOLAN]").click();
  await expect(search).toHaveValue("Rattata (Alolan)");
  await page.locator("#cp-input").fill("273");
  await expect(page.locator("#cp-context")).toContainText("Weather boosted");
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
    "Matching CP alone does not prove perfect IVs",
  );
  await page.screenshot({
    path: `qa/${test.info().project.name}-reference.png`,
    fullPage: true,
  });
  await row.locator("[data-reference]").click();
  await expect(page.locator("#cp-context")).toContainText(
    "Raid, Rocket and weather checked",
  );
  await expect(page.locator("#species-search")).toHaveValue("Bulbasaur");
  await page.locator("#cp-input").fill("243");
  await expect(page.locator("#decision h2")).toHaveText(
    "Possible purified hundo",
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

test("legacy shared form URLs and custom/hash state retain original calculator contract", async ({
  page,
}) => {
  for (const query of [
    "?pokemon=Giratina%20Altered&cp=1931",
    "?boss=Articuno%20Galarian&cp=1234&floor=3/4/5",
    "#?boss=Giratina%20Origin&cp=2105&floor=4/5/6&weather=boosted",
  ]) {
    await page.goto(`./${query}`);
    await expect(page).toHaveURL(/advanced\.html/);
    const expected = query.includes("Altered")
      ? "Giratina Altered"
      : query.includes("Articuno")
        ? "Articuno Galarian"
        : "Giratina Origin";
    await expect(page.locator("#pokemonSelect")).toHaveValue(expected);
    if (query.includes("3/4/5")) {
      await expect(page.locator("#floorAtkInput")).toHaveValue("3");
      await expect(page.locator("#floorDefInput")).toHaveValue("4");
      await expect(page.locator("#floorStaInput")).toHaveValue("5");
    }
  }
});
test("CP-only legacy hashes preserve inputs and hash precedence", async ({
  page,
}) => {
  await page.goto("./#?cp=2387&weather=normal");
  await expect(page).toHaveURL(/advanced\.html/);
  await expect(page.locator("#cpInput")).toHaveValue("2387");
  await expect(page.locator('[data-weather-choice="normal"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.goto("./?cp=2387&weather=normal#?cp=2984&weather=boosted");
  await expect(page).toHaveURL(/advanced\.html/);
  await expect(page.locator("#cpInput")).toHaveValue("2984");
  await expect(page.locator('[data-weather-choice="boosted"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.goto("./?species=MEWTWO&encounter=raid&cp=2387");
  await expect(page).not.toHaveURL(/advanced\.html/);
  await expect(page.locator("#cp-input")).toHaveValue("2387");
});
test("unknown species never silently calculates Mewtwo, and uncommitted searches suppress verdicts", async ({
  page,
}) => {
  await page.goto("?species=UNKNOWN&encounter=rocket&cp=61");
  await expect(page.locator("#species-search")).toHaveValue("");
  await expect(page.locator("#decision h2")).toHaveText(
    "Choose a Pokémon from the list",
  );
  await page.goto("?species=MAGIKARP&encounter=rocket&cp=61");
  await page.locator("#species-search").fill("Missing Pokemon");
  await expect(page.locator("#decision h2")).toHaveText(
    "Choose a Pokémon from the list",
  );
  await expect(page.locator("#mobile-result")).toBeHidden();
});
test("empty result remains a compact contextual hint", async ({ page }) => {
  await page.goto("");
  const box = await page.locator("#decision").boundingBox();
  expect(box!.height).toBeLessThan(85);
  await expect(page.locator("#decision")).toContainText("Enter CP");
  await expect(page.locator(".empty-guide")).toHaveCount(0);
  await page.screenshot({
    path: `qa/${test.info().project.name}-empty.png`,
    fullPage: true,
  });
});
test("weather is inferred automatically and only conflicting contexts ask for clarification", async ({
  page,
}) => {
  await page.goto("?species=BULBASAUR&encounter=rocket&cp=243");
  await expect(page.locator("[data-weather]")).toHaveCount(0);
  await expect(page.locator("#cp-context")).toContainText(
    "Non-weather boosted",
  );
  await page.locator("#cp-input").fill("414");
  await expect(page.locator("#cp-context")).toContainText("Weather boosted");
  await page.goto("?species=SHUCKLE&encounter=rocket&cp=91");
  await expect(page.locator("#decision h2")).toHaveText(
    "Confirm the weather boost",
  );
  await page.getByText("Calculation details").click();
  await expect(page.locator("#decision")).toContainText(
    "No combined probability",
  );
  await page.locator("[data-clarify=rocket-normal]").click();
  await expect(page.locator("#decision h2")).toHaveText(
    "Possible purified hundo",
  );
  await page.locator("#cp-input").fill("92");
  await expect(page.locator("[data-clarify]")).toHaveCount(0);
  await expect(page.locator("[data-encounter]")).toHaveCount(0);
  await page.locator("[data-species=MEWTWO]").click();
  await expect(page.locator("#cp-input")).toHaveValue("");
});
