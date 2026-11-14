import {
  RADIUS,
  GRAVITY,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FLOOR_BOUNCE,
} from "@/game/constants";

export type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export function createBall(): Ball {
  return {
    x: 200,
    y: 200,
    vx: 3,
    vy: 4,
  };
}

export function updateBall(ball: Ball) {
  ball.x += ball.vx;
  ball.vy += GRAVITY;
  ball.y += ball.vy;

  // 🧱 golv
  if (ball.y + RADIUS > CANVAS_HEIGHT) {
    ball.y = CANVAS_HEIGHT - RADIUS;
    ball.vy *= FLOOR_BOUNCE; // studs
  }

  // 🧱 väggar
  if (ball.x + RADIUS > CANVAS_WIDTH || ball.x - RADIUS < 0) {
    ball.vx *= -1;
  }
}

export function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, RADIUS, 0, Math.PI * 2);
  ctx.fill();
}
