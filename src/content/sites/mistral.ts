import { SiteConfig } from "./types";

export const mistralConfig: SiteConfig = {
  hostnames: ["chat.mistral.ai"],
  inputSelectors: [
    'textarea[placeholder]',
    'div[contenteditable="true"]',
    "textarea",
  ],
};
