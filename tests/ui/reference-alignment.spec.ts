import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("approved red outlines preserve glyph alignment and geometry in both languages/themes", async ({
  page,
}, info) => {
  const mobile = info.project.name.includes("mobile");
  await page.setViewportSize(
    mobile ? { width: 320, height: 800 } : { width: 1440, height: 1000 },
  );
  for (const lang of ["en", "ja"])
    for (const theme of ["light", "dark"]) {
      await page.goto(`?view=reference&lang=${lang}`);
      await page.evaluate(
        (theme) => (document.documentElement.dataset.theme = theme),
        theme,
      );
      await expect(page.locator(".collision-icon")).toHaveCount(0);
      for (const group of ["rocket", "raid"]) {
        if (mobile) await page.locator(`[data-ref-mode=${group}]`).click();
        for (const boosted of ["false", "true"]) {
          const buttons = page.locator(
            `.cp-reference[data-cp-group=${group}][data-cp-boosted=${boosted}]`,
          );
          const geometry = await buttons.evaluateAll((els) =>
            els.map((e) => {
              const b = e.getBoundingClientRect(),
                n = e.querySelector(".cp-number")!.getBoundingClientRect();
              return {
                right: n.right,
                width: b.width,
                height: b.height,
                ambiguous: e.getAttribute("data-ambiguous"),
              };
            }),
          );
          expect(
            Math.max(...geometry.map((g) => g.right)) -
              Math.min(...geometry.map((g) => g.right)),
          ).toBeLessThan(0.2);
          expect(new Set(geometry.map((g) => g.width)).size).toBe(1);
          expect(new Set(geometry.map((g) => g.height)).size).toBe(1);
        }
      }
      if (mobile) await page.locator("[data-ref-mode=rocket]").click();
      const marked = page.locator(
        "[data-cp-species=CATERPIE][data-cp-group=rocket][data-cp-boosted=false]",
      );
      const stroke = await marked.locator(".cp-number").evaluate((e) => {
        const s = getComputedStyle(e, "::after");
        return {
          style: s.borderTopStyle,
          width: s.borderTopWidth,
          color: s.borderTopColor,
          background: s.backgroundColor,
        };
      });
      expect(stroke).toEqual({
        style: "solid",
        width: "1px",
        color: theme === "dark" ? "rgb(255, 107, 99)" : "rgb(201, 50, 46)",
        background: "rgba(0, 0, 0, 0)",
      });
      expect(
        await page
          .locator(".species-reference")
          .first()
          .evaluate((e) => getComputedStyle(e).textDecorationLine),
      ).toBe("none");
      expect(
        await marked.evaluate((e) => getComputedStyle(e).textDecorationLine),
      ).toBe("none");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.keyboard.press("Tab");
      await marked.focus();
      await expect(marked.locator("[role=tooltip]")).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(page.locator("#reference-dialog")).toBeVisible();
      await expect(page.locator(".reference-assumptions")).not.toHaveAttribute(
        "open",
      );
      await expect(page.locator(".reference-ivs thead th")).toHaveCount(3);
      await page.keyboard.press("Escape");
      await expect(marked).toBeFocused();
      if (mobile) {
        await marked.tap();
        await expect(page.locator("#reference-dialog")).toBeVisible();
        await page.locator("#reference-dialog-close").tap();
      }
      await page.mouse.click(1, 1);
      if (lang === "en")
        await page.locator(".reference-table").screenshot({
          path: `qa/${info.project.name}-approved-reference-${theme}.png`,
        });
      if (theme === "dark")
        expect(
          (
            await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
              .analyze()
          ).violations,
        ).toEqual([]);
    }
});
