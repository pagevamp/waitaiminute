import { SiteConfig } from "./types";

export const perplexityConfig: SiteConfig = {
  hostnames: ["perplexity.ai", "www.perplexity.ai"],
  inputSelectors: [
    'textarea[placeholder*="Ask"]',
    'textarea[placeholder*="ask"]',
    "textarea.overflow-auto",
    "textarea",
  ],
};
