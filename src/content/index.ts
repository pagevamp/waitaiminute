import "./content.css";
import { getSettings } from "../shared/storage";
import { getSiteConfig } from "./sites";
import {
  startObserving,
  stopObserving,
  isObserving,
  updateFeatures,
} from "./observer";
import { removeBanner } from "./injector";
import { removeWarning } from "./warning";

async function init() {
  const hostname = window.location.hostname;
  const config = getSiteConfig(hostname);

  if (!config) return;

  const settings = await getSettings();
  if (settings.enabled) {
    startObserving(config, {
      messages: settings.messagesEnabled,
      sensitiveInfo: settings.sensitiveInfoEnabled,
    });
  }

  // Listen for enable/disable messages from service worker
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "SETTINGS_CHANGED") {
      const flags = {
        messages: message.messagesEnabled,
        sensitiveInfo: message.sensitiveInfoEnabled,
      };

      if (message.enabled) {
        if (isObserving()) {
          updateFeatures(config, flags);
        } else {
          startObserving(config, flags);
        }
      } else {
        stopObserving();
        removeBanner();
        removeWarning();
      }
    }
  });
}

init();
