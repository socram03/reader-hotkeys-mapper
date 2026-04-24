# Reader Hotkeys Mapper

**Browser extension** that lets you read manga and manhwa using only your keyboard.
It includes native support for several popular sites and a local mapping system to add other websites without changing the code.

Developed in **TypeScript**, bundled with **Bun**. The popup and options UI are built with **Preact**, and dependencies are managed with **Bun**.

Spanish version: [README.ES.md](./README.ES.md)

## Features

- Chapter navigation: `ArrowLeft` and `ArrowRight`
- Back to series/index: `M`
- Fast scroll: `J` and `K`
- Quick jumps to 10%-90% of the chapter: `1` through `9`
- Resume last read chapter and reading position: `L`
- Restore saved position in the current chapter: `R`
- Zen mode: `Z` (persistent)
- Auto-scroll and auto-next at the end of the chapter: `A` (persistent)
- Pause or resume auto-scroll: `Space`
- Adjust auto-scroll speed: `+` and `-`
- Contextual help: `?` or `H`
- Fast visual mapping: `U`

## Extension Interface

- `popup.html`: Quick control over the last compatible tab opened in the current window.
- `options.html`: Advanced mapping editor with multiple mappings per domain, enable / disable custom sites, host aliases, supported path prefixes, manual CSS selector editing, editable `readingPrefix` and fallback links, JSON import/export, last-read export by work, visual selector support, automatic content script reinjection, and a button to resume the last read chapter from the popup.

## Natively Supported Sites

- `zonatmo.com`
- `olympusbiblioteca.com`
- `leerolymp.com`
- `manhwaweb.com`

## How to Map a New Site

Recommended method:

1. Open the extension `Options` page.
2. Click `Picker in another tab`.
3. Go to the website you want to map and select the corresponding buttons.
4. Enable the mapping once you are done.

On unrecognized sites, hotkeys remain disabled until you manually activate a custom mapping.

Mappings are stored in `chrome.storage.local`.

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
- `options.js`
- `popup.js`

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

The tests validate the full workflow: visual mapping, site activation, chapter navigation, last-read resume, zen mode, and manual editing.

## Project Structure

- `src/entries/`: Bundle entry points
- `src/content/app.ts`: Main content script logic
- `src/options/`: Options UI built with Preact
- `src/popup/`: Popup UI built with Preact
- `src/shared/`: Shared types, storage, messaging, and utilities

## Before Publishing

1. Check `manifest.json`: name, description, and version.
2. Keep `"<all_urls>"` in `content_scripts` only if shortcuts must work before opening the popup. The extension no longer keeps `host_permissions`; manual injection uses `activeTab` + `scripting`.
3. Add screenshots of the popup and options page.

## License

[MIT](./LICENSE)
