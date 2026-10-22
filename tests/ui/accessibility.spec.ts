import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("primary and reference views have no serious accessibility violations", async ({
  page,
}) => {
  for (const query of [
    "",
    "?species=MAGIKARP&encounter=rocket&cp=61",
    "?species=SHUCKLE&encounter=rocket&cp=91",
    "?view=reference",
    "?species=MAGIKARP&encounter=rocket&cp=61&lang=ja",
    "?view=reference&lang=ja",
    "?species=MAGIKARP&cp=61&lang=de",
    "?view=reference&lang=de",
  ]) {
    await page.goto(query || "./");
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
});
