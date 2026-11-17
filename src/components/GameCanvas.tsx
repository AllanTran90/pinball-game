"use client";

import { useEffect, useRef, useState } from "react";
import { BALLS_PER_GAME, TABLE_HEIGHT, TABLE_WIDTH } from "@/game/constants";
import { Game, type Hud } from "@/game/engine";
import { bindInput } from "@/game/input";
import { drawFrame, drawStatic } from "@/game/render";

const fmt = (n: number) => n.toLocaleString("sv-SE");

/** Sizes a canvas to its CSS box at device resolution, in table coordinates. */
function fitCanvas(canvas: HTMLCanvasElement, cssWidth: number) {
  const dpr = window.devicePixelRatio || 1;
  const scale = (cssWidth / TABLE_WIDTH) * dpr;
  canvas.width = Math.round(TABLE_WIDTH * scale);
  canvas.height = Math.round(TABLE_HEIGHT * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return ctx;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const game = new Game(setHud);
    gameRef.current = game;

    const staticLayer = document.createElement("canvas");
    let ctx = fitCanvas(canvas, canvas.clientWidth);
    const resize = () => {
      ctx = fitCanvas(canvas, canvas.clientWidth);
      drawStatic(fitCanvas(staticLayer, canvas.clientWidth), game.table);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const unbind = bindInput(
      game.input,
      canvas,
      () => game.status === "playing",
      () => game.start(),
    );

    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      game.update((now - last) / 1000);
      last = now;
      drawFrame(ctx, game, staticLayer, now / 1000);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      unbind();
    };
  }, []);

  const status = hud?.status ?? "ready";

  return (
    <div className="flex w-full flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center lg:gap-10">
      <aside className="order-2 grid w-full max-w-115 grid-cols-2 gap-3 text-xs text-white/50 lg:order-1 lg:mt-28 lg:w-56 lg:grid-cols-1">
        <Control keys={["←", "A"]} label="Vänster flipper" />
        <Control keys={["→", "D"]} label="Höger flipper" />
        <Control keys={["Space", "↓"]} label="Håll & släpp för att skjuta" />
        <Control keys={["Touch"]} label="Tryck vänster / höger halva" />
      </aside>

      <div
        className="order-1 flex flex-col gap-3 lg:order-2"
        // Fit the table to the viewport height, leaving room for the HUD.
        style={{ width: `min(100%, 460px, calc((100dvh - 140px) * ${TABLE_WIDTH / TABLE_HEIGHT}))` }}
      >
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Poäng" value={fmt(hud?.score ?? 0)} accent />
          <Stat label="Boll" value={`${hud?.ball ?? 1} / ${BALLS_PER_GAME}`} />
          <Stat label="Multi" value={`×${hud?.multiplier ?? 1}`} />
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            className="block h-auto w-full touch-none select-none rounded-[28px] bg-[#090918] shadow-[0_0_0_1px_rgba(167,139,250,0.25),0_30px_80px_-20px_rgba(124,58,237,0.55)]"
            style={{ aspectRatio: `${TABLE_WIDTH} / ${TABLE_HEIGHT}` }}
          />

          {status !== "playing" && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[28px] bg-black/55 text-center backdrop-blur-[2px]">
              {status === "over" && (
                <>
                  <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-300">Game over</p>
                  <p className="font-mono text-5xl font-bold text-white">{fmt(hud?.score ?? 0)}</p>
                </>
              )}
              {status === "ready" && (
                <h2 className="bg-linear-to-r from-cyan-300 via-violet-300 to-fuchsia-400 bg-clip-text text-5xl font-black tracking-tight text-transparent">
                  NEON DRIFT
                </h2>
              )}
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                Rekord {fmt(hud?.highScore ?? 0)}
              </p>
              <button
                type="button"
                onClick={() => gameRef.current?.start()}
                className="pointer-events-auto mt-2 rounded-full bg-linear-to-r from-cyan-400 to-fuchsia-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-105 active:scale-95"
              >
                {status === "over" ? "Spela igen" : "Starta"}
              </button>
              <p className="text-[11px] text-white/40">eller tryck Space / Enter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 px-3 py-2 backdrop-blur">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className={`font-mono text-lg font-semibold tabular-nums ${accent ? "text-cyan-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function Control({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {keys.map((k) => (
          <kbd key={k} className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-white/80">
            {k}
          </kbd>
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}
