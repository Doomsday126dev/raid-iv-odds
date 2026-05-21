import assert from "node:assert/strict";
import test from "node:test";
import { POKEMON } from "../src/data.ts";
import {
  RAID_LEVELS,
  combinationTotals,
  cpFor,
  isPurifiedHundo,
  maxCpFor,
  summarizeCp,
} from "../src/math.ts";

const mewtwo = POKEMON.find((pokemon) => pokemon.name === "Mewtwo");
const normal = RAID_LEVELS.find((level) => level.key === "normal");
const boosted = RAID_LEVELS.find((level) => level.key === "boosted");

test("matches known Mewtwo hundo CPs", () => {
  assert.ok(mewtwo);
  assert.ok(normal);
  assert.ok(boosted);

  assert.equal(cpFor(mewtwo, 15, 15, 15, normal.cpm), 2387);
  assert.equal(cpFor(mewtwo, 15, 15, 15, boosted.cpm), 2984);
});

test("calculates the default shadow raid purified hundo pool", () => {
  const totals = combinationTotals(6, 2);

  assert.equal(totals.total, 1000);
  assert.equal(totals.good, 27);
  assert.equal(totals.bad, 973);
});

test("uses 13/13/13 as the default pre-purification threshold", () => {
  assert.equal(isPurifiedHundo({ a: 13, d: 13, s: 13 }, 2), true);
  assert.equal(isPurifiedHundo({ a: 15, d: 13, s: 12 }, 2), false);
});

test("separates impossible CPs from possible CPs", () => {
  assert.ok(mewtwo);
  assert.ok(normal);
  const impossible = summarizeCp(mewtwo, normal, 10, 6, 2);
  const maxSummary = summarizeCp(mewtwo, normal, 2387, 6, 2);

  assert.equal(impossible.total, 0);
  assert.equal(impossible.good, 0);
  assert.ok(maxSummary.total > 0);
  assert.equal(maxSummary.good, maxSummary.total);
});

test("keeps mixed CP collisions in the watchlist", () => {
  const hasMixedCollision = POKEMON.some((pokemon) =>
    RAID_LEVELS.some((level) => {
      const summary = summarizeCp(pokemon, level, maxCpFor(pokemon, level), 6, 2);
      return summary.watchlist.some((row) => row.good > 0 && row.good < row.total);
    }),
  );

  assert.equal(hasMixedCollision, true);
});

test("recalculates odds when the raid IV floor changes", () => {
  assert.ok(mewtwo);
  assert.ok(normal);

  const defaultFloor = summarizeCp(mewtwo, normal, 2200, 6, 2);
  const lowerFloor = summarizeCp(mewtwo, normal, 2200, 3, 2);

  assert.equal(defaultFloor.total, 0);
  assert.equal(defaultFloor.good, 0);
  assert.equal(lowerFloor.total, 5);
  assert.equal(lowerFloor.good, 0);
});

test("supports custom attack defense and stamina IV floors", () => {
  const totals = combinationTotals({ a: 5, d: 6, s: 7 }, 2);

  assert.equal(totals.total, 11 * 10 * 9);
  assert.equal(totals.good, 3 * 3 * 3);
});
