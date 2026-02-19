export interface Settings {
  enabled: boolean;
  messagesEnabled: boolean;
  sensitiveInfoEnabled: boolean;
}

const DEFAULTS: Settings = {
  enabled: true,
  messagesEnabled: true,
  sensitiveInfoEnabled: true,
};

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(DEFAULTS);
  return result as Settings;
}

export async function setSettings(settings: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(settings);
}

export async function isEnabled(): Promise<boolean> {
  const { enabled } = await getSettings();
  return enabled;
}
