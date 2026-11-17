import {
  BALL_RADIUS,
  FLIPPER_PIVOT_RADIUS,
  FLIPPER_TIP_RADIUS,
  LANE_FLOOR,
  LANE_LEFT,
  LANE_RIGHT,
  TABLE_HEIGHT,
  TABLE_WIDTH,
} from "./constants";
import { COLORS, type Game } from "./engine";
import { flipperTip } from "./physics";
import type { Segment, Table } from "./table";
import type { Vec } from "./vec";

type Ctx = CanvasRenderingContext2D;

const WALL_COLOR = "#4de1ff";
const FLIPPER_COLOR = "#a78bfa";
const FONT = "600 13px ui-monospace, SFMono-Regular, Menlo, monospace";

/** Runs `draw` with a neon glow in `color`, restoring state afterwards. */
function glow(ctx: Ctx, color: string, blur: number, draw: () => void) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  draw();
  ctx.restore();
}

function polyline(ctx: Ctx, points: Vec[], close = false) {
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  if (close) ctx.closePath();
}

function strokeSegments(ctx: Ctx, segments: Segment[]) {
  ctx.beginPath();
  for (const s of segments) {
    ctx.moveTo(s.a.x, s.a.y);
    ctx.lineTo(s.b.x, s.b.y);
  }
  ctx.stroke();
}

/** Pulsing brightness for lights: lit, blinking (celebration) or dim. */
const lightAlpha = (lit: boolean, blinking: boolean, time: number) =>
  blinking ? (Math.sin(time * 20) > 0 ? 1 : 0.2) : lit ? 1 : 0.18;

// --- Static layer (drawn once per resize) ---------------------------------

export function drawStatic(ctx: Ctx, table: Table) {
  ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

  // Playfield surface
  const bg = ctx.createLinearGradient(0, 0, 0, TABLE_HEIGHT);
  bg.addColorStop(0, "#151536");
  bg.addColorStop(1, "#090918");
  ctx.fillStyle = bg;
  polyline(ctx, [...table.outline, { x: LANE_RIGHT, y: TABLE_HEIGHT }, { x: 20, y: TABLE_HEIGHT }], true);
  ctx.fill();

  // Subtle grid
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "rgba(120, 140, 255, 0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < TABLE_WIDTH; x += 24) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TABLE_HEIGHT);
  }
  for (let y = 0; y < TABLE_HEIGHT; y += 24) {
    ctx.moveTo(0, y);
    ctx.lineTo(TABLE_WIDTH, y);
  }
  ctx.stroke();

  // Center glow behind the bumpers
  const radial = ctx.createRadialGradient(215, 330, 10, 215, 330, 220);
  radial.addColorStop(0, "rgba(255, 62, 165, 0.12)");
  radial.addColorStop(1, "rgba(255, 62, 165, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  ctx.restore();

  // Plunger lane tint
  ctx.fillStyle = "rgba(77, 225, 255, 0.05)";
  ctx.fillRect(LANE_LEFT, 240, LANE_RIGHT - LANE_LEFT, LANE_FLOOR - 240);

  // Walls
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const walls = table.segments.filter((s) => s.kind === "wall");
  glow(ctx, WALL_COLOR, 14, () => {
    ctx.lineWidth = 3;
    strokeSegments(ctx, walls);
  });
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1;
  strokeSegments(ctx, walls);

  // Gate (dashed, one-way)
  ctx.save();
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = "rgba(77, 225, 255, 0.6)";
  ctx.lineWidth = 2;
  strokeSegments(ctx, table.segments.filter((s) => s.kind === "gate"));
  ctx.restore();

  // Drain label
  ctx.fillStyle = "rgba(167, 139, 250, 0.35)";
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.fillText("· NEON DRIFT ·", 212, 800);
}

// --- Dynamic layer (every frame) ------------------------------------------

export function drawFrame(ctx: Ctx, game: Game, staticLayer: CanvasImageSource, time: number) {
  const { table } = game;
  ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

  ctx.save();
  if (game.shake > 0) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }
  ctx.drawImage(staticLayer, 0, 0, TABLE_WIDTH, TABLE_HEIGHT);

  const celebrate = game.celebrating;

  // Rollovers
  for (const r of table.rollovers) {
    ctx.globalAlpha = lightAlpha(r.lit, celebrate.rollovers, time);
    glow(ctx, COLORS.rollover, r.lit ? 16 : 0, () => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Targets
  for (const t of table.targets) {
    ctx.globalAlpha = Math.max(lightAlpha(t.lit, celebrate.targets, time), t.flash);
    glow(ctx, COLORS.target, 14, () => {
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      polyline(ctx, [t.a, t.b]);
      ctx.stroke();
    });
  }
  ctx.globalAlpha = 1;

  // Slingshots
  for (const s of table.slings) {
    glow(ctx, COLORS.sling, 10 + s.flash * 25, () => {
      ctx.globalAlpha = 0.12 + s.flash * 0.5;
      polyline(ctx, s.points, true);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.5 + s.flash * 2;
      ctx.lineJoin = "round";
      ctx.stroke();
    });
  }

  // Bumpers
  for (const b of table.bumpers) {
    const r = b.r * (1 + b.flash * 0.12);
    glow(ctx, COLORS.bumper, 18 + b.flash * 30, () => {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    const fill = ctx.createRadialGradient(b.x, b.y - 6, 2, b.x, b.y, r);
    fill.addColorStop(0, b.flash > 0 ? "#ffffff" : "#ff8cc8");
    fill.addColorStop(1, `rgba(255, 62, 165, ${0.15 + b.flash * 0.6})`);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r - 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Plunger
  const pull = game.plungerCharge * 28;
  const plungerX = (LANE_LEFT + LANE_RIGHT) / 2;
  glow(ctx, WALL_COLOR, 10 + game.plungerCharge * 20, () => {
    ctx.fillRect(plungerX - 12, LANE_FLOOR - 4 + pull, 24, 5);
    ctx.globalAlpha = 0.5;
    ctx.fillRect(plungerX - 3, LANE_FLOOR + pull, 6, 30);
  });

  // Flippers
  for (const f of table.flippers) {
    const tip = flipperTip(f);
    glow(ctx, FLIPPER_COLOR, 18, () => {
      drawCapsule(ctx, f.pivot, tip, FLIPPER_PIVOT_RADIUS, FLIPPER_TIP_RADIUS);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(f.pivot.x, f.pivot.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (game.status === "playing") drawBall(ctx, game);

  // Particles
  for (const p of game.particles) {
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  }

  // Score popups
  ctx.font = FONT;
  ctx.textAlign = "center";
  for (const p of game.popups) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (game.message) drawMessage(ctx, game.message.text, game.message.life);
}

/** Tapered capsule path from `a` (radius ra) to `b` (radius rb). */
function drawCapsule(ctx: Ctx, a: Vec, b: Vec, ra: number, rb: number) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  ctx.beginPath();
  ctx.arc(a.x, a.y, ra, angle + Math.PI / 2, angle - Math.PI / 2);
  ctx.arc(b.x, b.y, rb, angle - Math.PI / 2, angle + Math.PI / 2);
  ctx.closePath();
}

function drawBall(ctx: Ctx, game: Game) {
  const { ball, trail } = game;
  trail.forEach((p, i) => {
    ctx.globalAlpha = (i / trail.length) * 0.35;
    ctx.fillStyle = WALL_COLOR;
    ctx.beginPath();
    ctx.arc(p.x, p.y, BALL_RADIUS * (i / trail.length), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const chrome = ctx.createRadialGradient(
    ball.x - 3, ball.y - 3, 1,
    ball.x, ball.y, BALL_RADIUS,
  );
  chrome.addColorStop(0, "#ffffff");
  chrome.addColorStop(0.5, "#c9d6ff");
  chrome.addColorStop(1, "#5a6390");
  glow(ctx, "#ffffff", 16, () => {
    ctx.fillStyle = chrome;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMessage(ctx: Ctx, text: string, life: number) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, life * 2);
  ctx.font = "800 26px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  glow(ctx, FLIPPER_COLOR, 24, () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, 212, 470);
  });
  ctx.restore();
}
