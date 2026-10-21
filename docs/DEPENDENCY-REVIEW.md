# Dependency advisory scope review

Reviewed the nine npm audit package findings against the lockfile, npm dependency tree, source imports, generated source maps, build output and deployment workflow. No broad package/native upgrades were made. This is an impact classification for this change, not a full security audit.

| Package | Reported severity | Reachable use here | Release assessment |
| --- | --- | --- | --- |
| @capacitor/android 8.3.4 | Critical | Native platform project only; no import in generated Pages JS | Not reachable in static Pages release. Block native packaging/release until fixed. |
| @capacitor/ios 8.3.4 | Critical | Native platform project only; no import in generated Pages JS | Same native-release blocker. |
| @xmldom/xmldom 0.9.10 | High | Capacitor CLI → plist XML parsing/serialization | Tooling; not shipped in browser. Do not process untrusted plist inputs with affected tooling. |
| brace-expansion 5.0.6 | High | Capacitor CLI → rimraf → glob → minimatch | Tooling pattern expansion; not browser runtime. |
| tar 7.5.15 | Critical | Capacitor CLI archive handling | Tooling; malicious archive input could cause denial of service. Not browser runtime. Patch before native tool workflows consuming untrusted archives. |
| postcss 8.5.14 | High | Vite CSS build | Build source-map traversal; no runtime CSS compiler or untrusted CSS upload in app. |
| nanoid 3.3.12 | High | Vite → PostCSS | Build tool identifier generation; no app-controlled size/custom generator entrypoint. |
| source-map-js 1.2.1 | High | Vite → PostCSS source-map processing | Build tool; indexed-map offsets can cause resource exhaustion with malicious maps. |
| vite 8.0.13 | High | Local dev/preview and CI bundling | Dev-server/launch-editor issues, notably Windows path and editor invocation. Production is static dist files, not Vite server. Keep dev preview loopback-only. |

The Capacitor platform advisory is [GHSA-rvm3-566m-v7fv](https://github.com/advisories/GHSA-rvm3-566m-v7fv): internal native HTTP proxy can load remote content under the app origin. This app's Pages bundle does not include native platforms and has no privileged native proxy. It remains a real concern for any future native release.

Representative build/tool advisories: [PostCSS](https://github.com/advisories/GHSA-r28c-9q8g-f849), [source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), [tar](https://github.com/advisories/GHSA-23hp-3jrh-7fpw), [Vite path handling](https://github.com/advisories/GHSA-fx2h-pf6j-xcff).

Conclusion: no demonstrated runtime path from these nine findings to the proposed static Pages application; they are not a static-web deployment blocker on current evidence. They are not dismissed: native releases require platform patches and build/dev tooling should be updated in a separately validated dependency change. The preview remains bound to 127.0.0.1, and CI processes repository-controlled sources.
