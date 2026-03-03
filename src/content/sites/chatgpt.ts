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
  submitButtonSelectors: [
    'button[data-testid="send-button"]',
    'button[aria-label="Send prompt"]',
    'button[aria-label="Send"]',
    'form button[class*="send"]',
    "form button:last-of-type",
  ],
};
