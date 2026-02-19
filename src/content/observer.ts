import { SiteConfig } from "./sites/types";
import {
  bannerExists,
  findInput,
  injectBanner,
  updateBannerMessage,
} from "./injector";
import { startRotation, stopRotation } from "./rotation";
import { startMonitoring, stopMonitoring } from "./input-monitor";

const FALLBACK_INTERVAL = 2_000; // 2 seconds

let observer: MutationObserver | null = null;
let fallbackTimer: ReturnType<typeof setInterval> | null = null;
let stopRotationFn: (() => void) | null = null;

export function startObserving(config: SiteConfig): void {
  stopObserving();

  const tryInject = () => {
    if (!bannerExists() && findInput(config)) {
      const banner = injectBanner(config);
      if (banner) {
        stopRotationFn = startRotation((message) => {
          updateBannerMessage(message);
        });
        startMonitoring(config);
      }
    }
  };

  // Try immediately
  tryInject();

  // MutationObserver for SPA changes
  observer = new MutationObserver(() => {
    tryInject();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Fallback interval for edge cases
  fallbackTimer = setInterval(tryInject, FALLBACK_INTERVAL);
}

export function stopObserving(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (fallbackTimer) {
    clearInterval(fallbackTimer);
    fallbackTimer = null;
  }
  stopMonitoring();
  if (stopRotationFn) {
    stopRotationFn();
    stopRotationFn = null;
  }
  stopRotation();
}
