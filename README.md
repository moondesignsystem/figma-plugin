# Figma Variable Management Plugin

A Figma plugin that remaps local design variables to variables imported from a team library. It is aimed at design-system work where a file still points at an old variable collection and needs to be migrated to a new library.

The plugin exposes a small UI for choosing the target library and the remap scope: a single variable, a single collection, or every local collection.

## Features

- Lists variable collections available from team libraries.
- Imports library variables and creates aliases for them.
- Remaps local variables by single variable, single collection, or all collections.
- Reports progress and errors in the plugin UI.
- TypeScript plugin code with a Parcel-built HTML/CSS/JS UI.
- No network access: everything runs inside Figma.

## Tech stack

| Layer | Technology |
| --- | --- |
| Platform | Figma Plugin API |
| Language | TypeScript |
| UI bundler | Parcel 2 |
| Plugin build | TypeScript compiler (`tsc`) |
| Linting | ESLint + Figma plugin rules |

## Project structure

```text
figma-plugin/
├── manifest.json              # Figma entry point (points at dist/)
├── src/
│   ├── plugin_code/code.ts    # Plugin sandbox: variable remapping logic
│   └── plugin_ui/
│       ├── index.html         # Plugin iframe markup
│       ├── css/               # base.css, theme.css
│       └── js/index.js        # UI logic and postMessage bridge
├── tsconfig.json
└── package.json
```

## Getting started

### Requirements

- Node.js 18+ and npm.
- Figma desktop or web with permission to use team libraries.
- A Figma file containing local variables and at least one library with variables, for testing.

### 1. Install dependencies

```bash
npm install
npm run build
```

### 2. Run locally

**Build and import into Figma**

```bash
npm run build
```

In Figma: Menu → Plugins → Development → Import plugin from manifest… and select `manifest.json`. Run it from Plugins → Development.

**Development with rebuilds**

```bash
npm run watch:code
```

Run `npm run watch:parcel` in a second terminal, then re-run the plugin in Figma after each build.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run build` | Build both the plugin code and the Parcel UI. |
| `npm run build:code` | Compile TypeScript plugin code to `dist/src/plugin_code/`. |
| `npm run build:parcel` | Bundle the plugin UI into `dist/src/plugin_ui/`. |
| `npm run watch:code` | Recompile plugin code on change. |
| `npm run watch:parcel` | Rebuild the UI on change. |
| `npm run lint` | Lint TypeScript sources. |
| `npm run lint:fix` | Lint and fix TypeScript sources. |
| `npm run clean:parcel` | Remove the Parcel cache. |

## How it works

`src/plugin_code/code.ts` runs in the Figma sandbox. It opens the iframe with `figma.showUI`, loads library collections, imports variables by key, creates aliases, and applies them to local variables.

`src/plugin_ui/index.html` and `src/plugin_ui/js/index.js` run in the iframe. They collect the target library and scope, then exchange messages with the sandbox through `parent.postMessage` and `figma.ui.onmessage`.

The manifest points at `dist/src/plugin_code/code.js` and `dist/src/plugin_ui/index.html`; `dist/` is gitignored and must be built before importing the plugin.

## Deployment

- Distribution is through Figma: publish to the Figma Community or share the plugin privately inside the organisation.
- There is no server or GitHub Actions deployment. Build the `dist/` output and publish from Figma.
- The manifest requests the `teamlibrary` permission and declares `networkAccess.allowedDomains: ["none"]`. Keep both restrictions unless the plugin genuinely needs more access.

## Notes and limitations

- The Figma plugin name in `manifest.json` is “Variable Management”; the package name is `moonds-variables`.
- The plugin is intentionally destructive: it remaps variables. Test on a duplicate file before running it on a real design system.
- `documentAccess` is `dynamic-page`, so the plugin works with dynamic-page documents.

---

**Author:** Mario Granada
