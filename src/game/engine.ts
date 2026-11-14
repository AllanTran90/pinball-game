import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  LEFT_FLIPPER,
  RIGHT_FLIPPER,
} from "@/game/constants";
import { Ball, updateBall, drawBall } from "@/game/entities/Ball";
import { drawFlipper, checkFlipperCollision } from "./entities/Flipper";
import { inputState } from "@/game/input";

export function gameLoop(ctx: CanvasRenderingContext2D, ball: Ball) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBall(ctx, ball);
  drawFlipper(ctx, LEFT_FLIPPER);
  drawFlipper(ctx, RIGHT_FLIPPER);
  updateBall(ball);
  checkFlipperCollision(ball, LEFT_FLIPPER, inputState.leftActive, -1);
  checkFlipperCollision(ball, RIGHT_FLIPPER, inputState.rightActive, 1);
}
