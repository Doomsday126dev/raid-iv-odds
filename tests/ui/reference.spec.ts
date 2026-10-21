import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("grouped reference has four exact CPs, responsive modes and natural species action", async ({
  page,
}, info) => {
  await page.goto("?species=BULBASAUR&view=reference&lang=en");
  await page.locator("#reference-search").fill("Bulbasaur");
  const row = page.locator("#reference-rows tr").first();
  await expect(row.locator("[data-cp-species]")).toHaveText([
    "251",
    "414",
    "637",
    "796",
  ]);
  await expect(row.getByRole("button", { name: /^Check/ })).toHaveCount(0);
  if (info.project.name.includes("mobile")) {
    await expect(page.locator("[data-ref-mode=raid]")).toBeVisible();
    await expect(
      row.locator("[data-reference-group=raid]").first(),
    ).toBeHidden();
    await page.locator("[data-ref-mode=raid]").click();
    await expect(
      row.locator("[data-reference-group=raid]").first(),
    ).toBeVisible();
    await expect(
      row.locator("[data-reference-group=rocket]").first(),
    ).toBeHidden();
  }
  await page.screenshot({
    path: `qa/${info.project.name}-reference-groups-en.png`,
    fullPage: true,
  });
  await row.locator("[data-reference]").click();
  await expect(page.locator("#species-search")).toHaveValue("Bulbasaur");
});
test("collision marker opens touch and keyboard accessible exact IV details in both languages", async ({
  page,
}, info) => {
  await page.goto("?species=MAGIKARP&view=reference&q=Magikarp&lang=en");
  const cell = page.locator(
    "[data-cp-species=MAGIKARP][data-cp-group=rocket][data-cp-boosted=false]",
  );
  await expect(cell).toHaveAttribute("data-ambiguous", "true");
  await expect(cell.locator(".collision-icon")).toHaveCount(0);
  await cell.focus();
  await expect(cell.locator("[role=tooltip]")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#reference-dialog")).toBeVisible();
  await expect(page.locator("#reference-dialog")).toContainText(
    "10 matching IV combinations",
  );
  await expect(page.locator(".reference-ivs tbody tr")).toHaveCount(10);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: `qa/${info.project.name}-reference-collision-en.png`,
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("#reference-dialog")).not.toBeVisible();
  await expect(cell).toBeFocused();
  await cell.click();
  await page.locator("#use-reference-cp").click();
  await expect(page.locator("#cp-input")).toHaveValue("61");
  await expect(
    page.locator("#decision > .chance-panel .chance-value"),
  ).toHaveText("80%");
  await page.goto(
    "?species=MAGIKARP&view=reference&q=コイキング&lang=ja&refMode=raid",
  );
  if (info.project.name.includes("mobile"))
    await expect(page.locator("[data-ref-mode=raid]")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  await page
    .locator(
      "[data-cp-species=MAGIKARP][data-cp-group=raid][data-cp-boosted=false]",
    )
    .click();
  await expect(page.locator(".reference-assumptions")).not.toHaveAttribute(
    "open",
  );
  await page.locator(".reference-assumptions summary").click();
  await expect(page.locator("#reference-dialog")).toContainText(
    "通常レイドとの比較",
  );
  await expect(page.locator("#reference-dialog")).toContainText(
    "最低個体値6/6/6",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `qa/${info.project.name}-reference-collision-ja.png`,
    fullPage: true,
  });
});
