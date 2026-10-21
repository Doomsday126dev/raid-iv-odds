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

13 unit tests cover existing raid behavior, exact CP fixtures, Magikarp/Weedle max-CP collisions, Bulbasaur non-contiguous candidate buckets, floors, minimum CP, purification cap and catalog scope. Eight Playwright cases run desktop and iPhone 13 Chromium layouts, checking primary result states, keyboard search, regional forms, weather, watchlist selection, reference lookup/routing, dark mode, advanced page and horizontal overflow. Screenshots in qa/ were visually reviewed, with a mobile result shortcut added after the first review.

Build includes TypeScript checking and both entrypoints. Production bundle for the primary page is about 32KB gzipped JS including catalog. Mobile QA is emulation in installed Chrome, not a physical iPhone. Japanese remains available through the advanced calculator; the new primary interface is English. Safari-specific behavior and PWA offline update transitions need follow-up device QA before release.

The pre-existing lockfile reports nine npm advisories (including Capacitor/native tooling and Vite/build dependencies). This redesign adds Playwright but does not perform a broad dependency upgrade. Review/update those dependencies separately before native packaging; this is a static browser app without a backend or credentials.
