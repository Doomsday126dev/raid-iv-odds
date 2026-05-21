(() => {
  if (!("serviceWorker" in navigator)) return;
  if (["127.0.0.1", "localhost"].includes(window.location.hostname)) return;

  const scriptUrl = document.currentScript?.src || `${window.location.origin}/raid-iv-odds/register-sw.js`;
  const scopeUrl = new URL("./", scriptUrl);

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("sw.js", scopeUrl), { scope: scopeUrl.href }).catch(() => {});
  });
})();
