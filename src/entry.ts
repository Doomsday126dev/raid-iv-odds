// Existing shared links belong to the original calculator's parameter contract.
// Preserve its species aliases, Japanese names, hash precedence and custom floor
// semantics instead of silently translating unsupported state into defaults.
const query = new URLSearchParams(location.search);
const hash = location.hash.startsWith("#?")
  ? new URLSearchParams(location.hash.slice(2))
  : null;
const legacy = [query, hash].some(
  (params) =>
    params && ["pokemon", "boss", "floor"].some((key) => params.has(key)),
);
if (legacy) {
  location.replace(`./advanced.html${location.search}${location.hash}`);
} else {
  void import("./main");
}
