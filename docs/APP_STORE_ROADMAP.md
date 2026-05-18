# App Store Roadmap

Raid IV Odds now has the shape of one app that can ship three ways:

1. Web app: hosted like a normal website.
2. PWA: installable from the browser, with offline caching and a standalone app window.
3. Native shell: wrapped with Capacitor for iOS and Android store distribution.

## Current Production Foundation

- Vite project scaffold: `package.json`, `vite.config.ts`, and `tsconfig.json`.
- TypeScript source modules for data, calculations, and app UI.
- Browser-ready JavaScript modules generated from TypeScript for the current local preview.
- Node test coverage for the IV/CP math.
- PWA manifest, service worker, icon, and privacy page under `public/`.
- Capacitor config targeting `dist/` as the native app web bundle.

## Local Commands

This Codex environment has Node but no `npm`/package manager on the shell path, so dependency installation could not be completed here. On a normal local machine with npm installed:

```sh
npm install
npm run test
npm run build
npm run dev
```

For the current no-build preview:

```sh
node scripts/build-browser-modules.mjs
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/index.html
```

## Native App Path

After `npm install` and `npm run build` work locally:

```sh
npm run cap:sync
npx cap add ios
npx cap add android
npm run cap:open:ios
npm run cap:open:android
```

Do not commit generated `ios/` and `android/` folders until the app identity, icons, signing, and release process are ready.

## Store Readiness Checklist

- Replace placeholder icon with full iOS/Android icon and splash asset sets.
- Keep branding clearly unofficial and avoid official Pokemon GO or Niantic assets.
- Publish the privacy policy at a stable URL before submission.
- Add accessibility checks for labels, contrast, Dynamic Type/text zoom, and touch target sizes.
- Add automated browser tests for theme switching, CP entry, watchlist filters, and install/offline behavior.
- Pin dependency versions with a lockfile after `npm install`.
- Decide whether the app will have analytics. If yes, update privacy policy and store disclosures first.
- Create screenshots for iPhone, iPad, Android phone, and Android tablet store listings.
