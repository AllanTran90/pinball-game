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

## Code layout

- `src/game/`: the game. Plain TypeScript with no framework code.
  - `constants.ts`: sizes, physics and scoring values
  - `table.ts`: table layout (walls, bumpers, slingshots, targets)
  - `physics.ts`: collisions and flipper movement
  - `engine.ts`: game rules, scoring, balls and effects
  - `render.ts`: canvas drawing
  - `input.ts`: keyboard and touch input
- `src/components/GameCanvas.tsx`: React wrapper with the HUD and the start and game over screens
- `src/styles.css`: all styles
