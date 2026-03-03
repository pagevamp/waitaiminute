import { getSettings, setSettings } from "../shared/storage";
import {
  getSubmitCounts,
  resetSubmitCounts,
  resetTodayCounts,
  getDatesWithData,
  getDateTotal,
} from "../shared/counter-storage";

// Settings elements
const toggle = document.getElementById("enableToggle") as HTMLInputElement;
const messagesToggle = document.getElementById(
  "messagesToggle",
) as HTMLInputElement;
const sensitiveToggle = document.getElementById(
  "sensitiveToggle",
) as HTMLInputElement;
const subToggles = document.getElementById("subToggles") as HTMLElement;

// Tab elements
const tabBtns = document.querySelectorAll<HTMLButtonElement>(".tab-btn");
const tabContents = document.querySelectorAll<HTMLElement>(".tab-content");

// Stats elements
const totalCountEl = document.getElementById("totalCount") as HTMLElement;
const dateLabelEl = document.getElementById("dateLabel") as HTMLElement;
const prevDateBtn = document.getElementById("prevDate") as HTMLButtonElement;
const nextDateBtn = document.getElementById("nextDate") as HTMLButtonElement;
const daySection = document.getElementById("daySection") as HTMLElement;
const dayTotalEl = document.getElementById("dayTotal") as HTMLElement;
const siteListEl = document.getElementById("siteList") as HTMLElement;
const emptyState = document.getElementById("emptyState") as HTMLElement;
const resetTodayBtn = document.getElementById("resetTodayBtn") as HTMLButtonElement;
const resetAllBtn = document.getElementById("resetAllBtn") as HTMLButtonElement;

// State
let datesWithData: string[] = [];
let currentDateIndex = 0;

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function updateSubTogglesState(masterEnabled: boolean) {
  messagesToggle.disabled = !masterEnabled;
  sensitiveToggle.disabled = !masterEnabled;
  subToggles.classList.toggle("disabled", !masterEnabled);
}

async function updateStats() {
  const counts = await getSubmitCounts();

  totalCountEl.textContent = String(counts.total);

  datesWithData = getDatesWithData(counts);
  const today = new Date().toISOString().slice(0, 10);

  if (datesWithData.length === 0) {
    daySection.style.display = "none";
    document.querySelector(".date-nav")!.classList.add("hidden");
    emptyState.classList.add("visible");
    return;
  }

  emptyState.classList.remove("visible");
  daySection.style.display = "";
  document.querySelector(".date-nav")!.classList.remove("hidden");

  // Default to today if it has data, otherwise latest date
  const todayIdx = datesWithData.indexOf(today);
  currentDateIndex = todayIdx >= 0 ? todayIdx : 0;

  renderDate(counts);
}

function renderDate(
  counts?: Awaited<ReturnType<typeof getSubmitCounts>>,
) {
  if (datesWithData.length === 0) return;

  const date = datesWithData[currentDateIndex];
  dateLabelEl.textContent = formatDate(date);

  prevDateBtn.disabled = currentDateIndex >= datesWithData.length - 1;
  nextDateBtn.disabled = currentDateIndex <= 0;

  if (counts) {
    const dayTotal = getDateTotal(counts, date);
    dayTotalEl.textContent = String(dayTotal);

    siteListEl.innerHTML = "";
    const sites = counts.days[date] ?? {};
    const sorted = Object.entries(sites).sort((a, b) => b[1] - a[1]);
    for (const [site, count] of sorted) {
      if (count === 0) continue;
      const row = document.createElement("div");
      row.className = "site-row";
      row.innerHTML = `<span class="site-name">${site}</span><span class="site-count">${count}</span>`;
      siteListEl.appendChild(row);
    }
  }
}

async function navigateDate(delta: number) {
  const newIndex = currentDateIndex + delta;
  if (newIndex < 0 || newIndex >= datesWithData.length) return;
  currentDateIndex = newIndex;

  const counts = await getSubmitCounts();
  renderDate(counts);
}

function setupResetButton(
  btn: HTMLButtonElement,
  confirmText: string,
  action: () => Promise<void>,
) {
  let pending = false;
  let timer: ReturnType<typeof setTimeout>;
  const originalText = btn.textContent!;

  btn.addEventListener("click", async () => {
    if (!pending) {
      pending = true;
      btn.textContent = confirmText;
      btn.classList.add("confirm");
      timer = setTimeout(() => {
        pending = false;
        btn.textContent = originalText;
        btn.classList.remove("confirm");
      }, 2000);
      return;
    }
    clearTimeout(timer);
    pending = false;
    btn.textContent = originalText;
    btn.classList.remove("confirm");
    await action();
  });
}

async function init() {
  const settings = await getSettings();
  toggle.checked = settings.enabled;
  messagesToggle.checked = settings.messagesEnabled;
  sensitiveToggle.checked = settings.sensitiveInfoEnabled;
  updateSubTogglesState(settings.enabled);

  // Tab switching
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab!)!.classList.add("active");
    });
  });

  // Settings toggles
  toggle.addEventListener("change", async () => {
    await setSettings({ enabled: toggle.checked });
    updateSubTogglesState(toggle.checked);
  });

  messagesToggle.addEventListener("change", async () => {
    await setSettings({ messagesEnabled: messagesToggle.checked });
  });

  sensitiveToggle.addEventListener("change", async () => {
    await setSettings({ sensitiveInfoEnabled: sensitiveToggle.checked });
  });

  // Date navigation
  prevDateBtn.addEventListener("click", () => navigateDate(1));
  nextDateBtn.addEventListener("click", () => navigateDate(-1));

  // Reset with inline confirm
  setupResetButton(resetTodayBtn, "Sure?", async () => {
    await resetTodayCounts();
    await updateStats();
  });

  setupResetButton(resetAllBtn, "Sure?", async () => {
    await resetSubmitCounts();
    await updateStats();
  });

  // Live updates
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes["submitCounts"]) {
      updateStats();
    }
  });

  await updateStats();
}

init();
