import {
  FLIPPER_REST_ANGLE,
  FLIPPER_UP_ANGLE,
  LANE_FLOOR,
  LANE_LEFT,
  LANE_RIGHT,
  LANE_TOP,
} from "./constants";
import type { Vec } from "./vec";

export type SegmentKind = "wall" | "sling" | "target" | "gate";

export type Segment = {
  a: Vec;
  b: Vec;
  kind: SegmentKind;
  /** Index into table.slings / table.targets for kickers and targets. */
  ref?: number;
  /** For one-sided segments: only collide when the ball is on this side. */
  normal?: Vec;
};

export type Bumper = { x: number; y: number; r: number; flash: number };
export type Sling = { points: Vec[]; flash: number };
export type Rollover = { x: number; y: number; r: number; lit: boolean; inside: boolean };
export type Target = { a: Vec; b: Vec; lit: boolean; flash: number };

export type Flipper = {
  pivot: Vec;
  /** +1 for the left flipper, -1 for the right (mirrors the angles). */
  side: 1 | -1;
  angle: number;
  restAngle: number;
  upAngle: number;
  omega: number;
};

export type Table = {
  segments: Segment[];
  /** Decorative outline of the outer playfield, drawn as a single path. */
  outline: Vec[];
  bumpers: Bumper[];
  slings: Sling[];
  rollovers: Rollover[];
  targets: Target[];
  flippers: Flipper[];
};

const ARC_CENTER = { x: 230, y: 222 };
const ARC_RADIUS = 210;
const CENTER_X = (20 + LANE_LEFT) / 2;

const mirror = (p: Vec): Vec => ({ x: CENTER_X * 2 - p.x, y: p.y });

function makeFlipper(pivot: Vec, side: 1 | -1): Flipper {
  // Right flipper angles are mirrored around the vertical axis.
  const rest = side === 1 ? FLIPPER_REST_ANGLE : Math.PI - FLIPPER_REST_ANGLE;
  const up = side === 1 ? FLIPPER_UP_ANGLE : Math.PI - FLIPPER_UP_ANGLE;
  return { pivot, side, angle: rest, restAngle: rest, upAngle: up, omega: 0 };
}

export function createTable(): Table {
  const segments: Segment[] = [];
  const wall = (a: Vec, b: Vec) => segments.push({ a, b, kind: "wall" });

  // Top arc, from the left wall over the top to the right wall.
  const arc: Vec[] = [];
  const ARC_STEPS = 32;
  for (let i = 0; i <= ARC_STEPS; i++) {
    const t = Math.PI + (i / ARC_STEPS) * Math.PI;
    arc.push({
      x: ARC_CENTER.x + Math.cos(t) * ARC_RADIUS,
      y: ARC_CENTER.y + Math.sin(t) * ARC_RADIUS,
    });
  }
  for (let i = 0; i < arc.length - 1; i++) wall(arc[i], arc[i + 1]);

  const leftPivot = { x: 134, y: 722 };
  const rightPivot = mirror(leftPivot);
  // Guides end on top of the pivot so the ball rolls smoothly onto the flipper.
  const leftGuideEnd = { x: leftPivot.x - 2, y: leftPivot.y - 12 };

  // Side walls and the inlane guides that funnel the ball to the flippers.
  wall({ x: 20, y: 222 }, { x: 20, y: 610 });
  wall({ x: 20, y: 610 }, leftGuideEnd);
  wall({ x: LANE_RIGHT, y: 222 }, { x: LANE_RIGHT, y: LANE_FLOOR });
  wall({ x: LANE_LEFT, y: LANE_TOP }, { x: LANE_LEFT, y: LANE_FLOOR });
  wall({ x: LANE_LEFT, y: LANE_FLOOR }, { x: LANE_RIGHT, y: LANE_FLOOR });
  wall({ x: LANE_LEFT, y: 610 }, mirror(leftGuideEnd));

  // One-way gate at the top of the plunger lane: lets the ball out, never back in.
  {
    const a = { x: LANE_LEFT, y: LANE_TOP };
    const b = { x: LANE_RIGHT, y: 234 };
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    segments.push({ a, b, kind: "gate", normal: { x: dy / len, y: -dx / len } });
  }

  // Rollover lane posts at the top.
  const postXs = [160, 205, 250, 295];
  for (const x of postXs) wall({ x, y: 74 }, { x, y: 112 });
  const rollovers: Rollover[] = [];
  for (let i = 0; i < postXs.length - 1; i++) {
    rollovers.push({
      x: (postXs[i] + postXs[i + 1]) / 2,
      y: 96,
      r: 9,
      lit: false,
      inside: false,
    });
  }

  // Slingshots above the flippers. The long inner edge kicks the ball.
  const leftSling = [
    { x: 60, y: 540 },
    { x: 60, y: 615 },
    { x: 112, y: 668 },
  ];
  const slings: Sling[] = [
    { points: leftSling, flash: 0 },
    { points: leftSling.map(mirror), flash: 0 },
  ];
  slings.forEach((s, i) => {
    const [a, b, c] = s.points;
    segments.push({ a, b, kind: "wall" });
    segments.push({ a: b, b: c, kind: "wall" });
    segments.push({ a: c, b: a, kind: "sling", ref: i });
  });

  // Stand-up targets along the left wall.
  const targets: Target[] = [400, 448, 496].map((y) => ({
    a: { x: 27, y },
    b: { x: 27, y: y + 30 },
    lit: false,
    flash: 0,
  }));
  targets.forEach((t, i) => segments.push({ a: t.a, b: t.b, kind: "target", ref: i }));

  const bumpers: Bumper[] = [
    { x: 150, y: 292, r: 25, flash: 0 },
    { x: 280, y: 286, r: 25, flash: 0 },
    { x: 215, y: 378, r: 25, flash: 0 },
  ];

  const outline: Vec[] = [
    leftGuideEnd,
    { x: 20, y: 610 },
    ...arc,
    { x: LANE_RIGHT, y: LANE_FLOOR },
  ];

  return {
    segments,
    outline,
    bumpers,
    slings,
    rollovers,
    targets,
    flippers: [makeFlipper(leftPivot, 1), makeFlipper(rightPivot, -1)],
  };
}
