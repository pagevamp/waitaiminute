# Reminder Messages

Displays rotating ethical AI use reminders above text input fields on supported AI tool websites.

## Architecture

```
messages.ts       50 static reminder messages
     |
     v
rotation.ts       30s interval, random pick (no repeats)
     |
     v
injector.ts       Banner creation, typing effect, daily theme
     |
     v
content.css       Layout, transitions, progress bar
     |
     v
observer.ts       Lifecycle (inject on input detect, teardown on disable)
```

## Messages (`src/content/messages.ts`)

Array of 50 strings. Themes across the messages:

- **Self-challenge**: "Could you solve this yourself first?"
- **Skill preservation**: "The shortcut today becomes the knowledge gap tomorrow."
- **Critical thinking**: "AI can be confidently wrong. Always verify."
- **Mindful usage**: "Are you prompting out of habit or out of genuine need?"

## Rotation (`src/content/rotation.ts`)

| Constant | Value |
|---|---|
| `ROTATION_INTERVAL` | 30,000ms (30 seconds) |

### Functions

| Function | Description |
|---|---|
| `getRandomMessage()` | Returns a random message, updates `currentIndex` |
| `getCurrentMessage()` | Returns the message at `currentIndex` |
| `startRotation(onNewMessage)` | Starts 30s interval, guarantees no back-to-back repeats, returns cleanup function |
| `stopRotation()` | Clears the interval |

### Repeat avoidance

```ts
do {
  newIndex = Math.floor(Math.random() * messages.length);
} while (newIndex === currentIndex && messages.length > 1);
```

Loops until a different index is picked. Safe when there's more than one message.

## Banner Injection (`src/content/injector.ts`)

### DOM structure

```html
<div data-waitaiminute-banner="true" class="waitaiminute-banner">
  <div class="waitaiminute-message">
    <span class="waitaiminute-icon">✋</span>
    <span class="waitaiminute-text">message here...</span>
  </div>
  <div class="waitaiminute-progress">
    <!-- progress bar (see submit-count-tracker doc) -->
  </div>
</div>
```

### Typing effect

Messages appear character-by-character at 30ms per character (`TYPING_SPEED = 30`).

- `typeText(el, message)` — clears element, adds `waitaiminute-typing` class (shows blinking cursor `|`), appends characters via `setTimeout` chain
- `cancelTyping()` — clears the timeout, stops mid-type if needed

### Message transition

`updateBannerMessage(message)`:
1. Adds `waitaiminute-fade-out` class (opacity → 0 over 300ms)
2. After 300ms, removes fade class and starts `typeText()` with the new message

### Insertion strategies

**Auto-detect (`floating: true`)**:
- `findInsertionAncestor(input, position)` walks up the DOM from the input
- Looks for an ancestor wider than 40% of viewport with a sibling
- For `"after"` position, also requires height >= 80px

**Manual DOM (`floating: false`)**:
- Uses `containerSelector` to find the nearest matching ancestor
- Walks up `ancestorLevels` additional parents
- Inserts before or after based on `insertPosition`

### Daily color themes

7 themes that rotate based on day of year (`getDayOfYear() % 7`):

| Day | Theme | Light text | Dark text |
|---|---|---|---|
| 0 | Blue | `#1e3a8a` | `#bfdbfe` |
| 1 | Green | `#065f46` | `#a7f3d0` |
| 2 | Purple | `#4c1d95` | `#ddd6fe` |
| 3 | Teal | `#134e4a` | `#99f6e4` |
| 4 | Amber | `#78350f` | `#fde68a` |
| 5 | Pink | `#831843` | `#fbcfe8` |
| 6 | Indigo | `#312e81` | `#c7d2fe` |

Each theme has gradient backgrounds, text color, and border color for both light and dark modes.

**Dark mode detection**:
- `prefers-color-scheme: dark` media query
- `html.dark` or `body.dark` class
- `data-theme="dark"` or `data-mode="dark"` attributes

## CSS (`src/content/content.css`)

### Banner layout

- `flex-direction: column` — message row on top, progress bar below
- `padding: 8px 16px`, `border-radius: 8px`
- `z-index: 9999`
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`

### Transitions

| Class | Effect |
|---|---|
| `.waitaiminute-fade-out` | `opacity: 0` (0.3s ease) |
| `.waitaiminute-typing::after` | Blinking `|` cursor (0.7s step-end) |

## Observer Integration (`src/content/observer.ts`)

### Startup flow

```
startObserving(config, flags)
  → tryInject()
    → if messages enabled && input found && no banner exists:
        injectBanner(config)
        startRotation(updateBannerMessage)
  → MutationObserver on document.body (childList + subtree)
  → Fallback setInterval every 2s
```

### Feature flag: `messages`

| Value | Behavior |
|---|---|
| `true` | Injects banner, starts 30s rotation |
| `false` | Removes banner, stops rotation |

Toggled at runtime via `updateFeatures(config, flags)` when the user changes the setting in the popup. The change propagates: popup → chrome.storage.sync → service worker → content script message.

## Data Flow

```
Page load / SPA navigation
    |
    v
observer.ts: tryInject()
    |
    v
injector.ts: injectBanner(config)
    |  - createBannerElement() with typing effect
    |  - applyDailyTheme() for colors
    |  - initProgressBar() for query tracking
    |
    v
rotation.ts: startRotation(callback)
    |
    v  (every 30s)
injector.ts: updateBannerMessage(message)
    |  - fade out (300ms)
    |  - type in new message (30ms/char)
```
