// Independent, explicitly scoped aggregate oracle. Does not call application CP/bucket helpers.
// Run: node --experimental-strip-types scripts/audit-inference.mjs [report.json]
import { readFileSync, writeFileSync } from "node:fs";
import { analyzeShadowCatch } from "../src/encounters.ts";
const catalog = JSON.parse(
  readFileSync(new URL("../src/catalog.json", import.meta.url)),
).pokemon;
const contexts = [
  ["rocket-normal", 8, 0, 0.375235587358474],
  ["rocket-boosted", 13, 4, 0.481684952974319],
  ["raid-normal", 20, 6, 0.59740000963211],
  ["raid-boosted", 25, 6, 0.667934000492096],
];
const selected = [
  "BULBASAUR",
  "CHARIZARD",
  "WEEDLE",
  "MAGIKARP",
  "CATERPIE",
  "SHUCKLE",
  "MEWTWO",
  "GIRATINA_ALTERED",
  "GIRATINA_ORIGIN",
  "RATTATA_ALOLAN",
  "WOBBUFFET",
  "CHANSEY",
  "BLISSEY",
  "YAMASK_GALARIAN",
];
const report = {
  species: [],
  contextQueries: 0,
  matchingContextComparisons: 0,
  mismatches: [],
  method:
    "Independent loop/CP expression; compares exact matching counts, good counts, verdicts and rational equality without pooling contexts.",
};
for (const id of selected) {
  const p = catalog.find((p) => p.id === id);
  if (!p) throw Error("Missing audit species " + id);
  report.species.push(id);
  const models = contexts.map(([contextId, level, floor, multiplier]) => {
    const byCp = new Map();
    for (let stamina = floor; stamina <= 15; stamina++)
      for (let defense = floor; defense <= 15; defense++)
        for (let attack = floor; attack <= 15; attack++) {
          const cp = Math.max(
            10,
            Math.floor(
              ((p.atk + attack) *
                Math.sqrt((p.def + defense) * (p.sta + stamina)) *
                multiplier ** 2) /
                10,
            ),
          );
          const bin = byCp.get(cp) ?? { total: 0, good: 0 };
          bin.total++;
          bin.good += Number(
            Math.min(15, attack + 2) === 15 &&
              Math.min(15, defense + 2) === 15 &&
              Math.min(15, stamina + 2) === 15,
          );
          byCp.set(cp, bin);
        }
    return { id: contextId, byCp };
  });
  const targets = new Set([0, 9, 10, 99999]);
  for (const m of models) {
    const cps = [...m.byCp.keys()].sort((a, b) => a - b);
    for (const i of [
      0,
      1,
      Math.floor(cps.length / 2),
      cps.length - 2,
      cps.length - 1,
    ])
      for (const delta of [-1, 0, 1]) targets.add(cps[i] + delta);
    for (const cp of cps)
      if (models.filter((x) => x.byCp.has(cp)).length > 1) targets.add(cp);
  }
  const legal = models.filter(
      (m) => !m.id.startsWith("rocket") || p.rocketModelSupported,
    ),
    excluded = models.filter(
      (m) => m.id.startsWith("rocket") && !p.rocketModelSupported,
    );
  for (const cp of targets) {
    const expected = legal
        .filter((m) => m.byCp.has(cp))
        .map((m) => ({ id: m.id, ...m.byCp.get(cp) })),
      actual = analyzeShadowCatch(p, cp),
      got = actual.matches.map((m) => ({
        id: m.id,
        total: m.summary.total,
        good: m.summary.good,
      }));
    const outcome = !expected.length
      ? excluded.some((m) => m.byCp.has(cp))
        ? "unsupported"
        : "invalid"
      : expected.every((m) => m.good === 0)
        ? "none"
        : expected.every((m) => m.good === m.total)
          ? "all"
          : expected.every((m) => m.good > 0)
            ? "candidate"
            : "ambiguous";
    const same =
        expected.length > 0 &&
        expected.every(
          (m) => m.good * expected[0].total === expected[0].good * m.total,
        ),
      clarify = expected.length > 1 && (outcome === "ambiguous" || !same);
    if (
      JSON.stringify(got) !== JSON.stringify(expected) ||
      actual.outcome !== outcome ||
      actual.sameChance !== same ||
      actual.needsClarification !== clarify
    )
      report.mismatches.push({
        id,
        cp,
        expected,
        got,
        outcome,
        actualOutcome: actual.outcome,
        same,
        clarify,
      });
    report.contextQueries++;
    report.matchingContextComparisons += expected.length;
  }
}
if (process.argv[2])
  writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report));
if (report.mismatches.length) process.exitCode = 1;
