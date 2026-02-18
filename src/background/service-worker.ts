chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;

  if (changes.enabled) {
    // Notify all content scripts about the settings change
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: "SETTINGS_CHANGED",
            enabled: changes.enabled.newValue,
          }).catch(() => {
            // Tab may not have content script loaded — ignore
          });
        }
      }
    });
  }
});
