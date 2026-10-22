// Manual audit: node --experimental-strip-types scripts/audit-calculations.mjs [report.json]
// Decimal CPMs pinned independently from PvPoke Pokemon.js at catalog revision.
import { readFileSync, writeFileSync } from "node:fs";
import { cpFor, enumerateCpBuckets, RAID_LEVELS } from "../src/math.ts";
import { perfectReference } from "../src/reference.ts";
import { ROCKET_LEVELS } from "../src/encounters.ts";
const catalog = JSON.parse(
  readFileSync(new URL("../src/catalog.json", import.meta.url)),
);
const contexts = [
  { level: ROCKET_LEVELS[0], floor: 0, decimal: "0.375235587358474" },
  { level: ROCKET_LEVELS[1], floor: 4, decimal: "0.481684952974319" },
  { level: RAID_LEVELS[0], floor: 6, decimal: "0.597400009632110" },
  { level: RAID_LEVELS[1], floor: 6, decimal: "0.667934000492096" },
].map((c) => ({
  ...c,
  n: BigInt(c.decimal.replace(".", "")) ** 4n,
  d: 100n * (10n ** 15n) ** 4n,
}));
const started = performance.now();
const report = {
  baseline: "ecea09581b2f18b6c96b26de745cfcb10527e6fb",
  species: catalog.pokemon.length,
  contexts: 4,
  cpComparisons: 0,
  bucketSpreads: 0,
  purificationChecks: 0,
  referenceChecks: 0,
  mismatches: [],
  method:
    "Exact BigInt squared inequalities using independently pinned decimal CPMs. k=floor(sqrt(A²DS × CPM⁴ /100)), min10.",
};
for (const p of catalog.pokemon) {
  for (const c of contexts) {
    if (c.level.cpm !== Number(c.decimal)) throw Error("CPM mismatch");
    const buckets = enumerateCpBuckets(p, c.level, c.floor, 2),
      seen = new Set();
    let goodTotal = 0;
    for (const [cp, combos] of buckets) {
      for (const triple of combos) {
        const { a, d, s } = triple;
        const key = a * 256 + d * 16 + s;
        if (seen.has(key)) throw Error("Duplicate spread");
        seen.add(key);
        if (a < c.floor || d < c.floor || s < c.floor)
          throw Error("Floor violation");
        const expected = a >= 13 && d >= 13 && s >= 13;
        if (
          triple.good !== expected ||
          triple.purified.a !== Math.min(15, a + 2) ||
          triple.purified.d !== Math.min(15, d + 2) ||
          triple.purified.s !== Math.min(15, s + 2)
        )
          throw Error("Purification mismatch");
        goodTotal += Number(expected);
        report.purificationChecks++;
        if (cpFor(p, a, d, s, c.level.cpm) !== cp)
          throw Error("Bucket mismatch");
      }
    }
    if (seen.size !== (16 - c.floor) ** 3 || goodTotal !== 27)
      throw Error("Missing legal spread or purifiable pool");
    report.bucketSpreads += seen.size;
    for (let a = 0; a < 16; a++)
      for (let d = 0; d < 16; d++)
        for (let s = 0; s < 16; s++) {
          const cp = cpFor(p, a, d, s, c.level.cpm),
            k = BigInt(cp),
            A = BigInt(p.atk + a),
            D = BigInt(p.def + d),
            S = BigInt(p.sta + s),
            num = A * A * D * S * c.n;
          if (
            (cp > 10 && k * k * c.d > num) ||
            (k + 1n) * (k + 1n) * c.d <= num
          ) {
            report.mismatches.push({
              id: p.id,
              level: c.level.level,
              a,
              d,
              s,
              cp,
            });
          }
          report.cpComparisons++;
        }
    const ref = perfectReference(p, c.level, c.floor),
      expected = buckets.get(ref.cp);
    if (
      ref.matches.length !== expected.length ||
      ref.collision !== expected.length > 1
    )
      throw Error("Reference collision mismatch");
    report.referenceChecks++;
    if (c.level.level >= 20) {
      const normal = perfectReference(p, c.level, 10),
        legal = (buckets.get(normal.cp) || []).filter(
          (x) => x.a >= 10 && x.d >= 10 && x.s >= 10,
        );
      if (
        normal.matches.length !== legal.length ||
        normal.collision !== legal.length > 1
      )
        throw Error("Normal raid reference mismatch");
      report.referenceChecks++;
    }
  }
}
report.durationMs = Math.round(performance.now() - started);
if (process.argv[2])
  writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report));
if (report.mismatches.length) process.exitCode = 1;
