# Chrome Web Store Release Checklist

Use this checklist to publish ChapterPilot as an unlisted Chrome Web Store extension. An unlisted listing does not appear in search; anyone with the listing URL can install it without enabling Developer Mode.

## Build the ZIP

```bash
bun install
bun run package:chrome
```

Upload the generated ZIP from `dist/`, for example:

```text
dist/chapterpilot-2.0.0-chrome.zip
```

## Store Listing

- Visibility: `Unlisted`
- Category: `Productivity`
- Language: English, with Spanish support mentioned in the description.
- Name: `ChapterPilot`
- Short description: `Keyboard chapter navigation, reading progress, URL repair, site mapping, and focus tools for manga and web readers.`
- Detailed description:

```text
ChapterPilot keeps manga, manhwa, and web chapter reading flowing across supported and custom-mapped reader sites.

Features:
- Keyboard shortcuts for previous/next chapter, series page, fast scroll, percentage jumps, resume, zen mode, auto-scroll, and chapter map.
- Visual site mapper for custom reader layouts.
- Reading progress recovery and latest-read repair when a work slug or URL changes.
- Continue Reading page, JSON backup/import, latest-read export, English/Spanish UI, and optional Chrome Sync for mappings and settings.

ChapterPilot stores mappings and reading progress in Chrome storage. It does not sell data or use analytics.
```

## Privacy Form Notes

- Single purpose: chapter navigation, reading progress recovery, local site mapping, and focused reading controls.
- Data use: extension settings, site mappings, shortcut settings, reading progress, latest-read entries, and user-created backups.
- Storage: `chrome.storage.local` by default. Optional Chrome Sync copies mappings and settings to the user's Chrome Sync storage when enabled by the user.
- Remote services: none.
- Analytics: none.
- Ads: none.
- Data sale: none.

Use `docs/privacy-policy.md` as the privacy policy page. If publishing from GitHub, make the repository or docs page public and use the rendered URL.

## Permission Justification

- `storage`: saves mappings, settings, reading progress, latest-read entries, and backup/import state.
- `tabs`: finds the active or best reader tab so popup and continue-reading actions can target the correct page.
- `activeTab`: allows user-triggered injection or interaction with the current tab.
- `scripting`: injects the content script when the user manually activates the extension on a page.
- `content_scripts` on `"<all_urls>"`: keeps keyboard shortcuts and reading progress available on supported and user-mapped reader sites without requiring the popup to be opened first.

## Screenshots to Capture

- Popup with active reader controls.
- Continue Reading page with recent entries.
- Options page showing mappings and shortcut settings.
- Visual picker flow on a local fixture or safe public reader page.

## Before Upload

1. Update `manifest.json` version if this is a new release.
2. Run `bun run lint`.
3. Run `bun run typecheck`.
4. Run `bun run test:e2e`.
5. Run `bun run package:chrome`.
6. Upload the ZIP from `dist/`.
7. Set listing visibility to `Unlisted`.
