# Basic sanitized traffic contract

HundoCheck collector: `https://doomsday126dev.goatcounter.com/count`.
Each sibling app must use its own verified public collector endpoint, never a shared HundoCheck code. Dashboard access stays private; tracker endpoints are public and require no password/API token.

## Collector requirements and visitor meaning

GoatCounter explicitly supports browser GET requests to `/count` and custom JavaScript integrations. Its documented stable query parameters are described at https://www.goatcounter.com/help/pixel . This implementation uses that public browser collector, not the authenticated server ingestion API. Requests originate in the visitor's browser, preserving the browser User-Agent and network IP used by the provider's session calculation; do not proxy or replay them through a Worker/backend.

Keep **Settings → Data collection → Sessions enabled**. Do not send `no_session` or disable sessions in the dashboard. The provider groups by site ID + User-Agent + IP in memory for roughly eight hours and deduplicates revisits to the same reported path. No cookie, client persistent ID or third-party JavaScript is needed. Omitting screen dimensions/referrer does not change this documented identity formula. This preserves the provider's session semantics, not exact unique humans or identical SDK bot filtering. See https://www.goatcounter.com/help/sessions . Each dashboard has independent estimates; do not sum them as globally unique people.

## Strict payload allowlist

One GET per visible top-level document load, only on the actual production hostname and reviewed route:

- `p`: static coarse label, such as `/`, `/advanced`, `/dex`, `/trade-share`. Derive it from an explicit route classification; never copy the raw route or concatenate its identifier.
- `t`: fixed generic app title, never `document.title` or collection/player text.
- `r`: explicitly empty string.
- No `q`, fragments, event flags, account/list/share IDs, Pokémon, CP, IVs, search text or custom properties.

Fetch options: `method: 'GET'`, `mode: 'no-cors'`, `credentials: 'omit'`, `cache: 'no-store'`, `referrerPolicy: 'no-referrer'`, `keepalive: true`. The collector returns a GIF; the fetch response is opaque, so network delivery alone is not dashboard collection proof.

Set an early HTML `<meta name="referrer" content="no-referrer">` (or stronger response header) before resources. Remove conflicting later policies. HundoCheck Advanced had a second policy overriding the first; the browser test caught it and it is removed. This is essential for capability-bearing Dex/share routes, including subresource and navigation HTTP referrers. Add only the exact collector origin to `connect-src`; no external script or wildcard is needed.

No history/CP/input/tab handlers, retries, offline queue or persistent storage. Skip local/preview hosts, automation, frames, offline, and supported DNT/GPC opt-outs. Defer hidden/prerendered documents until visible. Ignore collection failures without logging private data or interrupting the app. Updates to the DOM/URL alone do not count again.

For Dex, normalize `/dex/<capability>` to `/dex` in memory before constructing any collector request. For trade share/account routes, use a fixed `/trade-share` or `/trade` category, discarding every raw identifier, query, fragment and referrer. Do not record list/account data as titles or event properties. All three apps need synthetic private-value sentinel tests against payloads **and request headers**.

## HundoCheck files and verification

- `src/traffic-core.ts`: strict request construction and once-per-document sender.
- `src/traffic.ts`: browser eligibility/lifecycle adapter.
- `src/traffic-config.json`: public site code.
- `vite.config.ts`: exact collector CSP; deployment rejects missing site code.
- `index.html`, `advanced.html`: early no-referrer policy; no legacy Cloudflare tracking.
- `public/privacy.html`: EN/JA/DE disclosure.
- `tests/traffic.test.ts`, `scripts/test-traffic-browser.mjs`: privacy/eligibility/dedup and actual-browser request checks.

Run `npm test`, `GOATCOUNTER_REQUIRED=1 npm run build`, and `PLAYWRIGHT_BROWSERS_PATH=/tmp/raid-playwright node scripts/test-traffic-browser.mjs`. Browser tests intercept every request and never contact production or GoatCounter. They restore the original site configuration and rebuild afterward. Before release, verify real endpoint ownership/settings via the authenticated dashboard; after release, verify one controlled generic page load in the dashboard. Do not use a private Dex/share link for collector testing.
