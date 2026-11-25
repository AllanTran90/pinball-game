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
    <div className="layout">
      <aside className="controls">
        <Control keys={["←", "A"]} label="Vänster flipper" />
        <Control keys={["→", "D"]} label="Höger flipper" />
        <Control keys={["Space", "↓"]} label="Håll & släpp för att skjuta" />
        <Control keys={["Touch"]} label="Tryck vänster / höger halva" />
      </aside>

      <div
        className="table-column"
        // Fit the table to the viewport height, leaving room for the HUD.
        style={{ width: `min(100%, 460px, calc((100dvh - 140px) * ${TABLE_WIDTH / TABLE_HEIGHT}))` }}
      >
        <div className="stats">
          <Stat label="Poäng" value={fmt(hud?.score ?? 0)} accent />
          <Stat label="Boll" value={`${hud?.ball ?? 1} / ${BALLS_PER_GAME}`} />
          <Stat label="Multi" value={`×${hud?.multiplier ?? 1}`} />
        </div>

        <div className="table">
          <canvas
            ref={canvasRef}
            style={{ aspectRatio: `${TABLE_WIDTH} / ${TABLE_HEIGHT}` }}
          />

          {status !== "playing" && (
            <div className="overlay">
              {status === "over" && (
                <>
                  <p className="game-over">Game over</p>
                  <p className="final-score">{fmt(hud?.score ?? 0)}</p>
                </>
              )}
              {status === "ready" && (
                <h1 className="title">
                  NEON DRIFT
                </h1>
              )}
              <p className="record">
                Rekord {fmt(hud?.highScore ?? 0)}
              </p>
              <button
                type="button"
                onClick={() => gameRef.current?.start()}
                className="start-button"
              >
                {status === "over" ? "Spela igen" : "Starta"}
              </button>
              <p className="hint">eller tryck Space / Enter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="stat">
      <p className="label">{label}</p>
      <p className={accent ? "stat-value accent" : "stat-value"}>
        {value}
      </p>
    </div>
  );
}

function Control({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="control">
      <div className="keys">
        {keys.map((k) => (
          <kbd key={k}>
            {k}
          </kbd>
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}
