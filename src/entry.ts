// Existing shared links belong to the original calculator's parameter contract.
// Preserve its species aliases, Japanese names, hash precedence and custom floor
// semantics instead of silently translating unsupported state into defaults.
const query = new URLSearchParams(location.search);
const hash = location.hash.startsWith("#?")
  ? new URLSearchParams(location.hash.slice(2))
  : null;
const legacyQuery = ["pokemon", "boss", "floor"].some((key) => query.has(key));
const legacyHash =
  hash &&
  ["pokemon", "boss", "floor", "cp", "weather", "lang", "language"].some(
    (key) => hash.has(key),
  );
const legacy = legacyQuery || legacyHash;
if (legacy) {
  location.replace(`./advanced.html${location.search}${location.hash}`);
} else {
  void import("./main");
}
