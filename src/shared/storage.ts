export interface Settings {
  enabled: boolean;
}

const DEFAULTS: Settings = { enabled: true };

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
