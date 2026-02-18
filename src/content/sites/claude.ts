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
};
