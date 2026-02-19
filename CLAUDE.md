# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WaitAIMinute is a Chrome extension (Manifest V3) that displays ethical AI use reminders above text input fields on popular AI tool websites (ChatGPT, Claude, Gemini, Copilot, Perplexity, DeepSeek, Mistral). Zero runtime dependencies — vanilla TypeScript only.

## Commands

- `npm run dev` — Start Vite dev server (hot reload for extension development)
- `npm run build` — TypeScript check + Vite build (`tsc && vite build`)
- Load the `dist/` folder as an unpacked extension in Chrome for testing

No test runner or linter is configured.

## Architecture

**Build stack:** Vite + `@crxjs/vite-plugin` (beta) for Chrome extension bundling, TypeScript (strict mode, ES2020 target).

**Entry points** (defined in `manifest.config.ts`):
- **Content scripts** (`src/content/index.ts`) — Injected into AI tool pages. Uses MutationObserver + 2s fallback polling to detect input fields and inject reminder banners.
- **Service worker** (`src/background/service-worker.ts`) — Listens for `chrome.storage` changes and broadcasts enable/disable state to all tabs.
- **Popup** (`src/popup/popup.html`) — Simple toggle UI to enable/disable the extension.

**Key modules:**
- `src/content/sites/` — Per-site configs implementing `SiteConfig` interface. Each file defines CSS selectors and insertion strategy (manual with `containerSelector`/`ancestorLevels`, or floating auto-detect) for a specific AI tool.
- `src/content/injector.ts` — DOM manipulation for banner creation and insertion.
- `src/content/observer.ts` — MutationObserver setup and fallback interval polling.
- `src/content/messages.ts` — Array of 50 reminder messages; `rotation.ts` handles 30s rotation with fade transitions.
- `src/shared/storage.ts` — Chrome Sync storage wrapper (`getSettings`, `setSettings`, `isEnabled`).

**Message passing flow:** Storage change → service worker detects it → broadcasts to all tabs → content scripts enable/disable banners.

## Adding a New AI Tool

1. Add hostname match pattern(s) to `content_scripts.matches` in `manifest.config.ts`
2. Create a new `SiteConfig` in `src/content/sites/<tool>.ts`
3. Register it in `src/content/sites/index.ts`