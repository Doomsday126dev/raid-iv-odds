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

export type ShadowContextId =
  "rocket-normal" | "rocket-boosted" | "raid-normal" | "raid-boosted";
export type ShadowContext = {
  id: ShadowContextId;
  encounter: Encounter;
  boosted: boolean;
  floor: number;
  summary: import("./math.ts").CpSummary;
};
export function analyzeShadowCatch(
  base: import("./math.ts").BaseStats & { rocketModelSupported?: boolean },
  cp: number,
) {
  const contexts: ShadowContext[] = (["rocket", "raid"] as const).flatMap(
    (encounter) =>
      analyzeEncounter(base, encounter, cp).contexts.map((context) => ({
        ...context,
        encounter,
        id: `${encounter}-${context.boosted ? "boosted" : "normal"}` as ShadowContextId,
      })),
  );
  const excludedMatches = contexts.filter(
    (context) =>
      context.encounter === "rocket" &&
      base.rocketModelSupported === false &&
      context.summary.total > 0,
  );
  const supportedContexts = contexts.filter(
    (context) =>
      context.encounter !== "rocket" || base.rocketModelSupported !== false,
  );
  const matches = supportedContexts.filter(
    (context) => context.summary.total > 0,
  );
  const outcome = !matches.length
    ? excludedMatches.length
      ? "unsupported"
      : "invalid"
    : matches.every((c) => c.summary.good === 0)
      ? "none"
      : matches.every((c) => c.summary.good === c.summary.total)
        ? "all"
        : matches.every((c) => c.summary.good > 0)
          ? "candidate"
          : "ambiguous";
  // Compare exact conditional ratios. Different denominators are never pooled:
  // encounter and weather priors are unknown, even if CP fits several contexts.
  const first = matches[0]?.summary;
  const sameChance =
    !!first &&
    matches.every(
      (c) => c.summary.good * first.total === first.good * c.summary.total,
    );
  const needsClarification =
    matches.length > 1 && (outcome === "ambiguous" || !sameChance);
  return {
    contexts: supportedContexts,
    excludedMatches,
    matches,
    outcome,
    sameChance,
    needsClarification,
  };
}
