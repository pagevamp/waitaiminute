# Sensitive Information Detection

Scans prompt text in real-time and warns the user if it contains personal data before submission.

## Architecture

```
input-monitor.ts     Listens to input/keyup events (300ms debounce)
       |
       v
detector.ts          Regex matching against 5 sensitive patterns
       |
       v
warning.ts           Warning banner creation, update, and removal
       |
       v
content.css          Warning banner styles
       |
       v
observer.ts          Lifecycle (start/stop via feature flag)
```

## Pattern Detection (`src/content/detector.ts`)

### Supported patterns

| Type | Regex | Example match |
|---|---|---|
| Email Address | `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` | `user@example.com` |
| Phone Number | `(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}` | `(555) 123-4567` |
| SSN | `\d{3}-\d{2}-\d{4}` | `123-45-6789` |
| Credit Card | `(?:\d[ -]*?){13,19}` | `4111 1111 1111 1111` |
| API Key | `(?:sk-\|pk-\|api_\|key-\|token-\|bearer\s+)[a-zA-Z0-9_\-]{8,}` | `sk-abc123xyz456` |

All regexes use the global flag (`/g`). `lastIndex` is reset before each scan to avoid stale state.

### Masking

Detected values are masked before display to avoid showing the full sensitive data in the warning banner:

```ts
function maskValue(value: string): string {
  if (value.length <= 6) return "***";
  const visibleStart = Math.min(3, Math.floor(value.length / 4));
  const visibleEnd = Math.min(2, Math.floor(value.length / 5));
  return value.slice(0, visibleStart) + "***" + value.slice(value.length - visibleEnd);
}
```

Examples:
- `user@example.com` → `use***om`
- `sk-abc123xyz456` → `sk-***56`
- `short` → `***`

### Deduplication

A `Set<string>` keyed by `"type:rawValue"` prevents the same match from appearing twice in the results.

### Return type

```ts
interface SensitiveMatch {
  type: string;   // e.g. "Email Address"
  match: string;  // masked value, e.g. "use***om"
}
```

## Input Monitoring (`src/content/input-monitor.ts`)

### Event listeners

Attaches to the detected input element:
- `input` event — fires on text changes
- `keyup` event — backup for contenteditable elements where `input` may not fire

Both go through the same debounced handler.

### Debouncing

```
User types → 300ms quiet period → detectSensitiveInfo(text)
```

`DEBOUNCE_MS = 300` — resets on each keystroke. Only scans once the user pauses.

### Text extraction

```ts
function extractText(el: Element): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  return el.textContent ?? "";  // contenteditable
}
```

### Handler flow

```
handleInput(config, input)
  → debounce 300ms
  → extractText(input)
  → detectSensitiveInfo(text)
  → matches found?
      yes → injectWarning() if not exists, then updateWarning(matches)
      no  → removeWarning()
```

### Stale input handling

`isInputStale(config)` checks if:
- `monitoredInput` is null
- Element is disconnected from DOM (`!el.isConnected`)
- A different element now matches `findInput(config)`

If stale, `startMonitoring()` tears down old listeners and re-attaches to the new input.

### Cleanup

`stopMonitoring()`:
1. Aborts the `AbortController` (removes all event listeners)
2. Clears any pending debounce timer
3. Nulls out `monitoredInput`
4. Removes the warning banner

## Warning Banner (`src/content/warning.ts`)

### DOM structure

```html
<div data-waitaiminute-warning="true" class="waitaiminute-warning"
     style="color: ...; background: ...; border: ...;">
  <span class="waitaiminute-warning-icon">⚠</span>
  <span class="waitaiminute-warning-text">
    Potential sensitive info detected: Email Address (use***om), API Key (sk-***56)
  </span>
</div>
```

### Color scheme

Colors are applied inline based on dark mode detection:

| Mode | Text | Background | Border |
|---|---|---|---|
| Light | `#7f1d1d` | `#fee2e2` | `#ef444433` |
| Dark | `#fca5a5` | `#450a0a` | `#7f1d1d33` |

### Dark mode detection (`isDarkBackground`)

1. Checks computed `backgroundColor` on `body`, then `html`
2. Calculates luminance: `(0.299R + 0.587G + 0.114B) / 255`
3. Luminance < 0.5 = dark, skips transparent elements
4. Falls back to class-based detection: `.dark`, `[data-theme="dark"]`

### Injection placement

Same strategy as the main banner:

**Floating (auto-detect)**:
- Walks up from input, finds ancestor wider than 40% viewport with height >= 80px and a next sibling
- Inserts **after** the container

**Manual DOM**:
- Uses `containerSelector` + `ancestorLevels` from `SiteConfig`
- Inserts **after** the container

### Update

`updateWarning(matches)` replaces the text content with:
```
Potential sensitive info detected: Type1 (masked1), Type2 (masked2)
```

## CSS (`src/content/content.css`)

```css
.waitaiminute-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  margin: 12px auto 4px;
  max-width: 700px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  z-index: 9999;
}
```

- Slightly smaller font (13px) than the reminder banner (15px)
- Max-width capped at 700px, centered with `margin: auto`
- Icon gets `margin-right: 8px` and `font-size: 16px`

## Observer Integration (`src/content/observer.ts`)

### Feature flag: `sensitiveInfo`

| Value | Behavior |
|---|---|
| `true` | Calls `startMonitoring(config)` when input is detected |
| `false` | Calls `stopMonitoring()`, removes warning banner |

### Lifecycle

```
startObserving(config, { sensitiveInfo: true })
  → tryInject()
    → if input found: startMonitoring(config)
  → MutationObserver re-runs tryInject() on DOM changes
  → Fallback interval every 2s

stopObserving()
  → stopMonitoring()  // aborts listeners, removes warning
```

`updateFeatures(config, flags)` handles runtime toggle changes without tearing down the full observer.

## Data Flow

```
User types in AI tool input
    |
    v
input-monitor.ts: input/keyup event
    |
    v  (300ms debounce)
detector.ts: detectSensitiveInfo(text)
    |
    +--- no matches → removeWarning()
    |
    +--- matches found
            |
            v
         warning.ts: injectWarning() + updateWarning(matches)
            |
            v
         "⚠ Potential sensitive info detected: Email Address (use***om)"
```

User clears the sensitive text → next debounce scan finds no matches → warning is removed.
