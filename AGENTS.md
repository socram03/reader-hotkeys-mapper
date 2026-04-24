# AGENTS.md

Guidance for agents working in this repository.

## Project

ChapterPilot is a Manifest V3 browser extension for manga/manhwa chapter navigation, reading progress recovery, site mapping, and focused reading controls.

- Runtime: TypeScript bundled with Bun.
- UI: Preact for `popup.html` and `options.html`.
- Main logic: `src/content/app.ts`.
- Generated bundles live at repo root: `background.js`, `content.js`, `options.js`, `popup.js`.
- Generated bundles are ignored by git; run the build before loading the extension unpacked.

## Commands

- Install dependencies: `bun install`
- Typecheck: `bun run typecheck`
- Build extension bundles: `bun run build`
- E2E tests: `bun run test:e2e`
- Headed E2E: `bun run test:e2e:headed`
- Playwright browser install when needed: `bunx playwright install chromium`

Prefer running `bun run typecheck`, `bun run build`, and `bun run test:e2e` after behavior changes.

## Structure

- `manifest.json`: MV3 manifest and extension permissions.
- `src/entries/`: Bun entrypoints for each bundle.
- `src/content/app.ts`: content script, reader detection, hotkeys, mapper, resume, overlays.
- `src/options/`: options page UI and mapping editor.
- `src/popup/`: popup UI.
- `src/shared/`: shared storage, mapping normalization, resume export, tab messaging, types.
- `tests/`: Playwright E2E suite and local fixture server.
- `tests/fixtures/`: local reader pages used by E2E.
- `icons/`: extension icon assets referenced by the manifest.

## Extension Notes

- `content_scripts.matches` intentionally uses `"<all_urls>"` so shortcuts can work without opening the popup first.
- The extension should not also keep broad `host_permissions` unless a new feature specifically requires it.
- Manual injection uses `activeTab` plus `scripting`.
- Picker-captured `sampleHref` is a sample/debug value. Do not use it as a navigation fallback; it is tied to the chapter/work where the mapping was created.
- `readingPrefix` should identify the reusable reader route, not a single work. For paths like `/series/<work>/<chapter>`, prefer `/series/`.
- Keep `src/content/app.ts` typechecked. Do not reintroduce `// @ts-nocheck`.

## Testing Expectations

- Add or update Playwright fixtures when changing mapper, navigation, resume, popup, or options behavior.
- For new route heuristics, add fixture pages that model the real URL shape.
- E2E launches a persistent Chromium context and loads the root folder as the extension.

## Style

- Keep changes focused and small.
- Preserve the existing Preact/no-framework style; do not introduce a new UI framework.
- Use ASCII in new documentation unless there is a strong reason not to.
- Avoid changing generated root JS files manually; edit `src/` and run `bun run build`.
