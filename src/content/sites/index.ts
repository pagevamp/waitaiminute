import { SiteConfig } from "./types";
import { chatgptConfig } from "./chatgpt";
import { claudeConfig } from "./claude";
import { geminiConfig } from "./gemini";
import { copilotConfig } from "./copilot";
import { perplexityConfig } from "./perplexity";
import { deepseekConfig } from "./deepseek";
import { mistralConfig } from "./mistral";

const allConfigs: SiteConfig[] = [
  chatgptConfig,
  claudeConfig,
  geminiConfig,
  copilotConfig,
  perplexityConfig,
  deepseekConfig,
  mistralConfig,
];

const hostnameMap = new Map<string, SiteConfig>();
for (const config of allConfigs) {
  for (const hostname of config.hostnames) {
    hostnameMap.set(hostname, config);
  }
}

export function getSiteConfig(hostname: string): SiteConfig | undefined {
  return hostnameMap.get(hostname);
}
