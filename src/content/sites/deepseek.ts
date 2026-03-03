import { SiteConfig } from "./types";

export const deepseekConfig: SiteConfig = {
  hostnames: ["chat.deepseek.com"],
  inputSelectors: [
    "#chat-input",
    'textarea[id="chat-input"]',
    'textarea[placeholder]',
    "textarea",
  ],
  submitButtonSelectors: [
    "#chat-input-send-button",
    'div[class*="chat-input"] button:last-of-type',
  ],
};
