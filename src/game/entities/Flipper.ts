import {
  RADIUS,
  FLIPPER_KICK_VY,
  FLIPPER_KICK_VX,
  WEAK_BOUNCE,
  FLIPPER_WIDTH,
  FLIPPER_HEIGHT,
} from "@/game/constants";
import { Ball } from "./Ball";

export type Flipper = {
  x: number;
  y: number;
};

export function drawFlipper(ctx: CanvasRenderingContext2D, flipper: Flipper) {
  ctx.fillStyle = "black";
  ctx.fillRect(flipper.x, flipper.y, FLIPPER_WIDTH, FLIPPER_HEIGHT);
}

export function checkFlipperCollision(
  ball: Ball,
  flipper: Flipper,
  isActive: boolean,
  kickDirection: number,
) {
  if (
    ball.x > flipper.x &&
    ball.x < flipper.x + FLIPPER_WIDTH &&
    ball.y + RADIUS > flipper.y &&
    ball.y < flipper.y + FLIPPER_HEIGHT
  ) {
    if (isActive) {
      ball.vy = FLIPPER_KICK_VY;
      ball.vx = kickDirection * FLIPPER_KICK_VX;
    } else {
      ball.vy *= WEAK_BOUNCE;
    }
  }
}
