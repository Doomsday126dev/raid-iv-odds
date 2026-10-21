import { test, expect } from "@playwright/test";

test("Option A percentage means purifiable chance, with original hundo separated", async ({
  page,
}) => {
  await page.goto("?species=MAGIKARP&encounter=rocket&cp=61&lang=en");
  await expect(
    page.locator("#decision > .chance-panel .chance-value"),
  ).toHaveText("80%");
  await expect(page.locator("#decision > .chance-panel")).toContainText(
    "8 of 10 matching IV spreads",
  );
  await page.getByText("Calculation details", { exact: true }).click();
  await expect(page.locator(".original-perfect")).toContainText("10%");
  await expect(page.locator(".iv-table tbody tr")).toHaveCount(10);
  await expect(
    page.locator(".iv-table tbody tr[data-qualifies=true]"),
  ).toHaveCount(8);
  await expect(
    page.locator(".iv-table tbody tr[data-qualifies=false]"),
  ).toHaveCount(2);
  await expect(page.locator(".iv-table")).toContainText("Already perfect");
  await page.screenshot({
    path: `qa/${test.info().project.name}-option-a-details-en.png`,
    fullPage: true,
  });
  await page.goto("?species=WEEDLE&encounter=rocket&cp=102&lang=en");
  await expect(page.locator(".chance-value")).toHaveText("100%");
  await page.getByText("Calculation details", { exact: true }).click();
  await expect(page.locator(".original-perfect")).toContainText("25%");
  await page.goto("?species=BULBASAUR&encounter=rocket&cp=402&lang=en");
  await expect(page.locator(".chance-value")).toHaveText("0%");
  await expect(page.locator("#decision h2")).toHaveText(
    "Cannot purify to a hundo",
  );
  await page.goto("?species=SHUCKLE&encounter=rocket&cp=91&lang=en");
  await expect(page.locator("#decision > .chance-panel")).toHaveCount(0);
  await expect(page.locator(".context-chances .chance-value")).toHaveText([
    "75%",
    "0%",
  ]);
});

test("Japanese UI, aliases, form selection, reference and language persistence", async ({
  page,
}) => {
  await page.goto("?species=MAGIKARP&encounter=rocket&cp=61&lang=ja");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("#species-search")).toHaveValue("コイキング");
  await expect(page.locator("#decision h2")).toHaveText(
    "リトレーン後100％の可能性あり",
  );
  await expect(page.locator(".chance-value")).toHaveText("80%");
  await page.getByText("計算の詳細", { exact: true }).click();
  await expect(page.locator(".original-perfect")).toContainText(
    "捕獲時点で個体値100％",
  );
  await expect(
    page.locator(".iv-table tbody tr[data-qualifies=true]"),
  ).toHaveCount(8);
  await page.screenshot({
    path: `qa/${test.info().project.name}-option-a-details-ja.png`,
    fullPage: true,
  });
  await page.locator("[data-language=en]").click();
  await expect(page.locator("#species-search")).toHaveValue("Magikarp");
  await expect(page.locator("#cp-input")).toHaveValue("61");
  await page.locator("[data-language=ja]").click();
  await page.locator("#species-search").fill("こらった");
  await page.locator("[data-choice=RATTATA_ALOLAN]").click();
  await expect(page.locator("#species-search")).toHaveValue(
    "コラッタ（アローラのすがた）",
  );
  await page.locator("#cp-input").fill("273");
  await expect(page.locator("#cp-context")).toContainText("天候ブーストあり");
  await page.locator("[data-view=reference]").click();
  await page.locator("#reference-search").fill("ふしぎだね");
  await expect(page.locator("#reference-rows")).toContainText("フシギダネ");
  await expect(page.locator("#reference-rows")).toContainText("414");
  await expect(page.locator(".reference-table thead")).toContainText(
    "天候ブーストなし",
  );
  await page.screenshot({
    path: `qa/${test.info().project.name}-option-a-reference-ja.png`,
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("#reference-search")).toHaveValue("ふしぎだね");
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Japanese errors, ambiguity, empty state and existing language preferences", async ({
  page,
}) => {
  await page.goto("?lang=ja");
  await expect(page.locator("#decision")).toContainText("CPを入力");
  await page.locator("#cp-input").fill("1.5");
  await expect(page.locator("#decision h2")).toHaveText("正しい捕獲時CPを入力");
  await expect(page.locator(".chance-value")).toHaveCount(0);
  await page.locator("#cp-input").fill("99999");
  await expect(page.locator("#decision h2")).toHaveText(
    "遭遇条件を確認してください",
  );
  await page.goto("?species=SHUCKLE&encounter=rocket&cp=91&lang=ja");
  await expect(page.locator("#decision h2")).toHaveText(
    "天候ブーストを確認してください",
  );
  await expect(page.locator(".context-chances .chance-value")).toHaveText([
    "75%",
    "0%",
  ]);
  await page.locator("[data-clarify=false]").click();
  await expect(
    page.locator("#decision > .chance-panel .chance-value"),
  ).toHaveText("75%");
  await page.goto("./#?cp=2387&weather=normal&lang=ja");
  await expect(page).toHaveURL(/advanced\.html/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("#cpInput")).toHaveValue("2387");
});

test("Japanese narrow layout and cross-language alias search retain context", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("?species=RATTATA_ALOLAN&encounter=rocket&cp=273&lang=ja");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("#species-search").fill("ｺｲｷﾝｸﾞ");
  await page.locator("[data-choice=MAGIKARP]").click();
  await expect(page.locator("#species-search")).toHaveValue("コイキング");
  await page.locator("#species-search").fill("Bulbasaur");
  await page.locator("[data-choice=BULBASAUR]").click();
  await expect(page.locator("#species-search")).toHaveValue("フシギダネ");
  await page.locator("[data-view=reference]").click();
  await page.locator("#reference-search").fill("ガラル");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("?species=SHUCKLE&encounter=rocket&cp=91&lang=ja");
  await page.locator("[data-clarify=false]").click();
  await page.locator("[data-language=en]").click();
  await expect(
    page.locator("#decision > .chance-panel .chance-value"),
  ).toHaveText("75%");
});
