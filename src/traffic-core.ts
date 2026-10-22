/** Browser-only GoatCounter /count integration; no third-party script or DOM data. */
export type TrafficPage = "checker" | "advanced";
const pages = {
  checker: { path: "/", title: "HundoCheck", sources: ["/raid-iv-odds/", "/raid-iv-odds/index.html"] },
  advanced: { path: "/advanced", title: "HundoCheck advanced", sources: ["/raid-iv-odds/advanced.html"] },
} as const;
export function validSiteCode(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value);
}
export function trafficOrigin(siteCode: unknown): string | null {
  return validSiteCode(siteCode) ? `https://${siteCode}.goatcounter.com` : null;
}
export type TrafficContext = {
  hostname: string;
  pathname: string;
  online: boolean;
  automated: boolean;
  framed: boolean;
  privacyOptOut: boolean;
};
export function trafficRequest(siteCode: unknown, page: TrafficPage, context: TrafficContext) {
  const origin = trafficOrigin(siteCode);
  const definition = pages[page];
  if (!origin || !definition || context.hostname !== "doomsday126dev.github.io" ||
      !definition.sources.some(path => path === context.pathname) || !context.online ||
      context.automated || context.framed || context.privacyOptOut) return null;
  const url = new URL("/count", origin);
  // Only static allowlisted labels. Never copy location.href/search/hash, title,
  // document.referrer, calculator values, storage, or account/collection data.
  url.searchParams.set("p", definition.path);
  url.searchParams.set("t", definition.title);
  url.searchParams.set("r", "");
  return {
    url: url.href,
    options: {
      method: "GET", mode: "no-cors", credentials: "omit", cache: "no-store",
      referrerPolicy: "no-referrer", keepalive: true,
    } satisfies RequestInit,
  };
}
export function createTrafficRecorder(send: typeof fetch) {
  let recorded = false;
  return (request: ReturnType<typeof trafficRequest>) => {
    if (recorded || !request) return;
    recorded = true;
    // Best effort only: no offline queue, retries, persistent IDs, or error logs.
    try { void send(request.url, request.options).catch(() => {}); } catch { /* Optional traffic never blocks the app. */ }
  };
}
