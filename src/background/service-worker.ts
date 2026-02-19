import { getSettings } from "../shared/storage";

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "sync") return;

  if (changes.enabled || changes.messagesEnabled || changes.sensitiveInfoEnabled) {
    const settings = await getSettings();

    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: "SETTINGS_CHANGED",
            ...settings,
          }).catch(() => {
            // Tab may not have content script loaded — ignore
          });
        }
      }
    });
  }
});
