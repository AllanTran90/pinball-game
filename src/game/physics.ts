import {
  BALL_RADIUS,
  FLIPPER_DOWN_SPEED,
  FLIPPER_LENGTH,
  FLIPPER_PIVOT_RADIUS,
  FLIPPER_TIP_RADIUS,
  FLIPPER_UP_SPEED,
} from "./constants";
import type { Flipper } from "./table";
import { closestOnSegment, type Vec } from "./vec";

export type Ball = { x: number; y: number; vx: number; vy: number };

export type Contact = { nx: number; ny: number; /** Normal speed into the surface before impact (positive). */ impact: number };

/**
 * Shared collision response for every surface: pushes the ball out of
 * `point` to `minDist`, then bounces it off with `restitution`.
 * `surfaceVel` is the velocity of the surface at the contact (moving flippers).
 */
function resolve(
  ball: Ball,
  point: Vec,
  minDist: number,
  restitution: number,
  surfaceVel: Vec = { x: 0, y: 0 },
): Contact | null {
  const dx = ball.x - point.x;
  const dy = ball.y - point.y;
  const distSq = dx * dx + dy * dy;
  if (distSq >= minDist * minDist) return null;

  const dist = Math.sqrt(distSq) || 0.0001;
  const nx = dx / dist;
  const ny = dy / dist;
  ball.x = point.x + nx * minDist;
  ball.y = point.y + ny * minDist;

  const rvx = ball.vx - surfaceVel.x;
  const rvy = ball.vy - surfaceVel.y;
  const vn = rvx * nx + rvy * ny;
  if (vn < 0) {
    ball.vx -= (1 + restitution) * vn * nx;
    ball.vy -= (1 + restitution) * vn * ny;
  }
  return { nx, ny, impact: Math.max(0, -vn) };
}

export function collideSegment(
  ball: Ball,
  a: Vec,
  b: Vec,
  restitution: number,
  oneSidedNormal?: Vec,
): Contact | null {
  if (oneSidedNormal) {
    const side = (ball.x - a.x) * oneSidedNormal.x + (ball.y - a.y) * oneSidedNormal.y;
    if (side < 0) return null;
  }
  return resolve(ball, closestOnSegment(ball, a, b), BALL_RADIUS, restitution);
}

export function collideCircle(ball: Ball, center: Vec, radius: number, restitution: number) {
  return resolve(ball, center, BALL_RADIUS + radius, restitution);
}

export function flipperTip(f: Flipper): Vec {
  return {
    x: f.pivot.x + Math.cos(f.angle) * FLIPPER_LENGTH,
    y: f.pivot.y + Math.sin(f.angle) * FLIPPER_LENGTH,
  };
}

export function moveFlipper(f: Flipper, pressed: boolean, dt: number) {
  const target = pressed ? f.upAngle : f.restAngle;
  const step = (pressed ? FLIPPER_UP_SPEED : FLIPPER_DOWN_SPEED) * dt;
  const diff = target - f.angle;
  const prev = f.angle;
  f.angle = Math.abs(diff) <= step ? target : f.angle + Math.sign(diff) * step;
  f.omega = (f.angle - prev) / dt;
}

export function collideFlipper(ball: Ball, f: Flipper, restitution: number) {
  const c = closestOnSegment(ball, f.pivot, flipperTip(f));
  const radius = FLIPPER_PIVOT_RADIUS + (FLIPPER_TIP_RADIUS - FLIPPER_PIVOT_RADIUS) * c.t;
  // Velocity of the flipper surface at the contact point: omega x r.
  const rx = c.x - f.pivot.x;
  const ry = c.y - f.pivot.y;
  return resolve(ball, c, BALL_RADIUS + radius, restitution, {
    x: -f.omega * ry,
    y: f.omega * rx,
  });
}

export function addImpulse(ball: Ball, c: Contact, strength: number) {
  ball.vx += c.nx * strength;
  ball.vy += c.ny * strength;
}
