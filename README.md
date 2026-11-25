# Neon Drift Pinball

A browser pinball game built with Vite, React and TypeScript. The table is drawn on a canvas.

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
| ← / A | Left flipper |
| → / D | Right flipper |
| Space / ↓ | Hold to pull the plunger, release to launch |
| Touch | Left or right half of the table |

## Extra balls

Each goal awards one extra ball per step. A drained ball then comes back with "SHOOT AGAIN".

| Goal | Steps |
|---|---|
| Replay: reach the score | 75 000 · 200 000 · 500 000 |
| Bumper-storm: hit bumpers | 60 · 200 |
| Target-mästare: complete all 3 targets | 3 · 8 times |
| Max multi: reach multiplier ×5 | once |

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
- `src/components/GameCanvas.tsx`: React wrapper with the HUD and the start and game over screens
- `src/styles.css`: all styles
