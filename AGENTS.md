# AGENTS.md — Figma Variable Management Plugin

Compact guide for future OpenCode sessions. It records only the facts an agent is likely to miss or get wrong.

## Quickstart

| Command | Description |
| --- | --- |
| `npm install` | Install dependencies. |
| `npm run build` | Build plugin code and UI into `dist/`. |
| `npm run lint` | Lint the TypeScript sources. |

## Requirements

- Node.js 18+ and npm.
- Figma desktop or web with permission to use team libraries.
- A Figma file containing local variables and at least one library with variables, for testing.

## Environment

- There are no environment variables and no network access by design.
- `dist/` is gitignored; never edit generated files.

## Architecture

- `src/plugin_code/code.ts` — Figma sandbox logic and message handler.
- `src/plugin_ui/` — iframe UI, styles, and `postMessage` bridge.
- `manifest.json` — plugin id, entry points, permissions, and network policy.
- `tsconfig.json` — compiles plugin code to `dist/src/plugin_code/`.

## Commands and build order

- Run `npm run build` before importing the plugin in Figma.
- Use both watch scripts during development: one for the sandbox code, one for the UI.
- Run `npm run lint` before finishing a change.

## Conventions and gotchas

- Figma loads the built files from `dist/`, not from `src/`.
- The sandbox and the iframe are separate contexts; all communication goes through messages.
- Variable APIs are async and key-based; do not assume local ids match library ids.
- The plugin needs the `teamlibrary` permission to list and import library variables.

## Memory

- Read `MEMORY.md` first to understand the current status and decisions.
- Before changing behaviour, read `constitution.md` and keep the change aligned with it.
- After a task, update `MEMORY.md` with status, decisions, and mistakes to avoid. Keep it short.
- If a rule becomes permanent, move it into this file instead of leaving it in memory.
- Never store secrets, tokens, or personal data in `MEMORY.md`.
