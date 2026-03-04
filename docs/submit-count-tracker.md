# Submit Count Tracker

Tracks how many prompts the user sends to AI tools, broken down by site and date.

## Architecture

```
submit-tracker.ts          Detects submits via keydown/pointerdown
        |
        v
counter-storage.ts         Persists counts in chrome.storage.local
        |
        +-------> service-worker.ts    Updates badge on extension icon
        +-------> popup.ts             Stats tab with date nav & breakdown
        +-------> injector.ts          Progress bar on the reminder banner
```

## Storage Schema

Stored under the key `submitCounts` in `chrome.storage.local`:

```ts
interface SubmitCounts {
  total: number;
  days: Record<string, Record<string, number>>;
}
```

Example:

```json
{
  "total": 42,
  "days": {
    "2026-03-03": { "chatgpt.com": 5, "claude.ai": 3 },
    "2026-03-04": { "chatgpt.com": 2 }
  }
}
```

- `total` — all-time count (denormalized for quick display)
- `days` — nested map of `date -> hostname -> count`
- Date format: `YYYY-MM-DD` (ISO, derived from `new Date().toISOString().slice(0, 10)`)

## Submit Detection (`src/content/submit-tracker.ts`)

Two event listeners on the `document` in **capture phase** (fires before framework handlers):

### 1. Enter key

```
document 'keydown' (capture) -> check Enter, not Shift, not composing
                              -> verify event target is inside tracked input
                              -> check input has non-empty text
                              -> recordSubmit()
```

### 2. Submit button click

```
document 'pointerdown' (capture) -> match target against submitButtonSelectors
                                  -> check input has non-empty text
                                  -> recordSubmit()
```

Both go through `recordSubmit()` which debounces at 500ms to prevent double-counting (e.g. Enter key + button click on the same submit).

### Lifecycle

| Function | Called by | Purpose |
|---|---|---|
| `startTracking(config)` | `observer.ts` on input detection | Attaches listeners via `AbortController` |
| `stopTracking()` | `observer.ts` on disable/disconnect | Aborts all listeners, clears state |

The tracker re-attaches if the tracked input becomes stale (disconnected from DOM or replaced by SPA navigation).

### Per-site submit button selectors

Each `SiteConfig` defines `submitButtonSelectors` — an ordered list of CSS selectors for the site's send button. The tracker checks `target.matches(selector)` and `target.closest(selector)` to handle clicks on child elements (e.g. an SVG icon inside the button).

## Storage API (`src/shared/counter-storage.ts`)

### Write operations

| Function | Description |
|---|---|
| `incrementSubmitCount(hostname)` | Increments `total` and `days[today][hostname]` |
| `resetSubmitCounts()` | Resets everything to `{ total: 0, days: {} }` |
| `resetTodayCounts()` | Removes today's entry, subtracts today's sum from `total` |

### Read-only derivations

| Function | Returns |
|---|---|
| `getTodayTotal(counts)` | Sum of all sites for today |
| `getDateTotal(counts, date)` | Sum of all sites for a specific date |
| `getDatesWithData(counts)` | Date strings with non-zero data, sorted newest-first |
| `getSiteTotals(counts)` | All-time totals per site |

## Badge (`src/background/service-worker.ts`)

The service worker listens for `submitCounts` changes in `chrome.storage.local`:

- Count > 0: red badge (`#dc2626`) showing today's total
- Count = 0: badge hidden (empty string)
- Also sets badge on service worker startup for persistence across browser restarts

## Popup Stats Tab (`src/popup/popup.ts`)

The popup has two tabs: **Settings** and **Stats**.

### Stats tab layout

```
Total Queries              142     <- counts.total
------------------------------
  <   Mar 3, 2026   >             <- date nav (only dates with data)
------------------------------
Day Total                    5
  chatgpt.com                3    <- per-site for selected date
  claude.ai                  2
------------------------------
[ Reset Today ] [ Reset All ]
```

### Date navigation

- `datesWithData` array sorted newest-first (index 0 = newest)
- Defaults to today if it has data, otherwise index 0 (latest date with data)
- Prev arrow: `currentDateIndex + 1` (older), Next arrow: `currentDateIndex - 1` (newer)
- Arrows disable at boundaries
- Empty state shown when no data exists

### Reset buttons

Uses inline two-click confirmation (first click shows "Sure?", resets after 2s) because `window.confirm()` closes the Chrome extension popup.

## Progress Bar (`src/content/injector.ts`)

Displayed below the reminder message inside the banner. Shows today's query count with a dependency label.

### Dependency stages

| Count | Label | Intensity |
|---|---|---|
| 0 | Ninja | 0 (theme color) |
| 1-2 | Self-Reliant | 0.15 |
| 3-4 | Balanced | 0.35 |
| 5-6 | Getting Cozy | 0.55 |
| 7-8 | Attached | 0.75 |
| 9-10 | Overly Dependent | 0.9 |
| 11+ | AI Addict | 1.0 (full red) |

### Theme-aware fill color

The fill color blends between the daily banner theme's text color and a warning red using linear interpolation (`lerpColor`). At intensity 0, the bar matches the theme; at intensity 1, it's full warning red. This ensures contrast against any daily color theme.

The track background uses `currentColor` at 20% opacity via a CSS pseudo-element, so it always adapts to the banner's text color.

### Live updates

The progress bar listens to `chrome.storage.onChanged` and animates to the new width/color when `submitCounts` changes — no page reload needed.

At 11+ queries, the fill bar pulses via CSS animation to grab attention.

## Data Flow

```
User presses Enter / clicks Send
    |
    v
submit-tracker.ts: recordSubmit()
    |
    v
counter-storage.ts: incrementSubmitCount(hostname)
    |
    v
chrome.storage.local.set({ submitCounts: ... })
    |
    +---> chrome.storage.onChanged (local)
              |
              +---> service-worker.ts: updateBadge()
              +---> injector.ts: updateProgressBar()
              +---> popup.ts: updateStats() (if open)
```
