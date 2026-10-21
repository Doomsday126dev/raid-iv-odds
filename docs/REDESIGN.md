# Purified-hundo redesign: audit → implementation → verification

## Audit

Inspected main at clone time, README, SECURITY, deployment workflow, the deployed desktop interface, calculator implementation, data, and tests. No AGENTS.md exists in the repository. Work is isolated in a fresh clone on `redesign/purified-hundo-focus`; no unrelated checkout was modified.

The previous interface repeated the verdict, two weather panels, ratios, statistics and watchlists. A 78-entry hand-maintained list emphasized legendary bosses. Integer CP bucket enumeration correctly handled IV collisions and was retained. The redesigned primary page replaces the presentation; the original calculator remains in advanced.html, retaining Japanese support, custom floors, manual base stats, themes and detailed comparisons.

## Completed roadmap

1. Audit math, existing features, deployed interface and deployment scope.
2. Define a single selected encounter and actionable result hierarchy.
3. Add broad searchable species/forms and a distinct level 8/13 perfect-CP reference.
4. Separate original 15/15/15 CP from pre-purification candidates, use exact buckets, and disclose assumptions progressively.
5. Verify unit fixtures, desktop/mobile flows, production build and screenshots.
6. Prepare review branch/PR. Production deployment is deliberately pending the parent's scope confirmation.

## Mechanics

Rocket Grunt/Leader catches use levels 8/13 and floors 0/4 for normal/weather boosted encounters. Shadow raids use levels 20/25 and floor 6. Giovanni, research, powered-up Pokémon and special event floors need separate settings; advanced calculator supports custom raid floors. Ordinary wild Pokémon do not have fixed level 8/13 encounters. The reference shows exact *15/15/15 CP at those levels*, without claiming that a matching CP proves IVs or that every species currently spawns.

Purification adds 2 to each IV, capped at 15. All IVs must be at least 13 beforehand. The shadow damage modifier is not applied to catch CP. The same final floored CP can belong to different triples. A positive result means to catch/check appraisal, not that purification is the best battle decision. All-match certainty is conditional on the selected species, form, level and floor. Probabilities assume uniform permitted triples.

Sources verified during development:
- https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2396-shadow-pokemon-purified-pokemon/
- https://pokemongo.com/news/delightful-days-tgr-2025 (event exceptions)
- https://bulbapedia.bulbagarden.net/wiki/Shadow_Pok%C3%A9mon_(GO)
- https://github.com/pvpoke/pvpoke/blob/4d2908fac68d882bb6b4bdbbf1123a71fb62da31/src/js/pokemon/Pokemon.js

## Catalog and attribution

The bundled catalog contains 1,073 released species/forms derived from PvPoke's speciesName, speciesId, dex, baseStats, types, released and shadoweligible data. Mega/Primal and duplicate Shadow variants are excluded; current availability is not inferred. Pokémon with no historical Shadow eligibility are routed to references rather than a purification verdict. Historical eligibility is not a current Rocket rotation list. Gameplay forms retain source names. Costume variants are outside the catalog.

Pinned source: https://github.com/pvpoke/pvpoke/blob/4d2908fac68d882bb6b4bdbbf1123a71fb62da31/src/data/gamemaster/pokemon.json

The MIT notice is preserved in PVPOKE-LICENSE.txt. Numeric factual stats and selected metadata are imported, not third-party sprites or runtime code. `level25CP` is intentionally unused: it is not perfect-IV CP. Every reference is computed locally from base stats. No runtime network fetch is needed.

Refresh: download pokemon.json at a reviewed full commit, then run `node scripts/update-catalog.mjs /path/to/pokemon.json <full-commit-sha>`. Review catalog diff, run tests/build/UI tests, and retain the upstream license. JSON records source commit, input SHA256 and generation date. Do not treat tags as evidence of present-day availability.

## Verification and limits

15 unit tests cover existing raid behavior, exact CP fixtures, Magikarp/Weedle max-CP collisions, Bulbasaur non-contiguous candidate buckets, floors, minimum CP, purification cap and catalog scope. The expanded Playwright suite runs desktop and iPhone 13 layouts in Chromium and WebKit, checking primary result states, keyboard search, regional forms, weather, watchlist selection, reference lookup/routing, dark mode, advanced page and horizontal overflow. Screenshots in qa/ were visually reviewed, with a mobile result shortcut added after the first review.

Build includes TypeScript checking and both entrypoints. Production bundle for the primary page is about 32KB gzipped JS including catalog. Mobile QA is emulation in installed Chrome and Playwright WebKit, not a physical iPhone. Japanese remains available through the advanced calculator; the new primary interface is English. Native Safari rendering and a fresh-install/offline fixture were also verified; physical iOS home-screen lifecycle remains unverified.

The pre-existing lockfile reports nine npm advisories (including Capacitor/native tooling and Vite/build dependencies). This redesign adds Playwright but does not perform a broad dependency upgrade. Review/update those dependencies separately before native packaging; this is a static browser app without a backend or credentials.

## Release follow-up

The final user-directed visual language is a compact field guide: warm off-white paper, ink-black typography, restrained vermilion, crisp dividers, tabular CP numerals, modest corners and few nested cards. Both green and purple are removed. Dark mode uses warm charcoal and paper text. The empty result is a single contextual hint rather than a tall instructional card. Weather selection is inferred from both level/floor contexts; only conflicting compatible contexts request clarification. Labels say **Non-weather boosted / Weather boosted**, with levels secondary. Possible results are factual, without catch-time marketing or skip advice.

Precision uses the pinned full CPMs for levels 8, 13, 20 and 25. Charizard level 8 CP640 has one purifiable spread among ten (14/10/15 is CP639). Existing pokemon/boss/custom-floor/hash URLs route intact to the advanced calculator, including historical form names and Japanese aliases. URL floors override saved custom floors. Unknown canonical species and uncommitted search text suppress fallback verdicts.

The build now generates the service worker's complete cache manifest from emitted files and derives a build-specific cache key from file content. Fresh installs cache both entrypoints and all JS/CSS/data assets. Activation removes only this app's older caches, preserving unrelated apps on the GitHub Pages origin. Local regression tests install the actual prior v8 worker, update to the production worker and reload offline. This is an isolated localhost test, not a production update.

Chrome and Playwright WebKit both run desktop and iPhone-size flows. Playwright WebKit does not support service workers, so those four offline cases are explicitly skipped there; Chromium covers them. Native installed Safari was also opened and visually inspected independently. These checks do not claim physical iPhone, installed iOS home-screen lifecycle, low-storage eviction or real production-origin migration coverage.


Final primary copy is neutral: “Enter CP to check for a possible purified hundo”, “Possible purified hundo” and “Cannot purify to a hundo”. Appraisal is a factual confirmation instruction, not a promoted time-saving proposition. Primary result context is human-readable encounter/weather text; IV floors and levels are in calculation details. A compact result shortcut is hidden while typing CP.

Native Safari verification: a localhost fixture installed the generated worker and reported its content-derived build cache. After the fixture began rejecting subsequent build-resource network requests, Safari loaded the cached calculator and correctly showed Magikarp CP61 as a possible purified hundo. The fixture was stopped afterward; no production-origin cache or Mac network setting changed. Native old-v8 migration was not separately automated; that transition is covered in Chromium.

Accessibility checks use axe-core WCAG A/AA rules on empty, possible, ambiguous and reference states in both engines, in addition to keyboard search/selection and viewport-overflow tests. This is not a claim of exhaustive screen-reader or physical-device certification.

Dependency-specific review and static-web versus native-release assessment: see DEPENDENCY-REVIEW.md.

## Design approval gate

The user subsequently requested design options before further implementation. Main-app visual changes are now paused; the current work is preserved for review. Three structurally distinct static mobile studies live in `docs/design-options/` (light field-guide/vermilion, graphite/amber instrument, editorial white/cobalt). None is selected or applied. All omit the rejected level/IV subcaptions under reference headers. No merge or deployment is authorized by this review state.

Screenshot transfer: current Library skill helper availability changed during the task, preventing completion of its required upload workflow. No Library upload was attempted and no Library delivery is claimed. The alternative review route is committed PNG files with verified public GitHub/raw URLs in the draft PR; no local Mac path is required to view them.

Latest preserved implementation verification: `npm test` passed 15 unit tests; the complete cross-browser run passed 40 Playwright cases with 4 explicit service-worker skips in WebKit. That run includes axe checks on four states in each engine/layout. TypeScript/Vite production build and `git diff --check` passed. Static design studies were separately rendered and visually inspected. Design approval remains pending despite functional verification.
