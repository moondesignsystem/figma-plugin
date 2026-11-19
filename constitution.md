# Project Constitution — Figma Variable Management Plugin

This document defines the non-negotiable foundations for this repository. Read it before adding or changing features.

## Guiding Principles

- **Simplicity first** — prefer the smallest solution that solves the problem. If a change needs a long explanation, it is probably over-engineered.
- **No hardcoded secrets or endpoints** — configuration belongs in environment variables; visual design tokens belong in styles, not in `.env` files.
- **Traceability** — every value, dependency, and route should make its origin and purpose obvious.
- **Debuggability** — fail loudly and visibly; avoid silent fallbacks that hide broken data.
- **Official patterns** — use the documented API of each framework and library before inventing a workaround.
- **Portfolio clarity** — this repository is part of a public portfolio. Code should read as clean, intentional, and easy for a reviewer to follow.

## Technology Stack Foundations

| Layer | Choice | Rationale |
| --- | --- | --- |
| Platform | Figma Plugin API | The plugin manipulates variables and collections directly in the current file. |
| Language | TypeScript | Typed access to the Figma API reduces mistakes in variable handling. |
| UI bundler | Parcel 2 | Bundles the plugin iframe UI without a custom build setup. |
| Plugin build | TypeScript compiler (`tsc`) | Compiles `src/plugin_code` to the `dist/` path referenced by the manifest. |
| Linting | ESLint + Figma plugin rules | Catches plugin-specific API misuse and unused code. |

**Rule of thumb:** a new dependency must solve a concrete problem that the current stack cannot solve cleanly. Justify it in the change that introduces it.

## Core Premises

### 1. Scope

A single-purpose internal design-system utility. The goal is reliable variable remapping with a clear UI, not a general-purpose variable editor.

### 2. Environment Isolation

- This project has no runtime secrets. Do not introduce `.env` files unless a real secret or environment-specific URL appears.
- If configuration is added, use environment variables and document them in the README.
- Never commit keys, tokens, database URLs, or credentials.

### 3. Architecture

- Keep Figma API work in `src/plugin_code` and DOM work in `src/plugin_ui`; cross the boundary only with typed messages.
- Generated `dist/` output is never edited by hand.
- Prefer small helpers for loading collections, importing variables, and applying aliases.

### 4. Data and State

- The source of truth is the Figma document and its team libraries; the plugin keeps only transient UI state.
- Do not cache library variables beyond the current plugin run.
- Handle missing libraries, empty collections, and failed imports explicitly.

### 5. Styling and UX

- Plugin UI styles live in `src/plugin_ui/css/`.
- Use Figma theme colours so the plugin matches light and dark Figma themes.
- Keep the 500×600 iframe layout compact and readable.

### 6. Quality Gates

- `npm run lint` and a successful `npm run build` are the minimum gates.
- Manually test all three remap scopes on a copy of a file.
- Confirm that a failed library import surfaces a message in the UI instead of failing silently.

### 7. Deployment

- Build locally and publish through Figma; there is no hosted runtime.
- Keep `networkAccess` at `none` and request only the `teamlibrary` permission.
- Treat each published version as a migration tool: document breaking changes.

## What to Avoid

- Committing `dist/`, Parcel caches, or `node_modules`.
- Editing generated JavaScript instead of the TypeScript source.
- Adding network access without a concrete requirement.
- Running a destructive remap without a warning or confirmation in the UI.

## Checklist Before Adding Anything New

- Does this solve a real problem for this project, or am I adding scope for its own sake?
- Is every new value configuration-driven rather than hardcoded?
- Does the change follow the existing folder and naming patterns?
- Is there a clear failure path when data, the network, or the environment is unavailable?
- Have I run the available lint/build/test command and fixed what it reports?
- Did I update `README.md` and `MEMORY.md` if behaviour or setup changed?

## Philosophy Statement

This repository exists to show thoughtful front-end engineering: clear structure, readable code, and deliberate trade-offs. The goal is not to use every tool available, but to make every file explain itself. Simplicity is the feature.
