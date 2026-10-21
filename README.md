# Hundo Check / Raid IV Odds

A mobile-first Pokémon GO tool for deciding whether a Shadow catch is worth checking for a purified hundo.

- Search 1,073 released species/forms, including ordinary Pokémon.
- Select Shadow raid or Rocket Grunt/Leader and enter catch CP; weather conditions are inferred automatically.
- Get one factual result; expand exact IV matches and probability details when needed.
- Search a separate level 8/13 **15/15/15 CP reference**. These are Rocket catch levels; normal wild levels vary. Matching CP alone does not prove perfect IVs.
- Switch the complete main interface and species/form search between English and 日本語.
- Read conditional purified-hundo percentages and exact qualifying IV tables, separately from already-perfect IV odds.
- Use the advanced calculator for custom raid floors, manual stats and detailed comparisons.

Live: https://doomsday126dev.github.io/raid-iv-odds/ (review branches do not change production).

## Development

```sh
npm ci
npm run dev
npm test
npm run build
# With local preview running and Google Chrome installed:
npm run test:ui
```

`npm run preview` serves the production build locally. UI tests use installed Chrome and Playwright WebKit, with desktop and iPhone 13 viewport/device emulation. Install matching WebKit with `npx playwright install webkit` first. Four service-worker cases are explicitly skipped in WebKit; Chromium covers them. Screenshots go to qa/.

Catalog refresh, sources, mechanics, audit, verification and limitations: [docs/REDESIGN.md](docs/REDESIGN.md). PvPoke MIT attribution: [docs/PVPOKE-LICENSE.txt](docs/PVPOKE-LICENSE.txt).

The app runs on-device, requires no account, and sends no calculator inputs to a server. Unofficial fan tool, not affiliated with Niantic, Scopely, The Pokémon Company, Nintendo, Creatures or GAME FREAK. Pokémon/game data belong to their owners. Confirm encounter settings and appraisal in-game.
