# HundoCheck correctness and mobile/Japanese audit

Baseline: released `ecea09581b2f18b6c96b26de745cfcb10527e6fb` (PR #13). Audit date: 22 October 2026. Work is isolated on `audit/calculations-mobile-ja` in a separate worktree. No merge, production deployment, dependency, billing or permission changes are part of this audit. The approved warm-paper/ink/vermilion design and red-outline treatment are preserved; no CSS or probability/data files are changed.

## Calculation result

No calculation discrepancies found in the audited scope:

- **17,580,032 CP calculations:** all 4,096 IV triples for all 1,073 catalog species/forms at levels 8/13/20/25, including IVs below standard raid floors for advanced/custom-floor coverage.
- **8,395,152 legal bucket/purification checks:** standard Rocket floors 0/4 and Shadow raid floor 6. Every legal spread appears exactly once; each standard pool has the 27 qualifying13-or-higher spreads; capped purification IVs match.
- **6,438 reference/collision checks:** both Rocket levels/floors, both Shadow raid levels/floor 6 and normal raid floor 10. Every hundo-CP match count and ambiguity flag agrees with exact bucket membership.
- **770 independent conditional-inference queries across 14 representative species/forms**, including low-CP collisions, high attack/defense/HP, regional forms, legendary Rocket exclusions, no-match boundaries and overlapping weather contexts. Matching-context counts, qualifying counts, verdicts, exact conditional-ratio equality and clarification requirements agree. No combined probability across unknown contexts is invented.

The CP oracle uses **BigInt squared inequalities**, not the application’s floating-point square-root calculation. For positive stats, `k=floor(sqrt(A²·D·S·CPM⁴/100))`, with minimum 10. Decimal CPMs are pinned independently from PvPoke’s calculation source. Integer arithmetic tests that the predicted CP falls between consecutive exact squared boundaries. This validates rounding relative to the pinned CPM model, not Niantic’s private server implementation. The separate inference oracle constructs its own IV loops and aggregate bins and does not call application CP/bucket helpers.

`calculation-oracle.json` and `inference-oracle.json` contain counts/results. The exhaustive arithmetic sweep took about 2 seconds locally, so this is a reproducible check rather than a costly probabilistic search. The existing known Magikarp 61 (8/10), Weedle 102 (4/4) and Charizard 640 (1/10) regressions remain intact.

All 1,073 base-stat records, historical Shadow flags and special-class policy flags exactly match the catalog’s SHA256-pinned PvPoke input. All 1,073 Japanese labels are present and distinct. Forms retain distinct IDs and their own stats; no dataset or naming changes were justified. This does not establish current encounter rotations, nor independently prove every hand-curated GO form translation.

## Severity-ranked reproduced findings

| ID  | Priority | Before-fix repro and observed impact                                                                                                                                                                                                                                                                                                 | Local correction                                                                                                                                                                                                                |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | P2       | Delay the dynamic main UI bundle 350 ms on a secure reserved localhost subdomain. The page reaches `readyState=complete`, shows the calculator, but no active service-worker registration appears. A load-only listener installed after load never runs. Existing offline tests manually registered workers and missed this failure. | Register immediately if the document is already complete; otherwise listen for load once. No manual registration is used in the new regression.                                                                                 |
| A2  | P2       | On Japanese Magikarp CP 61, type `ガラル` and dispatch a composing Enter. Both Chrome and WebKit replace the draft with `ニャース（ガラルのすがた）` and clear CP. Enter confirmed the IME session, not a species choice.                                                                                                            | Ignore composing key events and Safari’s 229 composition fallback. A subsequent ordinary Enter still selects the suggestion.                                                                                                    |
| A3  | P2       | Install the shell, then return HTTP 503 for a navigation reload. The old worker forwards the error page; the cached calculator is lost even though its shell is available. Fetch resolves for HTTP errors instead of rejecting.                                                                                                      | On navigation 5xx, use the installed cached shell. Explicit 404 responses remain 404; cache installation/activation and unrelated-cache rules are unchanged.                                                                    |
| A4  | P3       | `?species=UNKNOWN&cp=2387&lang=ja` displays a compatible Shadow-raid context computed from internal fallback Mewtwo despite refusing a result. Uncommitted drafts and reference-only forms can also show misleading context.                                                                                                         | Hide **and clear** context until a supported species is committed. Clearing matters because referenced hidden text can still become an accessible description. Tests verify the CP field’s accessible description is empty.     |
| A5  | P3       | In Chrome, type `Bulba` and press Tab. Focus moves into `option-0` instead of Catch CP. The active-descendant combobox exposes each option as another Tab stop. WebKit’s default tab behavior differs.                                                                                                                               | Options stay clickable but leave the Tab sequence; Arrow/Enter selection is retained. Tab moves directly to Catch CP and dismisses suggestions.                                                                                 |
| A6  | P3       | Japanese `?species=MAGIKARP&cp=６１&lang=ja` gives no chance instead of 80%. Mixed fullwidth/ASCII input has the same issue.                                                                                                                                                                                                         | Normalize fullwidth decimal digits for calculation/shared links; retain strict integer validation. Update the native pattern so accepted input is not simultaneously marked pattern-invalid. Fractional input remains rejected. |

All findings were reproduced before fixes. A1/A3 baseline failures were captured using the built released code in fresh isolated Chrome contexts; A2 was also independently observed in WebKit. IME coverage is event-level (`isComposing` and 229), not a claim of physical Japanese-keyboard testing.

## Verification

- TypeScript/Vite production build and 21 existing unit tests pass.
- New focused regressions: 20 passes and 4 explicit WebKit service-worker skips across desktop/mobile Chrome/WebKit.
- Final existing-plus-new suite: **112 passed, 8 explicit WebKit service-worker skips**, across desktop/mobile Chrome and WebKit (51.7 seconds).
- Existing exact percentages, automatic encounter/weather inference, ambiguity clarification, language round trips, old shared links/custom floors, source-scoped reference markers, keyboard/touch dialogs, red-outline alignment, both themes, 320px Japanese bounds and axe checks are exercised.
- Worker regressions use a localhost subdomain bound only to 127.0.0.1. No user browser profile, real caches, OS networking settings or production origin are modified. Existing old-worker migration/unrelated-cache preservation tests remain in the regression suite.
- Screenshot `qa/audit-mobile-ja-fullwidth.png` shows the corrected Japanese 80% result; other existing visual artifacts confirm the approved design remains intact.

## Limits and review next steps

No P0/P1 issue was identified in this scope. Absence of discrepancies is bounded by the source/model and test coverage, not a proof about undocumented game events. Current rotations, event-specific floors, Giovanni/research/powered-up contexts, physical iPhone/home-screen/storage-eviction lifecycle, and exhaustive native assistive technology/IME behavior remain outside verification. Playwright WebKit has no service-worker implementation; those cases are explicit skips, with Chrome covering the worker logic.

Review the small runtime diff in `src/main.ts`, `src/ui.ts` and `public/sw.js`, and the regression evidence. No calculation rewrite or catalog update is proposed. Merge/deployment requires parent/user approval; the audit branch remains review-only.

## Reproduction commands and source references

```sh
npm run build
npm test
node --experimental-strip-types scripts/audit-calculations.mjs /tmp/calculation-oracle.json
node --experimental-strip-types scripts/audit-inference.mjs /tmp/inference-oracle.json
# Start local production preview, then run focused or complete browser checks:
npm run preview
PLAYWRIGHT_BROWSERS_PATH=/tmp/raid-playwright npm run test:ui -- tests/ui/audit-input.spec.ts tests/ui/audit-worker.spec.ts --workers=2
```

- [Pinned PvPoke CPM/calculation source](https://github.com/pvpoke/pvpoke/blob/4d2908fac68d882bb6b4bdbbf1123a71fb62da31/src/js/pokemon/Pokemon.js)
- [Pinned base-stat/catalog source](https://github.com/pvpoke/pvpoke/blob/4d2908fac68d882bb6b4bdbbf1123a71fb62da31/src/data/gamemaster/pokemon.json)
- [WebKit IME event-order report and 229 fallback](https://bugs.webkit.org/show_bug.cgi?id=165004)
- [KeyboardEvent.isComposing](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing)
- [HTML script processing](https://html.spec.whatwg.org/multipage/scripting.html)

The official Shadow/Purified help link redirected to Scopely support and was unavailable to the web reader during this audit; no new official-mechanics claim relies on that failed fetch. Dataset provenance/licenses and known encounter assumptions remain documented in the existing project docs.

## Independent second pass

A fresh read-only reviewer found no reportable regression at a44bea8. An additional isolated Chrome check reproduced a low-risk native-validation inconsistency: pasted `　６１　` returned 80% with aria-invalid=false but patternMismatch=true. The native pattern now accepts the same surrounding whitespace as normalization; browser regression coverage includes ASCII and fullwidth spaces. No calculation or visual-design changes.
