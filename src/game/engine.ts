import {
  BALL_SPAWN,
  BALLS_PER_GAME,
  BUMPER_KICK,
  FLIPPER_RESTITUTION,
  GRAVITY,
  LANE_FLOOR,
  LANE_LEFT,
  MAX_BALL_SPEED,
  MAX_MULTIPLIER,
  PLUNGER_CHARGE_TIME,
  PLUNGER_MAX_SPEED,
  PLUNGER_MIN_SPEED,
  SCORE_BUMPER,
  SCORE_ROLLOVER,
  SCORE_ROLLOVER_COMPLETE,
  SCORE_SLING,
  SCORE_TARGET,
  SCORE_TARGET_COMPLETE,
  SLING_KICK,
  SUBSTEPS,
  TABLE_HEIGHT,
  TABLE_WIDTH,
  WALL_RESTITUTION,
} from "./constants";
import {
  addImpulse,
  collideCircle,
  collideFlipper,
  collideSegment,
  moveFlipper,
  type Ball,
} from "./physics";
import { createGoals, goalProgress, setGoal, type GoalId, type GoalProgress } from "./goals";
import { createTable, type Segment, type Table } from "./table";
import type { Vec } from "./vec";

export type GameStatus = "ready" | "playing" | "over";

export type Hud = {
  status: GameStatus;
  score: number;
  ball: number;
  extraBalls: number;
  multiplier: number;
  goals: GoalProgress[];
};

export type InputState = { left: boolean; right: boolean; plunger: boolean };

export type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
export type Popup = { x: number; y: number; text: string; life: number };

const BALL_SAVE_TIME = 5;
const MIN_TRIGGER_IMPACT = 60;

export const COLORS = {
  bumper: "#ff3ea5",
  sling: "#c6ff3d",
  target: "#ffb020",
  rollover: "#4de1ff",
  extraBall: "#fde047",
} as const;

export class Game {
  table: Table = createTable();
  ball: Ball = { ...BALL_SPAWN, vx: 0, vy: 0 };
  trail: Vec[] = [];
  input: InputState = { left: false, right: false, plunger: false };

  status: GameStatus = "ready";
  score = 0;
  ballNumber = 1;
  extraBalls = 0;
  multiplier = 1;
  goals = createGoals();

  plungerCharge = 0;
  shake = 0;
  particles: Particle[] = [];
  popups: Popup[] = [];
  message: { text: string; life: number } | null = null;

  private ballSave = 0;
  private ballSaveUsed = false;
  private rolloverCelebrate = 0;
  private targetCelebrate = 0;
  private prevInput: InputState = { left: false, right: false, plunger: false };
  private lastHud = "";

  constructor(private onHud: (hud: Hud) => void) {
    this.emitHud();
  }

  start() {
    this.table = createTable();
    this.score = 0;
    this.ballNumber = 1;
    this.extraBalls = 0;
    this.multiplier = 1;
    this.goals = createGoals();
    this.ballSaveUsed = false;
    this.status = "playing";
    this.spawnBall();
    this.emitHud();
  }

  get ballInLane() {
    return this.ball.x > LANE_LEFT && this.ball.y > LANE_FLOOR - 60;
  }

  update(frameDt: number) {
    const dt = Math.min(frameDt, 1 / 30);
    this.handleInputEdges();
    this.updateEffects(dt);

    if (this.status === "playing") this.updatePlunger(dt);

    const h = dt / SUBSTEPS;
    for (let i = 0; i < SUBSTEPS; i++) {
      this.table.flippers.forEach((f) =>
        moveFlipper(f, f.side === 1 ? this.input.left : this.input.right, h),
      );
      if (this.status === "playing") this.stepBall(h);
    }

    if (this.status === "playing") {
      this.trail.push({ x: this.ball.x, y: this.ball.y });
      if (this.trail.length > 14) this.trail.shift();
      this.checkDrain();
    }
    this.emitHud();
  }

  // --- Input -------------------------------------------------------------

  private handleInputEdges() {
    const pressedNow = (key: keyof InputState) => this.input[key] && !this.prevInput[key];
    // Flipper buttons rotate the lit top lanes, like on a real table.
    if (pressedNow("left")) this.rotateRollovers(-1);
    if (pressedNow("right")) this.rotateRollovers(1);
    this.prevInput = { ...this.input };
  }

  private rotateRollovers(dir: 1 | -1) {
    if (this.status !== "playing" || this.rolloverCelebrate > 0) return;
    const lit = this.table.rollovers.map((r) => r.lit);
    const n = lit.length;
    this.table.rollovers.forEach((r, i) => (r.lit = lit[(i - dir + n) % n]));
  }

  private updatePlunger(dt: number) {
    if (!this.ballInLane) {
      this.plungerCharge = 0;
      return;
    }
    if (this.input.plunger) {
      this.plungerCharge = Math.min(1, this.plungerCharge + dt / PLUNGER_CHARGE_TIME);
    } else if (this.plungerCharge > 0) {
      this.ball.vy = -(PLUNGER_MIN_SPEED + (PLUNGER_MAX_SPEED - PLUNGER_MIN_SPEED) * this.plungerCharge);
      this.plungerCharge = 0;
      if (!this.ballSaveUsed) this.ballSave = BALL_SAVE_TIME;
    }
  }

  // --- Physics -----------------------------------------------------------

  private stepBall(h: number) {
    const b = this.ball;
    b.vy += GRAVITY * h;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > MAX_BALL_SPEED) {
      b.vx *= MAX_BALL_SPEED / speed;
      b.vy *= MAX_BALL_SPEED / speed;
    }
    b.x += b.vx * h;
    b.y += b.vy * h;

    for (const seg of this.table.segments) this.hitSegment(seg);

    for (const bumper of this.table.bumpers) {
      const c = collideCircle(b, bumper, bumper.r, 0.6);
      if (!c) continue;
      addImpulse(b, c, BUMPER_KICK);
      bumper.flash = 1;
      this.shake = Math.max(this.shake, 4);
      this.burst(bumper.x + c.nx * bumper.r, bumper.y + c.ny * bumper.r, COLORS.bumper);
      this.award(SCORE_BUMPER, bumper.x, bumper.y - bumper.r);
      this.progress("bumpers", this.goals.bumpers.value + 1);
    }

    for (const f of this.table.flippers) collideFlipper(b, f, FLIPPER_RESTITUTION);

    this.checkRollovers();
  }

  private hitSegment(seg: Segment) {
    const c = collideSegment(this.ball, seg.a, seg.b, WALL_RESTITUTION, seg.normal);
    if (!c || c.impact < MIN_TRIGGER_IMPACT || seg.ref === undefined) return;

    if (seg.kind === "sling") {
      const sling = this.table.slings[seg.ref];
      addImpulse(this.ball, c, SLING_KICK);
      sling.flash = 1;
      this.burst(this.ball.x, this.ball.y, COLORS.sling);
      this.award(SCORE_SLING, this.ball.x, this.ball.y);
    } else if (seg.kind === "target") {
      const target = this.table.targets[seg.ref];
      target.flash = 1;
      if (target.lit || this.targetCelebrate > 0) return;
      target.lit = true;
      this.award(SCORE_TARGET, target.a.x + 20, target.a.y);
      if (this.table.targets.every((t) => t.lit)) {
        this.targetCelebrate = 1.5;
        this.award(SCORE_TARGET_COMPLETE, 110, 460);
        this.showMessage("TARGETS COMPLETE");
        this.progress("targets", this.goals.targets.value + 1);
      }
    }
  }

  private checkRollovers() {
    if (this.rolloverCelebrate > 0) return;
    for (const r of this.table.rollovers) {
      const inside = Math.hypot(this.ball.x - r.x, this.ball.y - r.y) < r.r + 6;
      if (inside && !r.inside && !r.lit) {
        r.lit = true;
        this.award(SCORE_ROLLOVER, r.x, r.y - 14);
      }
      r.inside = inside;
    }
    if (this.table.rollovers.every((r) => r.lit)) {
      this.rolloverCelebrate = 1.5;
      this.multiplier = Math.min(MAX_MULTIPLIER, this.multiplier + 1);
      this.award(SCORE_ROLLOVER_COMPLETE, 227, 130);
      this.showMessage(`MULTIPLIER ×${this.multiplier}`);
      this.progress("multiplier", this.multiplier);
    }
  }

  private checkDrain() {
    const b = this.ball;
    const escaped = b.x < -40 || b.x > TABLE_WIDTH + 40 || b.y < -40;
    if (escaped) return this.spawnBall(); // safety net, not the player's fault
    if (b.y < TABLE_HEIGHT + 30) return;

    if (this.ballSave > 0) {
      this.ballSaveUsed = true;
      this.showMessage("BALL SAVED");
    } else if (this.extraBalls > 0) {
      this.extraBalls--;
      this.startNextBall("SHOOT AGAIN");
    } else if (this.ballNumber >= BALLS_PER_GAME) {
      this.gameOver();
      return;
    } else {
      this.ballNumber++;
      this.startNextBall(`BALL ${this.ballNumber}`);
    }
    this.spawnBall();
  }

  private startNextBall(message: string) {
    this.multiplier = 1;
    this.ballSaveUsed = false;
    this.showMessage(message);
  }

  private spawnBall() {
    this.ball = { ...BALL_SPAWN, vx: 0, vy: 0 };
    this.trail = [];
    this.plungerCharge = 0;
    this.ballSave = 0;
  }

  private gameOver() {
    this.status = "over";
    this.trail = [];
  }

  // --- Scoring & effects -------------------------------------------------

  private award(points: number, x: number, y: number) {
    const total = points * this.multiplier;
    this.score += total;
    this.popups.push({ x, y, text: `+${total.toLocaleString("sv-SE")}`, life: 1 });
    this.progress("score", this.score);
  }

  /** Reports a goal's new value and hands out any extra balls it earned. */
  private progress(id: GoalId, value: number) {
    const earned = setGoal(this.goals, id, value);
    if (earned === 0) return;
    this.extraBalls += earned;
    this.showMessage("EXTRA BALL!");
    this.burst(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, COLORS.extraBall);
    this.burst(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, COLORS.target);
  }

  private showMessage(text: string) {
    this.message = { text, life: 1.8 };
  }

  private burst(x: number, y: number, color: string) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        color,
      });
    }
  }

  private updateEffects(dt: number) {
    const fade = (v: number, rate: number) => Math.max(0, v - dt * rate);
    const { bumpers, slings, targets, rollovers } = this.table;
    [...bumpers, ...slings, ...targets].forEach((o) => (o.flash = fade(o.flash, 4)));

    this.ballSave = fade(this.ballSave, 1);
    this.shake = fade(this.shake, 30);

    if (this.rolloverCelebrate > 0) {
      this.rolloverCelebrate = fade(this.rolloverCelebrate, 1);
      if (this.rolloverCelebrate === 0) rollovers.forEach((r) => (r.lit = false));
    }
    if (this.targetCelebrate > 0) {
      this.targetCelebrate = fade(this.targetCelebrate, 1);
      if (this.targetCelebrate === 0) targets.forEach((t) => (t.lit = false));
    }

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const p of this.popups) {
      p.y -= 40 * dt;
      p.life -= dt;
    }
    this.popups = this.popups.filter((p) => p.life > 0);

    if (this.message) {
      this.message.life -= dt;
      if (this.message.life <= 0) this.message = null;
    }
  }

  /** Celebration timers drive blinking lights in the renderer. */
  get celebrating() {
    return { rollovers: this.rolloverCelebrate > 0, targets: this.targetCelebrate > 0 };
  }

  private emitHud() {
    const hud: Hud = {
      status: this.status,
      score: this.score,
      ball: this.ballNumber,
      extraBalls: this.extraBalls,
      multiplier: this.multiplier,
      goals: goalProgress(this.goals),
    };
    const key = JSON.stringify(hud);
    if (key === this.lastHud) return;
    this.lastHud = key;
    this.onHud(hud);
  }
}
