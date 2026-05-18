import "./ux-enhancements";

export type BaseStats = {
  atk: number;
  def: number;
  sta: number;
};

export type RaidLevel = {
  key: "normal" | "boosted";
  label: string;
  level: 20 | 25;
  cpm: number;
};

export type IvCombo = {
  a: number;
  d: number;
  s: number;
  good: boolean;
  purified: {
    a: number;
    d: number;
    s: number;
  };
};

export type WatchlistRow = {
  cp: number;
  total: number;
  good: number;
  bad: number;
  odds: number;
  goodCombos: IvCombo[];
};

export type CpSummary = {
  raidLevel: RaidLevel;
  cp: number;
  minCp: number;
  maxCp: number;
  total: number;
  good: number;
  bad: number;
  odds: number;
  combos: IvCombo[];
  goodCombos: IvCombo[];
  buckets: Map<number, IvCombo[]>;
  watchlist: WatchlistRow[];
  nearestEligible: WatchlistRow[];
};

export const MAX_IV = 15;
export const MIN_CP = 10;

export const RAID_LEVELS: readonly RaidLevel[] = Object.freeze([
  Object.freeze({
    key: "normal",
    label: "Non-weather boosted",
    level: 20,
    cpm: 0.59740001,
  }),
  Object.freeze({
    key: "boosted",
    label: "Weather boosted",
    level: 25,
    cpm: 0.667934,
  }),
]);

function toInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  return Math.min(max, Math.max(min, toInt(value, fallback)));
}

export function cpFor(baseStats: BaseStats, ivAtk: number, ivDef: number, ivSta: number, cpm: number): number {
  const attack = Number(baseStats.atk) + Number(ivAtk);
  const defense = Number(baseStats.def) + Number(ivDef);
  const stamina = Number(baseStats.sta) + Number(ivSta);

  const cp = Math.floor((attack * Math.sqrt(defense) * Math.sqrt(stamina) * cpm * cpm) / 10);
  return Math.max(MIN_CP, cp);
}

export function purifiedIv(iv: number, purifyBonus: number): number {
  return Math.min(MAX_IV, Number(iv) + Number(purifyBonus));
}

export function isPurifiedHundo(combo: Pick<IvCombo, "a" | "d" | "s">, purifyBonus: number): boolean {
  return (
    purifiedIv(combo.a, purifyBonus) === MAX_IV &&
    purifiedIv(combo.d, purifyBonus) === MAX_IV &&
    purifiedIv(combo.s, purifyBonus) === MAX_IV
  );
}

export function purifiedThreshold(purifyBonus: number): number {
  return Math.max(0, MAX_IV - Math.max(0, Number(purifyBonus)));
}

export function combinationTotals(
  raidFloor: number,
  purifyBonus: number,
): { total: number; good: number; bad: number; odds: number } {
  const floor = clampInt(raidFloor, 0, MAX_IV, 6);
  const bonus = clampInt(purifyBonus, 0, MAX_IV, 2);
  const totalOptions = MAX_IV - floor + 1;
  const goodOptions = Math.max(0, MAX_IV - Math.max(floor, purifiedThreshold(bonus)) + 1);
  const total = totalOptions ** 3;
  const good = goodOptions ** 3;

  return {
    total,
    good,
    bad: total - good,
    odds: totalOptions ? good / total : 0,
  };
}

export function enumerateCpBuckets(
  baseStats: BaseStats,
  raidLevel: RaidLevel,
  raidFloor: number,
  purifyBonus: number,
): Map<number, IvCombo[]> {
  const floor = clampInt(raidFloor, 0, MAX_IV, 6);
  const bonus = clampInt(purifyBonus, 0, MAX_IV, 2);
  const buckets = new Map<number, IvCombo[]>();

  for (let a = floor; a <= MAX_IV; a += 1) {
    for (let d = floor; d <= MAX_IV; d += 1) {
      for (let s = floor; s <= MAX_IV; s += 1) {
        const cp = cpFor(baseStats, a, d, s, raidLevel.cpm);
        const combo: IvCombo = {
          a,
          d,
          s,
          good: false,
          purified: {
            a: purifiedIv(a, bonus),
            d: purifiedIv(d, bonus),
            s: purifiedIv(s, bonus),
          },
        };
        combo.good = isPurifiedHundo(combo, bonus);

        const existing = buckets.get(cp) ?? [];
        existing.push(combo);
        buckets.set(cp, existing);
      }
    }
  }

  return buckets;
}

export function summarizeCp(
  baseStats: BaseStats,
  raidLevel: RaidLevel,
  cp: number,
  raidFloor: number,
  purifyBonus: number,
): CpSummary {
  const buckets = enumerateCpBuckets(baseStats, raidLevel, raidFloor, purifyBonus);
  const targetCp = toInt(cp, 0);
  const combos = buckets.get(targetCp) || [];
  const goodCombos = combos.filter((combo) => combo.good);
  const allCps = Array.from(buckets.keys()).sort((a, b) => a - b);
  const watchlist = watchlistRowsFromBuckets(buckets);

  return {
    raidLevel,
    cp: targetCp,
    minCp: allCps[0] || 0,
    maxCp: allCps[allCps.length - 1] || 0,
    total: combos.length,
    good: goodCombos.length,
    bad: combos.length - goodCombos.length,
    odds: combos.length ? goodCombos.length / combos.length : 0,
    combos,
    goodCombos,
    buckets,
    watchlist,
    nearestEligible: nearestRows(watchlist, targetCp, 4),
  };
}

function watchlistRowsFromBuckets(buckets: Map<number, IvCombo[]>): WatchlistRow[] {
  return Array.from(buckets.entries())
    .map(([cp, combos]) => {
      const goodCombos = combos.filter((combo) => combo.good);
      return {
        cp,
        total: combos.length,
        good: goodCombos.length,
        bad: combos.length - goodCombos.length,
        odds: combos.length ? goodCombos.length / combos.length : 0,
        goodCombos,
      };
    })
    .filter((row) => row.good > 0)
    .sort((a, b) => b.cp - a.cp);
}

function nearestRows(rows: WatchlistRow[], cp: number, limit: number): WatchlistRow[] {
  return rows
    .slice()
    .sort((a, b) => {
      const distance = Math.abs(a.cp - cp) - Math.abs(b.cp - cp);
      return distance || b.cp - a.cp;
    })
    .slice(0, limit)
    .sort((a, b) => b.cp - a.cp);
}

export function maxCpFor(baseStats: BaseStats, raidLevel: RaidLevel): number {
  return cpFor(baseStats, MAX_IV, MAX_IV, MAX_IV, raidLevel.cpm);
}

function simplifyFraction(numerator: number, denominator: number): { numerator: number; denominator: number } {
  if (!denominator) return { numerator: 0, denominator: 0 };

  function gcd(a: number, b: number): number {
    return b ? gcd(b, a % b) : Math.abs(a);
  }

  const divisor = gcd(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  if (value === 1) return "100%";

  const percent = value * 100;
  if (percent < 1) return `${percent.toFixed(2)}%`;
  if (percent < 10) return `${percent.toFixed(1)}%`;
  return `${percent.toFixed(0)}%`;
}

export function formatRatio(good: number, total: number): string {
  if (!total) return "0/0";
  const fraction = simplifyFraction(good, total);
  return `${fraction.numerator}/${fraction.denominator}`;
}
