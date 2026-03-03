import { getSettings } from "../shared/storage";
import { getSubmitCounts, getTodayTotal } from "../shared/counter-storage";

function updateBadge(todayCount: number) {
  chrome.action.setBadgeText({ text: todayCount > 0 ? String(todayCount) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
}

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "sync") {
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
  }

  if (area === "local" && changes.submitCounts) {
    const counts = await getSubmitCounts();
    updateBadge(getTodayTotal(counts));
  }
});

// Set badge on startup
getSubmitCounts().then((counts) => updateBadge(getTodayTotal(counts)));
