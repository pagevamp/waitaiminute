import { SiteConfig } from "./types";

export const geminiConfig: SiteConfig = {
  hostnames: ["gemini.google.com"],
  inputSelectors: [
    ".ql-editor[contenteditable='true']",
    'div[contenteditable="true"].ql-editor',
    'rich-textarea div[contenteditable="true"]',
    ".input-area-container textarea",
  ],
  floating: true,
  insertPosition: "after",
};
