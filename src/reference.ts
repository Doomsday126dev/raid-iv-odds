import { cpFor, clampInt, type BaseStats, type RaidLevel } from "./math.ts";
export type ReferenceMatch = { a: number; d: number; s: number };
export type PerfectReference = {
  cp: number;
  level: number;
  floor: number;
  matches: ReferenceMatch[];
  collision: boolean;
};
export function perfectReference(
  base: BaseStats,
  level: RaidLevel,
  minimum: number,
): PerfectReference {
  const floor = clampInt(minimum, 0, 15, 0),
    cp = cpFor(base, 15, 15, 15, level.cpm),
    matches: ReferenceMatch[] = [];
  // Only retain exact hundo-CP matches, rather than allocating every CP bucket
  // for every visible reference cell. This is independent of purification odds.
  for (let a = floor; a <= 15; a++)
    for (let d = floor; d <= 15; d++)
      for (let s = floor; s <= 15; s++)
        if (cpFor(base, a, d, s, level.cpm) === cp) matches.push({ a, d, s });
  return {
    cp,
    level: level.level,
    floor,
    matches,
    collision: matches.length > 1,
  };
}
