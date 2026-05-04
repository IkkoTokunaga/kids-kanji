# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

kids-kanji is a single Next.js 15 (App Router) application for Japanese elementary school kanji practice. It has **no database, no external APIs, and no authentication**. All kanji data is baked into `app/lib/kanji-low-grades.json`.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `npm ci` |
| Dev server | `npm run dev` (serves on `0.0.0.0:3000`) |
| Production build | `npm run build` |
| Type check | `npx tsc --noEmit` |

There is no linter configured (no ESLint config present) and no test framework. TypeScript type-checking (`npx tsc --noEmit`) is the primary static analysis check.

### Caveats

- The project requires **Node.js 22** (see `Dockerfile`). The VM environment does not ship with Node pre-installed; the update script installs it from the official binary tarball if missing.
- There is no `.nvmrc` or `.node-version` file, so version managers will not auto-select the correct version.
- `npm run dev` binds to `0.0.0.0:3000`. The Docker Compose file maps host port 3001 to container port 3000, but when running directly on the VM, port 3000 is used.
- `NEXT_TELEMETRY_DISABLED=1` is recommended to suppress telemetry prompts in CI/agent contexts.
