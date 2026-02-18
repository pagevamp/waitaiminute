import { SiteConfig } from "./types";

export const copilotConfig: SiteConfig = {
  hostnames: ["copilot.microsoft.com"],
  inputSelectors: [
    "#searchbox",
    'textarea[id="searchbox"]',
    'cib-serp cib-action-bar textarea',
    "textarea.w-full",
  ],
};
