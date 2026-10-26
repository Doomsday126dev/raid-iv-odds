import config from "./traffic-config.json";
import { createTrafficRecorder, trafficRequest, readScreenWidth, type TrafficPage } from "./traffic-core";
const record = createTrafficRecorder((...args) => fetch(...args));
let initialized = false;
export function recordTraffic(page: TrafficPage): void {
  if (initialized) return;
  initialized = true;
  const attempt = () => {
    if (document.visibilityState !== "visible" || (document as Document & { prerendering?: boolean }).prerendering) return;
    document.removeEventListener("visibilitychange", attempt);
    document.removeEventListener("prerenderingchange", attempt);
    record(trafficRequest(config.siteCode, page, {
      screenWidth: readScreenWidth(() => window.screen?.width),
      hostname: location.hostname,
      pathname: location.pathname,
      online: navigator.onLine,
      automated: navigator.webdriver,
      framed: window.top !== window.self,
      privacyOptOut: navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true,
    }));
  };
  document.addEventListener("visibilitychange", attempt);
  document.addEventListener("prerenderingchange", attempt);
  attempt();
}
