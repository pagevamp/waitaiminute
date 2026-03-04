# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WaitAIMinute is a Chrome extension (Manifest V3) that displays ethical AI use reminders above text input fields on popular AI tool websites (ChatGPT, Claude, Gemini, Copilot, Perplexity, DeepSeek, Mistral). It also detects sensitive information in prompts and tracks daily query counts per site. Zero runtime dependencies — vanilla TypeScript only.

## Commands

- `npm run dev` — Start Vite dev server (hot reload for extension development)
- `npm run build` — TypeScript check + Vite build (`tsc && vite build`)
- Load the `dist/` folder as an unpacked extension in Chrome for testing

No test runner or linter is configured.

## Architecture

**Build stack:** Vite + `@crxjs/vite-plugin` (beta) for Chrome extension bundling, TypeScript (strict mode, ES2020 target).

**Entry points** (defined in `manifest.config.ts`):
- **Content scripts** (`src/content/index.ts`) — Injected into AI tool pages. Uses MutationObserver + 2s fallback polling to detect input fields and inject reminder banners.
- **Service worker** (`src/background/service-worker.ts`) — Listens for `chrome.storage` changes, broadcasts enable/disable state to all tabs, and updates the badge with today's query count.
- **Popup** (`src/popup/popup.html`) — Tabbed UI with Settings (toggles) and Stats (date-navigable per-site query breakdown).

**Key modules:**
- `src/content/sites/` — Per-site configs implementing `SiteConfig` interface. Each file defines CSS selectors and insertion strategy (manual with `containerSelector`/`ancestorLevels`, or floating auto-detect) for a specific AI tool.
- `src/content/injector.ts` — Banner creation, insertion, daily color themes (7 rotating), typing effect, and progress bar.
- `src/content/observer.ts` — MutationObserver setup and fallback interval polling. Orchestrates all content features.
- `src/content/messages.ts` — Array of 50 reminder messages; `rotation.ts` handles 30s rotation with fade transitions.
- `src/content/detector.ts` — Regex-based detection for 5 sensitive data types (email, phone, SSN, credit card, API key).
- `src/content/input-monitor.ts` — Debounced (300ms) input listener that triggers sensitive info detection.
- `src/content/warning.ts` — Warning banner creation/update when sensitive info is detected.
- `src/content/submit-tracker.ts` — Detects prompt submissions via Enter key and submit button clicks (capture phase, 500ms debounce).
- `src/shared/storage.ts` — Chrome Sync storage wrapper (`getSettings`, `setSettings`).
- `src/shared/counter-storage.ts` — Chrome Local storage for submit counts (`SubmitCounts` schema: `total` + `days[date][hostname]`).

**Message passing flow:** Storage change → service worker detects it → broadcasts to all tabs → content scripts enable/disable banners.

**Documentation:** Technical docs for each feature are in `docs/`.

## Adding a New AI Tool

1. Add hostname match pattern(s) to `content_scripts.matches` in `manifest.config.ts`
2. Create a new `SiteConfig` in `src/content/sites/<tool>.ts` (include `submitButtonSelectors` for query tracking)
3. Register it in `src/content/sites/index.ts`