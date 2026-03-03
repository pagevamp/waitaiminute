export interface SubmitCounts {
  total: number;
  days: Record<string, Record<string, number>>; // { "2026-03-02": { "chatgpt.com": 3, "claude.ai": 1 } }
}

const STORAGE_KEY = "submitCounts";

const DEFAULTS: SubmitCounts = {
  total: 0,
  days: {},
};

export async function getSubmitCounts(): Promise<SubmitCounts> {
  const result = await chrome.storage.local.get({ [STORAGE_KEY]: DEFAULTS });
  return result[STORAGE_KEY] as SubmitCounts;
}

export async function incrementSubmitCount(hostname: string): Promise<void> {
  const counts = await getSubmitCounts();
  const today = new Date().toISOString().slice(0, 10);

  counts.total += 1;
  if (!counts.days[today]) counts.days[today] = {};
  counts.days[today][hostname] = (counts.days[today][hostname] ?? 0) + 1;

  await chrome.storage.local.set({ [STORAGE_KEY]: counts });
}

export async function resetSubmitCounts(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: { ...DEFAULTS, days: {} } });
}

export async function resetTodayCounts(): Promise<void> {
  const counts = await getSubmitCounts();
  const today = new Date().toISOString().slice(0, 10);
  const todayTotal = getDateTotal(counts, today);
  delete counts.days[today];
  counts.total = Math.max(0, counts.total - todayTotal);
  await chrome.storage.local.set({ [STORAGE_KEY]: counts });
}

/** Derive today's total across all sites */
export function getTodayTotal(counts: SubmitCounts): number {
  const today = new Date().toISOString().slice(0, 10);
  const sites = counts.days[today];
  if (!sites) return 0;
  return Object.values(sites).reduce((sum, n) => sum + n, 0);
}

/** Get date strings that have data, sorted descending (newest first) */
export function getDatesWithData(counts: SubmitCounts): string[] {
  return Object.keys(counts.days)
    .filter((d) => {
      const sites = counts.days[d];
      return sites && Object.values(sites).some((n) => n > 0);
    })
    .sort((a, b) => b.localeCompare(a));
}

/** Sum of all sites for a specific date */
export function getDateTotal(counts: SubmitCounts, date: string): number {
  const sites = counts.days[date];
  if (!sites) return 0;
  return Object.values(sites).reduce((sum, n) => sum + n, 0);
}

/** Derive all-time totals per site */
export function getSiteTotals(counts: SubmitCounts): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const sites of Object.values(counts.days)) {
    for (const [site, count] of Object.entries(sites)) {
      totals[site] = (totals[site] ?? 0) + count;
    }
  }
  return totals;
}
