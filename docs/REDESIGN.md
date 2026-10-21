# Purified-hundo checker: audit, implementation and verification

## Audit and roadmap

Inspected the repository, README, SECURITY, deployment workflow, original calculation logic, tests and deployed interface. No repository AGENTS.md was present. Work is isolated in a fresh clone on `redesign/purified-hundo-focus`; unrelated checkouts were not modified.

The original screen repeated verdicts, weather panels and ratios, while a 78-entry hand-maintained catalog emphasized legendary bosses. Its exact integer CP bucket enumeration was correct and retained. The roadmap was to simplify the primary decision, broaden species coverage, distinguish perfect CP from purifiable candidates, verify mechanics/edge cases, perform browser QA, then prepare a draft PR without production deployment.

## Approved Option A

The user selected the warm-paper/vermilion field-guide design. The main app now pairs species and CP compactly, uses restrained dividers and tabular numerals, and keeps the empty result to one hint. There are no green/purple accents, oversized instructional cards or visible level/IV subcaptions beneath reference headers. The archived static options remain in `docs/design-options/` for provenance.

Entering Pokémon and CP checks all supported Shadow raid and Rocket weather contexts automatically. A unique compatible context is inferred. If compatible contexts support the same safe conclusion, the result states it; differing outcomes or exact conditional percentages request clarification. Labels are **Non-weather boosted / Weather boosted**. No unsupported combined probability is produced across unknown encounter contexts.

Valid results show a prominent conditional purified-hundo percentage and matching-spread counts. Calculation details separate already-perfect IV probability, explain uniform-roll assumptions, and list exact IV triples before/after purification with textual qualifying indicators. Magikarp CP61 has 8/10 purifiable spreads (80%), versus 1/10 already perfect (10%). Weedle CP102 has 4/4 purifiable spreads (100%), versus 1/4 already perfect (25%). No-match input is distinct from a valid CP with no purifiable spread. Percentage formatting cannot round non-certainty to 100%.

## Mechanics and scope

Purification adds 2 to each IV, capped at 15; each IV must be at least 13 beforehand. Shadow battle damage bonuses do not change catch CP. CP collisions are enumerated exactly, not approximated by a minimum-to-maximum candidate interval. Full-precision CPMs come from pinned PvPoke calculation data. Charizard at level8 CP640 has 1/10 purifiable spreads; 14/10/15 belongs to CP639.

Rocket presets cover Grunts/Leaders: catch levels 8/13 and IV floors 0/4 for non-weather/weather boosted contexts. Shadow raids use levels 20/25 and floor 6. Giovanni, research, powered-up Pokémon and special events may differ. The maintainable rocketModelSupported policy excludes source-tagged legendary/mythical/Ultra Beast classes from standard Grunt/Leader inference, avoiding silently applying these floors to Giovanni-like catches. Other per-encounter availability is not asserted; the catalog source only flags historical Shadow eligibility. A valid all-match result is conditional on the correct species/form/encounter. Being purifiable is not advice that purification is the best battle choice.

The separate reference groups perfect CPs at Rocket 8/13 and raid 20/25 catch levels, with mobile group switching. Species names select the checker; CP cells open touch/keyboard-accessible exact IV details, with thin solid red outlines only for collisions. Rocket markers use floors 0/4 where the standard model is supported. Raid markers use Shadow floor 6 for historical Shadow species, otherwise normal floor 10; Shadow details also give the normal raid count. No repeated Check column remains. All 1,073 entries at both raid levels/floors are audited: current perfect-CP match counts happen to agree across floors 6/10, but the implementation computes each independently and synthetic minimum-CP regressions distinguish them. Normal wild Pokémon have varying levels; normal wild Pokémon have varying levels. Matching a reference CP alone does not prove perfect IVs. The catalog contains 1,073 released species/forms with positive stats, omitting Mega/Primal and duplicate Shadow variants. Historical Shadow eligibility is not a current encounter rotation; evolutions/forms in the reference are not all currently catchable. Non-eligible forms do not receive a purification verdict.

Sources:
- https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2396-shadow-pokemon-purified-pokemon/
- https://pokemongo.com/news/delightful-days-tgr-2025 (event exceptions)
- https://bulbapedia.bulbagarden.net/wiki/Shadow_Pok%C3%A9mon_(GO)
- https://github.com/pvpoke/pvpoke/blob/4d2908fac68d882bb6b4bdbbf1123a71fb62da31/src/js/pokemon/Pokemon.js

## Data, localization and compatibility

Base stats and gameplay metadata derive from pinned PvPoke commit `4d2908fac68d882bb6b4bdbbf1123a71fb62da31`; MIT attribution is in PVPOKE-LICENSE.txt. `level25CP` is deliberately unused because it is not perfect-IV CP. All reference values are computed from base stats and full CPMs locally.

Refresh: download `src/data/gamemaster/pokemon.json` at a reviewed full commit, then run `node scripts/update-catalog.mjs /path/to/pokemon.json FULL_COMMIT`. Review the catalog diff and run unit/build/browser checks. Catalog metadata records source revision, input SHA256 and generation date. Refresh Japanese labels alongside catalog changes.

The new main UI fully supports English/日本語: labels, result/error states, weather context, reference, help, details, type names and species/form search. All 1,073 entries have Japanese display names using pinned PokeAPI names and documented GO-specific display labels. English aliases, canonical IDs and Pokédex numbers remain searchable. Hiragana/katakana and half-width input normalize consistently. Language preference persists and preserves species, CP, confirmed encounter context, reference query and mobile reference mode. Earlier language links/preferences migrate. Attribution, source limitations and refresh instructions are in JAPANESE-DATA.md and POKEAPI-LICENSE.txt.

Original pokemon/boss/hash/custom-floor URLs route intact to advanced.html, preserving historical names, Japanese aliases and hash precedence. CP-only and language-only legacy hashes are supported. URL custom floors override saved floors, and unknown canonical species or unfinished search text never silently calculate a fallback Mewtwo. The advanced calculator retains custom floors/manual stats and detailed comparisons.

## Offline and privacy

The build generates the complete service-worker asset manifest and a content-derived cache key. Fresh installs cache both entrypoints and all emitted JS/CSS/name data. Activation removes only this app's older caches. Chromium tests install the actual prior v8 worker, update to the generated worker, preserve an unrelated origin cache, and reload offline. Offline language switching and Japanese reference search are also verified.

Native Safari installed the generated worker and opened the cached calculator after a localhost fixture began rejecting build-resource network requests. No production-origin cache or Mac network setting changed. Playwright WebKit lacks service-worker support, so its four offline cases are explicit skips. Native Safari v8 migration, physical iPhone/home-screen lifecycle and storage eviction are not claimed.

The localized primary JS is about 54KB gzipped, including catalog and both languages; there are no runtime name/data requests. Calculator inputs stay on-device. Screenshot delivery uses committed PNGs with verified public GitHub/raw URLs; no Library upload is claimed.

## Verification and remaining caveats

21 unit tests pass, including known CPs, Magikarp/Weedle collisions, non-contiguous Bulbasaur candidates, full-precision Charizard boundary, floors, caps, percent precision and Japanese coverage. Complete browser run: **80 passed, 4 explicitly skipped** across Chrome/WebKit desktop and iPhone-size layouts. Coverage includes 320px Japanese overflow, keyboard/form search, aliases, language persistence, 0/80/100% and ambiguous percentages, original-perfect distinction, IV row counts, reference routing, legacy URLs, light/dark, axe WCAG checks in both languages, fresh offline use and migration. Actual EN/JA screenshots in qa/ were visually reviewed. Production TypeScript/Vite build and git diff --check pass.

Nine pre-existing dependency advisory package findings were classified against the dependency tree and generated runtime. No demonstrated static Pages runtime path was found; native platform findings require patches before native releases. See DEPENDENCY-REVIEW.md. No broad native/tooling upgrade was performed.

Physical iPhone, exhaustive assistive-technology QA, low-storage eviction and real production-origin migration remain unverified. The user approved publication after the final inference/reference enhancements. The draft PR remains unmerged pending parent independent review of the final commit; production verification follows the existing Pages pipeline after that review.


## Approved refinement release

The user approved solid unfilled red number outlines, quieter reference controls and the compact dialog. Number glyphs use fixed right-aligned tracks; the absolutely positioned border cannot shift marked versus unmarked cell geometry. Persistent table-control underlines and the separate symbol are removed. The modal has three aligned IV columns and a short matching-combination count; technical assumptions and the normal-raid comparison remain available in collapsed details. English/Japanese and both themes retain keyboard/touch access and descriptive collision names. Calculations, data and collision eligibility are unchanged. Preview-only documents are not part of this implementation.

Advanced language choices now synchronize the main preference key, including choosing the already-active language. A browser regression reproduces the previous stale-language return and verifies both directions, reload persistence and explicit same-language selection.
