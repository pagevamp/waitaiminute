import { SiteConfig } from "./sites/types";
import {
  bannerExists,
  findInput,
  injectBanner,
  removeBanner,
  updateBannerMessage,
} from "./injector";
import { startRotation, stopRotation } from "./rotation";
import { startMonitoring, stopMonitoring } from "./input-monitor";
import { startTracking, stopTracking } from "./submit-tracker";

export interface FeatureFlags {
  messages: boolean;
  sensitiveInfo: boolean;
}

const FALLBACK_INTERVAL = 2_000; // 2 seconds

let observer: MutationObserver | null = null;
let fallbackTimer: ReturnType<typeof setInterval> | null = null;
let stopRotationFn: (() => void) | null = null;
let currentFlags: FeatureFlags = { messages: true, sensitiveInfo: true };

export function startObserving(config: SiteConfig, flags?: FeatureFlags): void {
  stopObserving();
  currentFlags = flags ?? { messages: true, sensitiveInfo: true };

  const tryInject = () => {
    if (currentFlags.messages && !bannerExists() && findInput(config)) {
      const banner = injectBanner(config);
      if (banner) {
        stopRotationFn = startRotation((message) => {
          updateBannerMessage(message);
        });
      }
    }

    if (currentFlags.sensitiveInfo && findInput(config)) {
      startMonitoring(config);
    }

    if (findInput(config)) {
      startTracking(config);
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

export function updateFeatures(config: SiteConfig, flags: FeatureFlags): void {
  currentFlags = flags;

  // Handle messages toggle
  if (!flags.messages) {
    if (stopRotationFn) {
      stopRotationFn();
      stopRotationFn = null;
    }
    stopRotation();
    removeBanner();
  } else if (!bannerExists() && findInput(config)) {
    const banner = injectBanner(config);
    if (banner) {
      stopRotationFn = startRotation((message) => {
        updateBannerMessage(message);
      });
    }
  }

  // Handle sensitive info toggle
  if (!flags.sensitiveInfo) {
    stopMonitoring();
  } else if (findInput(config)) {
    startMonitoring(config);
  }
}

export function isObserving(): boolean {
  return observer !== null;
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
  stopTracking();
  if (stopRotationFn) {
    stopRotationFn();
    stopRotationFn = null;
  }
  stopRotation();
}
