# Shadow Raid Purified Hundo Odds

This is a mobile-first web app for checking whether a Shadow Raid catch CP can purify to a 100% IV Pokemon.

The app now has a production scaffold: TypeScript source, generated browser modules, PWA assets, tests, and Capacitor config for a future iOS/Android wrapper.

## What Is A PWA?

A PWA, or Progressive Web App, is a website that can behave like a lightweight app on your phone. It can have an app icon, open in a standalone full-screen window, cache files for offline use, and later share most of the same code with a native wrapper.

## Run The Current Preview

This Codex environment has Node but no `npm` command available, so the app keeps generated browser-ready JavaScript checked in. To preview without installing dependencies:

```sh
node scripts/build-browser-modules.mjs
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/index.html`.

## Full Production Setup

On a normal development machine with npm installed:

```sh
npm install
npm run test
npm run build
npm run dev
```

## What Has Been Built

- Calculates the base odds from the selected raid IV floor and purification bonus instead of hard-coding `27 / 1000`.
- Treats `13/13/13` as eligible with the default `+2` purification bonus.
- Shows impossible CPs, possible-but-not-eligible CPs, mixed CP collisions, and guaranteed CPs separately.
- Handles both level 20 and level 25 catch scenarios side by side.
- Adds click-to-analyze CP watchlists for both non-weather boosted and weather boosted raids.
- Keeps manual base stats for missing or future Pokemon/forms.
- Adds persistent display preferences, dark mode, accent themes, compact density, CP steppers, watchlist filtering, and an at-a-glance verdict.
- Adds PWA starter files: `public/manifest.webmanifest`, `public/sw.js`, an app icon, and a privacy page.
- Adds `capacitor.config.ts` for future App Store and Play Store wrappers.

## Production Path

1. Turn this static prototype into a small bundled app with a build step, linting, unit tests, and end-to-end tests.
2. Add a versioned Pokemon/form stats data source and a review workflow for game updates.
3. Keep the PWA path for instant phone installation and offline use.
4. Wrap the same web app with Capacitor when it is time for iOS and Android store builds.
5. Before store submission, use original branding, avoid official logos/assets, add a clear unofficial/fan-tool disclosure, provide a privacy policy, and run accessibility/device QA.

## Verification

Run:

```sh
node --experimental-strip-types --test tests/*.test.ts
```

More detail lives in `docs/APP_STORE_ROADMAP.md`.
