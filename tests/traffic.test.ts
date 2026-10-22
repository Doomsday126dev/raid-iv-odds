import { test } from "node:test";
import assert from "node:assert/strict";
import { trafficRequest, trafficOrigin, createTrafficRecorder, type TrafficContext } from "../src/traffic-core.ts";
const context: TrafficContext = { hostname: "doomsday126dev.github.io", pathname: "/raid-iv-odds/", online: true, automated: false, framed: false, privacyOptOut: false };
test("traffic sends only static page labels, with no query, token, title or referrer input", () => {
  const privateContext = { ...context, search: "?cp=61&pokemon=PRIVATE_INPUT&share=PRIVATE_CAPABILITY", hash: "#PRIVATE_DEX_TOKEN", referrer: "https://example.test/dex/PRIVATE_TOKEN", title: "PRIVATE_COLLECTION" };
  const request = trafficRequest("sample-site", "checker", privateContext)!;
  const url = new URL(request.url);
  assert.equal(url.origin, "https://sample-site.goatcounter.com");
  assert.deepEqual([...url.searchParams], [["p", "/"], ["t", "HundoCheck"], ["r", ""]]);
  assert.ok(!JSON.stringify(request).includes("PRIVATE"));
  assert.equal(request.options.referrerPolicy, "no-referrer");
  assert.equal(request.options.credentials, "omit");
  assert.equal(request.options.cache, "no-store");
  assert.equal(request.options.mode, "no-cors");
});
test("unknown, private and unrelated routes or hosts never produce traffic", () => {
  for (const pathname of ["/trade-app/", "/raid-iv-odds/dex/PRIVATE_TOKEN", "/raid-iv-odds/share/PRIVATE_TOKEN", "/raid-iv-odds/unknown"])
    assert.equal(trafficRequest("sample-site", "checker", {...context, pathname}), null);
  for (const hostname of ["localhost", "127.0.0.1", "evil.test", "shundoalert-free-relay.workers.dev"])
    assert.equal(trafficRequest("sample-site", "checker", {...context, hostname}), null);
  assert.equal(trafficRequest("sample-site", "advanced", context), null);
  const advanced = trafficRequest("sample-site", "advanced", {...context, pathname:"/raid-iv-odds/advanced.html"})!;
  assert.equal(new URL(advanced.url).searchParams.get("p"), "/advanced");
});
test("missing/invalid account codes fail closed and opt-outs/offline/automation are respected", () => {
  for (const value of [null, "", "../secret", "x.evil.test", "CODE", "https://example.test", "-bad", "bad-"])
    assert.equal(trafficOrigin(value), null);
  for (const overrides of [{online:false},{automated:true},{framed:true},{privacyOptOut:true}])
    assert.equal(trafficRequest("sample-site", "checker", {...context, ...overrides}), null);
});
test("recorder sends once per document and does not retry failures or log values", async () => {
  const calls: unknown[] = [];
  const record = createTrafficRecorder(((...args: unknown[]) => { calls.push(args); return Promise.reject(new Error("offline")); }) as typeof fetch);
  const request = trafficRequest("sample-site", "checker", context);
  record(null); record(request); record(request);
  await Promise.resolve();
  assert.equal(calls.length, 1);
  const throwing = createTrafficRecorder((() => { throw Error("blocked"); }) as typeof fetch);
  assert.doesNotThrow(() => throwing(request));
});
