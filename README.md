# WaitAIMinute

A Chrome extension that displays gentle ethical AI use reminders above text input fields on popular AI tool websites. Encourages users to think before they prompt.

## Supported Sites

- [ChatGPT](https://chatgpt.com)
- [Claude](https://claude.ai)
- [Gemini](https://gemini.google.com)
- [Copilot](https://copilot.microsoft.com)
- [Perplexity](https://perplexity.ai)
- [DeepSeek](https://chat.deepseek.com)
- [Mistral](https://chat.mistral.ai)

## Features

- Rotating reminder messages above AI input fields (30s rotation with fade transitions)
- Sensitive content detection warnings
- Enable/disable toggle via popup
- Settings persist across sessions
- Zero runtime dependencies — vanilla TypeScript only

## Installation

### Chrome Web Store

Coming soon.

### Manual (Developer Mode)

1. Clone the repo
   ```bash
   git clone https://github.com/pagevamp/waitaiminute.git
   cd waitaiminute
   ```
2. Install dependencies and build
   ```bash
   npm install
   npm run build
   ```
3. Open `chrome://extensions` in Chrome
4. Enable **Developer mode**
5. Click **Load unpacked** and select the `dist/` folder

## Development

```bash
npm run dev    # Start Vite dev server with hot reload
npm run build  # TypeScript check + production build
```

## How It Works

The extension injects a small banner above the text input area on supported AI websites. Banners display rotating messages like:

> *"Wait a minute — could you solve this yourself first?"*
> *"Your brain is the best model. Give it a chance first."*
> *"Pause. Think. Then decide if you really need AI for this."*

Messages rotate every 30 seconds with a fade transition. The extension uses MutationObserver with a fallback polling mechanism to reliably detect input fields across all supported sites.

## Privacy

WaitAIMinute does not collect, store, or transmit any user data. See the [Privacy Policy](https://gist.github.com/sajxraj/34648554fa40a1f219eec9c474929d9e).

## License

MIT
