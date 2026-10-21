import { RAID_LEVELS, type RaidLevel } from "./math.ts";
export type Encounter = "raid" | "rocket";
export const ROCKET_LEVELS: readonly RaidLevel[] = [
  { key: "normal", label: "Not weather boosted", level: 8, cpm: 0.3752356 },
  { key: "boosted", label: "Weather boosted", level: 13, cpm: 0.48168495 },
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
