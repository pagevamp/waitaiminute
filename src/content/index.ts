import "./content.css";
import { isEnabled } from "../shared/storage";
import { getSiteConfig } from "./sites";
import { startObserving, stopObserving } from "./observer";
import { removeBanner } from "./injector";
import { removeWarning } from "./warning";

async function init() {
  const hostname = window.location.hostname;
  const config = getSiteConfig(hostname);

  if (!config) return;

  const enabled = await isEnabled();
  if (enabled) {
    startObserving(config);
  }

  // Listen for enable/disable messages from service worker
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "SETTINGS_CHANGED") {
      if (message.enabled) {
        startObserving(config);
      } else {
        stopObserving();
        removeBanner();
        removeWarning();
      }
    }
  });
}

init();
