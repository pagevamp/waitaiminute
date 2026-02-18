import { SiteConfig } from "./types";

export const chatgptConfig: SiteConfig = {
  hostnames: ["chatgpt.com", "chat.openai.com"],
  inputSelectors: [
    "#prompt-textarea",
    'div[contenteditable="true"][id="prompt-textarea"]',
    "textarea[data-id]",
    'form textarea[placeholder]',
  ],
  containerSelector: "form",
};
