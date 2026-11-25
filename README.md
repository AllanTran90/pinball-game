# Neon Drift Pinball

A browser pinball game built with Vite, React and TypeScript. The table is drawn on a canvas with a neon look. It works with a keyboard or a touch screen.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173.

`npm run dev` starts the Vite dev server through `scripts/dev-guard.sh`. The guard stops the server if it uses more than 2000 MB, or if the computer's free memory drops below 50%. To change the limits:

```bash
DEV_MEMORY_LIMIT_MB=1500 DEV_MIN_FREE_PERCENT=60 npm run dev
```

> **Why Vite?** The project started on Next.js 16. Its dev server (Turbopack) filled all memory within seconds and crashed macOS several times, so the project moved to Vite. The guard is there so a runaway dev server can never take the computer down again.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with the memory guard |
| `npm run dev:unguarded` | Dev server without the guard |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Serve the built `dist/` folder |
| `npm run typecheck` | Typecheck only |

## Controls

| Key | Action |
|---|---|
| ← / A / Z / Left Shift | Left flipper |
| → / D / / / Right Shift | Right flipper |
| Space / ↓ / S | Hold to pull the plunger, release to launch |
| Space / Enter | Start a new game |
| Touch | Left half: left flipper. Right half: right flipper and plunger |

## How to play

You have 3 balls. Launch with the plunger and keep the ball in play with the flippers. When a ball drains between the flippers, the next one comes up.

### Scoring

| Target | Points |
|---|---|
| Bumper (pink circles) | 100 |
| Slingshot (yellow triangles) | 10 |
| Rollover lane (dots at the top) | 500 |
| All 3 rollover lanes | 2 000, and the multiplier goes up |
| Stand-up target (orange, left side) | 250 |
| All 3 targets | 5 000 |

Every score is multiplied by the current multiplier.

### Multiplier and lane change

Light all three rollover lanes at the top to raise the multiplier one step, up to ×5. It resets to ×1 when you lose a ball.

Pressing a flipper moves the lit lanes one step left or right (lane change). Use it to put an unlit lane in the ball's path.

### Ball save

For 5 seconds after launch, a drained ball is given back with "BALL SAVED". This happens once per ball.

### Extra balls

Each goal awards one extra ball per step. When you earn one, "EXTRA BALL!" and a glowing "+1 BOLL" appear on the table, and the ball counter in the HUD shows the extra balls you have left (for example `2 / 3 +1`). A drained ball then comes back with "SHOOT AGAIN" and the same ball number. Progress shows in the sidebar.

| Goal | Steps |
|---|---|
| Replay: reach the score | 75 000 · 200 000 · 500 000 |
| Bumper-storm: hit bumpers | 60 · 200 |
| Target-mästare: complete all 3 targets | 3 · 8 times |
| Max multi: reach multiplier ×5 | once |

To change the steps or add a goal, edit the table in `src/game/goals.ts`.

### High scores

The top 5 scores are saved in the browser (`localStorage`) and shown on the start and game over screens. If your score makes the list, you enter a name of up to 10 characters.

## Code layout

- `src/game/`: the game. Plain TypeScript with no framework code.
  - `constants.ts`: sizes, physics and scoring values
  - `table.ts`: table layout (walls, bumpers, slingshots, targets)
  - `physics.ts`: collisions and flipper movement
  - `engine.ts`: game rules, scoring, balls, extra balls and effects
  - `goals.ts`: goals that award extra balls (one table, easy to tweak)
  - `highscores.ts`: top 5 high scores saved in the browser
  - `render.ts`: canvas drawing
  - `input.ts`: keyboard and touch input
- `src/components/GameCanvas.tsx`: React wrapper with the HUD, the goals sidebar, and the start and game over screens
- `src/styles.css`: all styles
- `scripts/dev-guard.sh`: memory guard for the dev server
