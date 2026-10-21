import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  analyzeEncounter,
  encounterFloor,
  encounterLevel,
} from "../src/encounters.ts";
import {
  cpFor,
  summarizeCp,
  purifiedIv,
  combinationTotals,
} from "../src/math.ts";
const catalog = JSON.parse(
  readFileSync(new URL("../src/catalog.json", import.meta.url), "utf8"),
);
const get = (id: string) =>
  catalog.pokemon.find((p: { id: string }) => p.id === id);

test("known perfect CP fixtures at Rocket and raid levels", () => {
  for (const [id, cps] of [
    ["BULBASAUR", [251, 414, 637, 796]],
    ["CHARMANDER", [221, 364, 560, 700]],
    ["MEWTWO", [942, 1552, 2387, 2984]],
  ] as const) {
    const levels = [
      encounterLevel("rocket", false),
      encounterLevel("rocket", true),
      encounterLevel("raid", false),
      encounterLevel("raid", true),
    ];
    assert.deepEqual(
      levels.map((l) => cpFor(get(id), 15, 15, 15, l.cpm)),
      cps,
    );
  }
});
test("Magikarp max CP is neither a guaranteed hundo nor guaranteed purifiable", () => {
  const s = summarizeCp(
    get("MAGIKARP"),
    encounterLevel("rocket", false),
    61,
    0,
    2,
  );
  assert.equal(s.total, 10);
  assert.equal(s.good, 8);
  assert.ok(
    s.combos.some((c) => c.a === 15 && c.d === 12 && c.s === 15 && !c.good),
  );
  assert.ok(
    s.combos.some((c) => c.a === 15 && c.d === 15 && c.s === 12 && !c.good),
  );
});
test("Weedle max CP guarantees purifiability under this context but not original perfect IVs", () => {
  const s = summarizeCp(
    get("WEEDLE"),
    encounterLevel("rocket", false),
    102,
    0,
    2,
  );
  assert.equal(s.total, 4);
  assert.equal(s.good, 4);
  assert.equal(
    s.combos.filter((c) => c.a === 15 && c.d === 15 && c.s === 15).length,
    1,
  );
});
test("exact buckets avoid false positives from a minimum-to-maximum interval", () => {
  const p = get("BULBASAUR");
  const rocket = encounterLevel("rocket", false);
  const mixed = summarizeCp(p, rocket, 243, 0, 2);
  assert.ok(
    mixed.combos.some((c) => c.a === 13 && c.d === 13 && c.s === 13 && c.good),
  );
  assert.ok(
    mixed.combos.some((c) => c.a === 11 && c.d === 15 && c.s === 15 && !c.good),
  );
  const boosted = encounterLevel("rocket", true);
  assert.equal(cpFor(p, 13, 13, 13, boosted.cpm), 401);
  const gap = summarizeCp(p, boosted, 402, 4, 2);
  assert.ok(gap.total > 0);
  assert.equal(gap.good, 0);
  const impossible = summarizeCp(p, boosted, 99999, 4, 2);
  assert.equal(impossible.total, 0);
});
test("Rocket and raid floors, clamping, and minimum CP", () => {
  assert.equal(encounterFloor("rocket", false), 0);
  assert.equal(encounterFloor("rocket", true), 4);
  assert.equal(encounterFloor("raid", false), 6);
  assert.equal(encounterFloor("raid", true), 6);
  assert.equal(combinationTotals(0, 2).total, 4096);
  assert.equal(combinationTotals(4, 2).total, 1728);
  assert.equal(purifiedIv(14, 2), 15);
  assert.equal(cpFor({ atk: 1, def: 1, sta: 1 }, 0, 0, 0, 0.1), 10);
});
test("catalog has ordinary species, distinct regional forms and no transformed duplicates", () => {
  assert.ok(catalog.pokemon.length > 1000);
  assert.ok(get("RATTATA"));
  assert.ok(get("RATTATA_ALOLAN"));
  assert.equal(get("MEWTWO_ARMORED").shadow, false);
  assert.equal(
    new Set(catalog.pokemon.map((p: { id: string }) => p.id)).size,
    catalog.pokemon.length,
  );
  assert.ok(
    catalog.pokemon.every(
      (p: { id: string }) => !/(?:_shadow|_mega|_primal)(?:_|$)/i.test(p.id),
    ),
  );
});

test("full precision CPM preserves Charizard CP640 collision boundary", () => {
  const level = encounterLevel("rocket", false),
    p = get("CHARIZARD");
  assert.equal(level.cpm, 0.375235587358474);
  assert.equal(cpFor(p, 14, 10, 15, level.cpm), 639);
  const s = summarizeCp(p, level, 640, 0, 2);
  assert.equal(s.total, 10);
  assert.equal(s.good, 1);
  assert.equal(encounterLevel("rocket", true).cpm, 0.481684952974319);
});

test("weather inference handles unique, conflicting, absent and same-conclusion contexts", () => {
  const p = get("BULBASAUR");
  assert.deepEqual(
    analyzeEncounter(p, "rocket", 243).matches.map((c) => c.boosted),
    [false],
  );
  assert.deepEqual(
    analyzeEncounter(p, "rocket", 414).matches.map((c) => c.boosted),
    [true],
  );
  assert.equal(analyzeEncounter(p, "rocket", 99999).outcome, "invalid");
  const conflict = analyzeEncounter(get("SHUCKLE"), "rocket", 91);
  assert.equal(conflict.outcome, "ambiguous");
  assert.equal(conflict.matches.length, 2);
  assert.deepEqual(
    conflict.matches.map((c) => [c.summary.good, c.summary.total]),
    [
      [3, 4],
      [0, 1],
    ],
  );
  const same = analyzeEncounter({ atk: 1, def: 1, sta: 1 }, "rocket", 10);
  assert.equal(same.matches.length, 2);
  assert.equal(same.outcome, "candidate");
  assert.equal(analyzeEncounter(p, "raid", 243).outcome, "invalid");
  assert.equal(
    analyzeEncounter(get("MEWTWO"), "raid", 2984).matches[0]!.boosted,
    true,
  );
});
