# ChapterPilot

**Browser extension** that keeps manga, manhwa, and web chapter reading flowing across sites.
It combines keyboard navigation, local site mapping, reading progress, URL repair, backups, optional sync, and focused reading controls.

Developed in **TypeScript**, bundled with **Bun**. The popup and options UI are built with **Preact**, and dependencies are managed with **Bun**.

Spanish version: [README.ES.md](./README.ES.md)

## Features

- Chapter navigation: `ArrowLeft` and `ArrowRight`
- Back to series/index: `M`
- Fast scroll: `J` and `K`
- Quick jumps to 10%-90% of the chapter: `1` through `9`
- Resume latest read chapter and reading position: `L`
- Repair latest reads when a work slug or URL changes
- Restore saved position in the current chapter: `R`
- Zen mode: `Z` (persistent)
- Auto-scroll and auto-next at the end of the chapter: `A` (persistent)
- Pause or resume auto-scroll: `Space`
- Adjust auto-scroll speed: `+` and `-`
- Chapter map overlay: `C`
- Contextual help: `?` or `H`
- Fast visual site mapping: `U`
- JSON backup/import, latest-read export, English/Spanish UI, and optional Chrome Sync for mappings/settings

## Extension Interface

- `popup.html`: Quick controls for the last compatible tab, continue-reading list, latest-read repair, resume, zen mode, auto-scroll, and help.
- `options.html`: Advanced mapping editor with multiple mappings per domain, site activation, host aliases, supported path prefixes, shortcut overrides, reading mode settings, JSON backup/import, latest-read export, optional sync, and visual picker support.

## Natively Supported Sites

- `zonatmo.com`
- `olympusbiblioteca.com`
- `leerolymp.com`
- `manhwaweb.com`

## How to Map a New Site

Recommended method:

1. Open the extension `Options` page.
2. Click `Picker in tab`.
3. Go to the website you want to map and select the corresponding buttons.
4. Enable the mapping once you are done.

On unrecognized sites, shortcuts stay disabled until you manually activate a custom mapping.

Mappings and reading progress are stored in `chrome.storage.local` by default. Optional sync can copy mappings and settings to Chrome Sync.

## Local Development

Installation and build:

```bash
bun install
bun run build
```

The generated JS bundles are not committed. Run the build before loading the unpacked extension.

This generates:

- `background.js`
- `content.js`
- `continue.js`
- `options.js`
- `popup.js`

## Chrome Web Store Distribution

For normal installation without enabling Developer Mode, publish ChapterPilot as an unlisted Chrome Web Store extension.

Build the upload ZIP:

```bash
bun install
bun run package:chrome
```

The ZIP is created in `dist/`. Use [docs/chrome-web-store.md](./docs/chrome-web-store.md) for the release checklist and [docs/privacy-policy.md](./docs/privacy-policy.md) as the privacy policy source.

Load the extension in Chrome:

1. Open `chrome://extensions`
2. Enable `Developer Mode`
3. Click `Load unpacked`
4. Select the project root folder

E2E tests with Playwright:

```bash
bun install
bun run build
bunx playwright install chromium
bun run test:e2e
```

The tests validate the full workflow: visual mapping, site activation, chapter navigation, latest-read resume, URL repair, auto-scroll speed persistence, sync, backups, zen mode, and manual editing.

## Project Structure

- `src/entries/`: Bundle entry points
- `src/content/app.ts`: Main content script logic
- `src/options/`: Options UI built with Preact
- `src/popup/`: Popup UI built with Preact
- `src/shared/`: Shared types, storage, messaging, i18n, resume, and utility modules

## Before Publishing

1. Check `manifest.json`: name, description, and version.
2. Keep `"<all_urls>"` in `content_scripts` only if shortcuts must work before opening the popup. The extension no longer keeps broad `host_permissions`; manual injection uses `activeTab` + `scripting`.
3. Add screenshots of the popup and options page.

## License

[MIT](./LICENSE)
