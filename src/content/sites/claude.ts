import { SiteConfig } from "./types";

export const claudeConfig: SiteConfig = {
  hostnames: ["claude.ai"],
  inputSelectors: [
    'div[contenteditable="true"].ProseMirror',
    'div[contenteditable="true"][translate="no"]',
    'fieldset div[contenteditable="true"]',
    'div[contenteditable="true"]',
  ],
  containerSelector: "fieldset",
  submitButtonSelectors: [
    'button[aria-label="Send Message"]',
    'button[aria-label="Send message"]',
    'button[aria-label*="Send"]',
    "fieldset button:last-of-type",
    'button[class*="send" i]',
  ],
};
