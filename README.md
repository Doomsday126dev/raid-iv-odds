# Raid IV Odds

A mobile-friendly calculator for checking Shadow Raid catch CPs and purified-hundo odds in Pokemon GO.

Live app:

```text
https://doomsday126dev.github.io/raid-iv-odds/
```

Feedback and corrections:

```text
https://github.com/doomsday126dev/raid-iv-odds/issues/new?template=feedback.yml
```

## What It Does

- Checks level 20 and weather-boosted level 25 raid catch CPs.
- Calculates the odds that a matching IV spread purifies to 15/15/15.
- Handles CP collisions where the same CP can come from multiple IV spreads.
- Supports custom raid IV floors and purification bonuses.
- Shows eligible CP watchlists for the selected boss.
- Supports English and Japanese, dark mode, shareable URLs, and Add to Home Screen.

There is also an Excel workbook in `outputs/raid-iv-odds/` for people who want an offline spreadsheet version.

## Local Development

```sh
npm install
npm run dev
```

Useful checks:

```sh
npm run test
npm run build
```

## Data

Pokemon base stats and localized names live in `src/data.ts`. CP and IV calculations live in `src/math.ts`.

If a boss/form is missing or a stat looks wrong, please open a feedback issue with the boss name, CP, and raid scenario.

## Privacy And Disclaimer

The app runs in the browser and does not require an account. Calculator inputs are processed on-device.

Unofficial fan-made calculator. Not affiliated with, sponsored by, endorsed by, or approved by Niantic, Scopely, The Pokemon Company, Nintendo, Creatures, or GAME FREAK. Pokemon and related names are trademarks of their respective owners.
