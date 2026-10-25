/** Presentation-only distinction; never changes CP, IV or probability calculations. */
export function allMatchesAlreadyPerfect(
  contexts: readonly { summary: { combos: readonly { a: number; d: number; s: number }[] } }[],
): boolean {
  return contexts.length > 0 && contexts.every(({ summary }) =>
    summary.combos.length > 0 && summary.combos.every(c => c.a === 15 && c.d === 15 && c.s === 15));
}
