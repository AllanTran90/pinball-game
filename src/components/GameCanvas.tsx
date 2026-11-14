"use client";

import { createBall, updateBall, drawBall } from "@/game/entities/Ball";
import { useEffect, useRef } from "react";
import {
  LEFT_FLIPPER, RIGHT_FLIPPER, CANVAS_WIDTH, CANVAS_HEIGHT } from "@/game/constants";
import { drawFlipper, checkFlipperCollision } from "@/game/entities/Flipper";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const ball = createBall();

    // 🟣 flippers state
    let leftActive = false;
    let rightActive = false;

    // 🎮 input
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") leftActive = true;
      if (e.key === "ArrowRight") rightActive = true;
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") leftActive = false;
      if (e.key === "ArrowRight") rightActive = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    function gameLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 🎨 boll
      drawBall(ctx, ball);

      // 🎮 flippers
      drawFlipper(ctx, LEFT_FLIPPER);
      drawFlipper(ctx, RIGHT_FLIPPER);

      // 🚀 fysik
      updateBall(ball);

      // 💥 collision
      checkFlipperCollision(ball, LEFT_FLIPPER, leftActive, -1);
      checkFlipperCollision(ball, RIGHT_FLIPPER, rightActive, 1);

      requestAnimationFrame(gameLoop);
    }

    gameLoop();

    // 🧹 cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border border-black bg-white"
    />
  );
}
