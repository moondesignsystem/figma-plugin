# Figma Variable Management Plugin — Working Memory

_Last updated: 2026-11-02_

## Current status

- Plugin builds with TypeScript plus Parcel and loads from `manifest.json`.
- Library listing, variable import, alias creation, and three remap scopes are implemented.
- No automated tests exist; verification is manual inside Figma.

## Key decisions

- Used Parcel for the iframe UI because it handles HTML/CSS/JS with almost no configuration.
- Kept the plugin offline (`networkAccess: none`) to match its design-system-only purpose.

## Known limitations and follow-ups

- No test harness for the Figma API.
- No confirmation step before a destructive remap.
- No published Community listing yet.

## Mistakes to avoid

- Importing `manifest.json` before running `npm run build` produces missing-file errors.
- The sandbox cannot touch the DOM; UI changes belong in `src/plugin_ui`.
- Do not assume library variable names are unique across collections.

## Next steps

- Add a dry-run/preview before applying remaps.
- Add clearer progress reporting for large libraries.
- Document a recovery path for partially remapped files.

---

Keep this file under ~60 lines. Summarise or delete notes that no longer add value.
