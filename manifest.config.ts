import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "WaitAIMinute",
  description:
    "Gentle reminders to think before prompting — displays ethical AI use messages on AI tool websites.",
  version: "1.0.0",
  icons: {
    "16": "src/assets/icon-16.png",
    "48": "src/assets/icon-48.png",
    "128": "src/assets/icon-128.png",
  },
  permissions: ["storage"],
  action: {
    default_popup: "src/popup/popup.html",
    default_icon: {
      "16": "src/assets/icon-16.png",
      "48": "src/assets/icon-48.png",
      "128": "src/assets/icon-128.png",
    },
  },
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module" as const,
  },
  content_scripts: [
    {
      matches: [
        "https://chatgpt.com/*",
        "https://chat.openai.com/*",
        "https://claude.ai/*",
        "https://gemini.google.com/*",
        "https://copilot.microsoft.com/*",
        "https://www.perplexity.ai/*",
        "https://perplexity.ai/*",
        "https://chat.deepseek.com/*",
        "https://chat.mistral.ai/*",
      ],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
});
