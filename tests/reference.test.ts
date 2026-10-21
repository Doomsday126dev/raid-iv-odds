import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { perfectReference } from "../src/reference.ts";
import { cpFor, RAID_LEVELS } from "../src/math.ts";
import type { BaseStats } from "../src/math.ts";
import { ROCKET_LEVELS } from "../src/encounters.ts";
const catalog: Array<BaseStats & { id: string }> = JSON.parse(
  readFileSync(new URL("../src/catalog.json", import.meta.url), "utf8"),
).pokemon;
test("perfect CP reference reports exact collisions without hundo certainty", () => {
  const magikarp = catalog.find((p) => p.id === "MAGIKARP")!;
  const weedle = catalog.find((p) => p.id === "WEEDLE")!;
  const r = perfectReference(magikarp, ROCKET_LEVELS[0], 0);
  assert.equal(r.cp, 61);
  assert.equal(r.matches.length, 10);
  assert.equal(r.collision, true);
  assert.equal(perfectReference(weedle, ROCKET_LEVELS[0], 0).matches.length, 4);
  const bulba = catalog.find((p) => p.id === "BULBASAUR")!;
  assert.deepEqual(
    [...ROCKET_LEVELS, ...RAID_LEVELS].map(
      (l) => perfectReference(bulba, l, 0).cp,
    ),
    [251, 414, 637, 796],
  );
});
test("raid collision audit covers every catalog species at both levels and both floors", () => {
  let collisions = 0,
    differences = 0;
  for (const p of catalog)
    for (const level of RAID_LEVELS) {
      const shadow = perfectReference(p, level, 6),
        normal = perfectReference(p, level, 10);
      assert.equal(shadow.cp, normal.cp);
      assert.ok(normal.matches.length <= shadow.matches.length);
      for (const r of [shadow, normal]) {
        assert.equal(r.collision, r.matches.length > 1);
        assert.equal(
          r.matches.filter((c) => c.a === 15 && c.d === 15 && c.s === 15)
            .length,
          1,
        );
        for (const c of r.matches)
          assert.equal(cpFor(p, c.a, c.d, c.s, level.cpm), r.cp);
      }
      if (shadow.collision) collisions++;
      if (shadow.matches.length !== normal.matches.length) differences++;
    }
  assert.ok(collisions > 0);
  // Current perfect-CP collisions stay above both floors; do not invent a difference.
  assert.equal(differences, 0);
  const synthetic = { atk: 1, def: 1, sta: 1 };
  assert.ok(
    perfectReference(synthetic, RAID_LEVELS[0]!, 6).matches.length >
      perfectReference(synthetic, RAID_LEVELS[0]!, 10).matches.length,
  );
});
