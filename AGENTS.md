# Project notes

This is a Vite + React + TypeScript project. It does not use Next.js.

- Start the dev server only with `npm run dev`. That command runs it through `scripts/dev-guard.sh`. The old Next.js dev server (Turbopack) filled this computer's memory and crashed macOS several times.
- Game logic in `src/game/` is plain TypeScript. Keep React and DOM code out of it.
- Check changes with `npm run build`, which typechecks and builds without starting a server.
