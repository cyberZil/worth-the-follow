/**
 * Scoring is deliberately simple and transparent. For each enabled lens:
 *
 *   lensScore = weight * ( ticked_signals / total_signals
 *                        - ticked_counter_signals / total_counter_signals )
 *
 * and the account's "friction" is the sum across lenses, normalised to 0..1 by
 * the sum of weights. Friction is a *suggestion for ordering the results list*;
 * the person's own keep / let-go decision is always what counts.
 */

export const DEFAULT_WEIGHT = 2; // 0 = off, 1 = light, 2 = normal, 3 = strong

export function lensScore(lens, marks = {}) {
  const s = lens.signals?.length || 0;
  const c = lens.counter_signals?.length || 0;
  const ts = (marks.signals || []).length;
  const tc = (marks.counter || []).length;
  const pos = s ? ts / s : 0;
  const neg = c ? tc / c : 0;
  return pos - neg; // -1 .. 1
}

export function friction(account, lenses, weights) {
  let sum = 0;
  let wsum = 0;
  for (const lens of lenses) {
    const w = weights[lens.id] ?? DEFAULT_WEIGHT;
    if (!w) continue;
    const marks = account.marks?.[lens.id];
    if (!marks) continue;
    sum += w * lensScore(lens, marks);
    wsum += w;
  }
  if (!wsum) return 0;
  return (sum / wsum + 1) / 2; // map -1..1 → 0..1
}

export function topLenses(account, lenses, weights, n = 2) {
  return lenses
    .map((l) => ({ lens: l, score: lensScore(l, account.marks?.[l.id]) * (weights[l.id] ?? DEFAULT_WEIGHT) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.lens);
}
