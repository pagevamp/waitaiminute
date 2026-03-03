import { SiteConfig } from "./types";

export const mistralConfig: SiteConfig = {
  hostnames: ["chat.mistral.ai"],
  inputSelectors: [
    'textarea[placeholder]',
    'div[contenteditable="true"]',
    "textarea",
  ],
  submitButtonSelectors: [
    'button[type="submit"]',
    'form button:last-of-type',
  ],
};
