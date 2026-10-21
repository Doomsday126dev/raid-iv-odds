import { RAID_LEVELS, summarizeCp, type RaidLevel } from "./math.ts";
export type Encounter = "raid" | "rocket";
export const ROCKET_LEVELS: readonly RaidLevel[] = [
  {
    key: "normal",
    label: "Non-weather boosted",
    level: 8,
    cpm: 0.375235587358474,
  },
  {
    key: "boosted",
    label: "Weather boosted",
    level: 13,
    cpm: 0.481684952974319,
  },
];
export function encounterLevel(
  encounter: Encounter,
  boosted: boolean,
): RaidLevel {
  return (encounter === "rocket" ? ROCKET_LEVELS : RAID_LEVELS)[
    boosted ? 1 : 0
  ]!;
}
export function encounterFloor(encounter: Encounter, boosted: boolean): number {
  return encounter === "raid" ? 6 : boosted ? 4 : 0;
}

export function analyzeEncounter(
  base: import("./math.ts").BaseStats,
  encounter: Encounter,
  cp: number,
) {
  const contexts = [false, true].map((boosted) => {
    const level = encounterLevel(encounter, boosted);
    const floor = encounterFloor(encounter, boosted);
    return { boosted, floor, summary: summarizeCp(base, level, cp, floor, 2) };
  });
  const matches = contexts.filter((context) => context.summary.total > 0);
  const outcome = !matches.length
    ? "invalid"
    : matches.every((c) => c.summary.good === 0)
      ? "none"
      : matches.every((c) => c.summary.good === c.summary.total)
        ? "all"
        : matches.every((c) => c.summary.good > 0)
          ? "candidate"
          : "ambiguous";
  return { contexts, matches, outcome };
}
