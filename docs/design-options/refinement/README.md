# Option A refinement — review only

## Latest: dotted number ring

`ring-*` is the latest requested refinement. Only ambiguous CPs get a thin dotted accent ring around their digits; two-digit values are near-circular and longer values oval. An absolutely positioned border keeps numeric edges, button size and table cell geometry identical to unmarked values. There is no separate symbol or marker slot. The compact three-column modal is unchanged.

Real two-/three-digit collision examples use the released calculation data. An audit found **no four-digit perfect-CP collisions** in the current catalog at the supported reference levels/floors. The separate, clearly labeled ring-sizing study therefore shows a four-digit *layout fixture*, not a factual collision marker. That sizing study is review material, not proposed product UI; actual four-digit reference values remain unmarked.

Eight focused Chrome/WebKit ring scenarios pass, including numeric glyph-edge alignment, equal marked/plain sizing geometry, touch/focus explanations, English/Japanese, 320px bounds and light/dark screenshots. See `verification-ring.json`. Regenerate only this revision by appending `--ring-only` to both generator/render commands. No application source or production changes are included. Await user review.

These are isolated, self-contained static mockups based on released commit `bece37f7c415a1dc59fc5d6f0183ed8040ab4890`. Application source, calculations and production remain unchanged. No option has been selected or deployed.

- **A / dotted:** only ambiguous CPs receive a restrained dotted underline. Ordinary CPs and species have no persistent underline. Digits share a fixed, right-aligned numeric track.
- **B / label:** a quiet “Multiple IVs” / “複数個体値” label occupies a separate reserved slot; the same space remains empty on ordinary CPs. Numeric edges stay fixed. On phones the reserved label slot sits below the number to avoid squeezing the row.
- Both proposals remove the overlapping-circles symbol, simplify the modal to Attack/Defense/HP, remove the Note/Perfect column, show one short matching-combination count, and collapse calculation assumptions. A slightly emphasized perfect row has no redundant text.
- Sharper row rules, restrained hover/press states, preserved keyboard focus, reduced modal width/padding and a proportional close button retain the warm-paper/vermilion direction.

The desktop comparison uses the same eight representative species in all variants. Their CPs and collision flags were captured from the released application's calculated reference; these mockups are not a new encounter-availability list. The mobile modal uses Weedle CP102 and its four exact matching spreads. Both English/Japanese and light/dark presentations are included.

`before-*` shows the released styling on the same fixture. `dotted-*` and `label-*` show the proposals. `*-crop.png` focuses the table or dialog. `*-table-mobile-*` checks narrow reference layouts. The HTML files can be opened locally; their only scripts close dialogs, switch mobile reference groups and show an ambiguous CP explanation. They are visual mockups, not a replacement calculator. They make no network requests and do not register a worker.

Verification covers Chrome and WebKit, translated content, three modal columns/four rows, closed assumptions by default, no proposed circle symbols, fixed numeric edges, keyboard-focus explanations, tap-to-open explanations, and 320px layout bounds in both themes. See `verification.json`. Screenshots were visually reviewed.

To regenerate from the released build with local preview running on port4173:

```sh
node docs/design-options/build-refinement-preview.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/raid-playwright node docs/design-options/render-refinement-preview.mjs
```

Await user choice before any main-app implementation or deployment.
