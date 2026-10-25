# Presentation/accessibility review — 2026-10-25

Prepared from main `330ad4bf676e1a2bdf7258de5e1f715f3aa7fd23`. No production deployment is authorized or performed.

## Reproduced on the unchanged baseline

An isolated local Chrome session confirmed Mewtwo CP2387 showed “Every match can purify to a hundo”; the Japanese reference skip link pointed at hidden `#decision` and left focus on BODY; unambiguous Magikarp raid CP157 returned focus with a red outline (`rgb(166,55,37)`). See baseline-repro.json. No live calculator profile or analytics was used.

## Changes

- “Already a hundo” is prominent only if every compatible spread in every matching context is originally 15/15/15. Copy and 100% label remain conditional on matching spreads/encounter conditions. A concise neutral battle-value caveat replaces the redundant appraisal tip in that case. Weedle 102 (all purifiable, not all originally perfect) and Magikarp 61 retain their original categories. Calculation functions, encounter rules, reference logic and catalog bytes are unchanged.
- CP keyboard focus is a high-contrast square in the theme's ink color. Approved solid red ambiguity ovals and digit alignment remain unchanged. Enter/Escape restores focus for both marked and unmarked values in light/dark.
- The skip link's localized label and destination follow the active view. It focuses the reference heading or decision, scrolls to it, and preserves URL/state. English/Japanese/German are covered.

## Validation

Build/typecheck and 29 unit tests pass. 16 targeted browser cases pass across installed Chrome and Playwright WebKit desktop/narrow 320 px projects: EN/JA/DE outcomes, conditional certainty, light/dark focus and Escape return, active-view skip focus/state, WCAG 2 A/AA and 2.1 AA axe checks in all languages on reference, and 200% CSS zoom smoke checks. Visual inspection includes desktop result, narrow result, light/dark focus and Japanese skip screenshots under qa/presentation-*.png.

The initial browser harness attempted mobile-only mode controls on desktop; it was corrected to use those controls only when visible. All final cases pass. No physical iPhone, VoiceOver or native Safari application test is claimed. CSS zoom is a layout smoke test, not OS/browser UI zoom certification.

## Workspace and limits

Documents checkouts have dataless Git/source files and cannot currently be opened by Git. Work is isolated in `/tmp/hundocheck-presentation-20261025`, with an unchanged baseline in `/tmp/hundo-presentation-baseline`. Existing work, iCloud settings, permissions, dependencies/lockfile, telemetry and production are unchanged. No applicable project AGENTS.md or project skill files were present. Only locked dependencies were installed in the temporary checkout.

Usage checkpoints: 20% used at start; 21% used after browser validation. No subagents or broad re-audit were used. PR #11/#12 are untouched.
