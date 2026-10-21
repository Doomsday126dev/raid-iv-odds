import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("collision IV table separates Weedle and Magikarp spreads in both themes and languages", async ({
  page,
}, info) => {
  await page.setViewportSize(
    info.project.name.includes("mobile")
      ? { width: 320, height: 800 }
      : { width: 1440, height: 1000 },
  );
  for (const lang of ["en", "ja"])
    for (const theme of ["light", "dark"])
      for (const [species, count] of [
        ["WEEDLE", 4],
        ["MAGIKARP", 10],
      ] as const) {
        await page.goto(
          `?species=${species}&view=reference&q=${species}&lang=${lang}`,
        );
        await page.evaluate((theme) => {
          document.documentElement.dataset.theme = theme;
        }, theme);
        await page
          .locator(
            `[data-cp-species=${species}][data-cp-group=rocket][data-cp-boosted=false]`,
          )
          .click();
        const table = page.locator(".reference-ivs");
        await expect(table.locator("tbody tr")).toHaveCount(count);
        await expect(table.locator("thead th")).toHaveText(
          lang === "en"
            ? ["Attack", "Defense", "HP", "Note"]
            : ["攻撃", "防御", "HP", "備考"],
        );
        const perfect = table.locator("tr[data-perfect=true]");
        await expect(perfect).toHaveCount(1);
        await expect(perfect.locator("td")).toHaveText([
          "15",
          "15",
          "15",
          lang === "en" ? "Perfect" : "100％",
        ]);
        for (const row of await table.locator("tbody tr").all()) {
          const cells = await row.locator("td").all();
          expect(cells).toHaveLength(4);
          const boxes = await Promise.all(
            cells.slice(0, 3).map((c) => c.boundingBox()),
          );
          expect(boxes.every(Boolean)).toBe(true);
          expect(new Set(boxes.map((b) => b!.y)).size).toBe(1);
        }
        expect(
          await table.evaluate((e) => e.scrollWidth <= e.clientWidth),
        ).toBe(true);
        expect(
          await page
            .locator("#reference-dialog")
            .evaluate((e) => e.scrollWidth <= e.clientWidth),
        ).toBe(true);
        if (species === "WEEDLE")
          expect(
            (
              await new AxeBuilder({ page })
                .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
                .analyze()
            ).violations,
          ).toEqual([]);
        if (
          (species === "WEEDLE" && theme === "dark") ||
          (species === "MAGIKARP" && theme === "light")
        )
          await page.screenshot({
            path: `qa/${info.project.name}-iv-table-${species.toLowerCase()}-${lang}-${theme}.png`,
            fullPage: true,
          });
      }
});
