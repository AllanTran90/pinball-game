import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { BALLS_PER_GAME, TABLE_HEIGHT, TABLE_WIDTH } from "@/game/constants";
import { Game, type Hud } from "@/game/engine";
import type { GoalProgress } from "@/game/goals";
import {
  addHighScore,
  loadHighScores,
  MAX_NAME_LENGTH,
  qualifies,
  type HighScore,
} from "@/game/highscores";
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
  const [scores, setScores] = useState<HighScore[]>(loadHighScores);
  /** Position of the score saved after the last game, or null if none yet. */
  const [savedRank, setSavedRank] = useState<number | null>(null);

  const status = hud?.status ?? "ready";
  const score = hud?.score ?? 0;
  const enteringName = status === "over" && savedRank === null && qualifies(score, scores);

  const startGame = () => {
    setSavedRank(null);
    gameRef.current?.start();
  };

  // Keyboard/touch start goes through refs so the input binding never goes stale.
  const startRef = useRef(startGame);
  const blockStartRef = useRef(false);
  useEffect(() => {
    startRef.current = startGame;
    blockStartRef.current = enteringName;
  });

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
      () => !blockStartRef.current && startRef.current(),
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

  const saveScore = (name: string) => {
    const { list, rank } = addHighScore(name, score);
    setScores(list);
    setSavedRank(rank);
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <section className="controls">
          <Control keys={["←", "A"]} label="Vänster flipper" />
          <Control keys={["→", "D"]} label="Höger flipper" />
          <Control keys={["Space", "↓"]} label="Håll & släpp för att skjuta" />
          <Control keys={["Touch"]} label="Tryck vänster / höger halva" />
        </section>
        <Goals goals={hud?.goals ?? []} />
      </aside>

      <div
        className="table-column"
        // Fit the table to the viewport height, leaving room for the HUD.
        style={{ width: `min(100%, 460px, calc((100dvh - 140px) * ${TABLE_WIDTH / TABLE_HEIGHT}))` }}
      >
        <div className="stats">
          <Stat label="Poäng" value={fmt(score)} accent />
          <Stat
            label="Boll"
            value={`${hud?.ball ?? 1} / ${BALLS_PER_GAME}`}
            extra={hud?.extraBalls ? `+${hud.extraBalls}` : undefined}
          />
          <Stat label="Multi" value={`×${hud?.multiplier ?? 1}`} />
        </div>

        <div className="table">
          <canvas ref={canvasRef} style={{ aspectRatio: `${TABLE_WIDTH} / ${TABLE_HEIGHT}` }} />

          {status !== "playing" && (
            <div className="overlay">
              {status === "ready" ? (
                <h1 className="title">NEON DRIFT</h1>
              ) : (
                <>
                  <p className="game-over">Game over</p>
                  <p className="final-score">{fmt(score)}</p>
                </>
              )}

              {enteringName ? (
                <NameForm onSave={saveScore} />
              ) : (
                <>
                  <Leaderboard scores={scores} highlight={savedRank} />
                  <button type="button" onClick={startGame} className="start-button">
                    {status === "over" ? "Spela igen" : "Starta"}
                  </button>
                  <p className="hint">eller tryck Space / Enter</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NameForm({ onSave }: { onSave: (name: string) => void }) {
  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(String(new FormData(e.currentTarget).get("name") ?? ""));
  };
  return (
    <form className="name-form" onSubmit={submit}>
      <p className="new-record">Nytt highscore! 🎉</p>
      <input
        name="name"
        placeholder="Ditt namn"
        maxLength={MAX_NAME_LENGTH}
        autoComplete="off"
        autoFocus
        aria-label="Ditt namn"
      />
      <button type="submit" className="start-button">
        Spara
      </button>
    </form>
  );
}

function Leaderboard({ scores, highlight }: { scores: HighScore[]; highlight: number | null }) {
  if (scores.length === 0) return <p className="record">Inga highscores än</p>;
  return (
    <ol className="leaderboard" aria-label="Highscores">
      {scores.map((s, i) => (
        <li key={`${s.name}-${s.score}-${i}`} className={i === highlight ? "highlight" : undefined}>
          <span className="rank">{i + 1}</span>
          <span className="name">{s.name}</span>
          <span className="points">{fmt(s.score)}</span>
        </li>
      ))}
    </ol>
  );
}

function Goals({ goals }: { goals: GoalProgress[] }) {
  if (goals.length === 0) return null;
  return (
    <section className="goals" aria-label="Extra bollar">
      <p className="label">Vinn extra bollar</p>
      {goals.map((g) => {
        const done = g.target === null;
        const pct = done ? 100 : ((g.value - g.from) / (g.target! - g.from)) * 100;
        return (
          <div key={g.id} className={done ? "goal done" : "goal"}>
            <div className="goal-head">
              <span className="goal-name">{g.label}</span>
              <span className="goal-count">
                {done ? "Klar ✓" : `${fmt(g.value)} / ${fmt(g.target!)}`}
              </span>
            </div>
            <div className="bar">
              <div style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <span className="goal-hint">
              {g.hint} · {g.earned}/{g.total} bollar
            </span>
          </div>
        );
      })}
    </section>
  );
}

function Stat({ label, value, accent, extra }: { label: string; value: string; accent?: boolean; extra?: string }) {
  return (
    <div className="stat">
      <p className="label">{label}</p>
      <p className={accent ? "stat-value accent" : "stat-value"}>
        {value}
        {extra && <span className="stat-extra">{extra}</span>}
      </p>
    </div>
  );
}

function Control({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="control">
      <div className="keys">
        {keys.map((k) => (
          <kbd key={k}>{k}</kbd>
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}
