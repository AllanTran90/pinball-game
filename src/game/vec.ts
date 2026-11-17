export type Vec = { x: number; y: number };

/** Closest point on segment ab to p, plus its parameter t in [0, 1]. */
export function closestOnSegment(p: Vec, a: Vec, b: Vec) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  let t = lenSq === 0 ? 0 : ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + abx * t, y: a.y + aby * t, t };
}

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
