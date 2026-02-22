import { SiteConfig } from "./sites/types";
import { findInput } from "./injector";
import { SensitiveMatch } from "./detector";

const WARNING_ATTR = "data-waitaiminute-warning";

export function warningExists(): boolean {
  return document.querySelector(`[${WARNING_ATTR}]`) !== null;
}

export function getWarning(): HTMLElement | null {
  return document.querySelector(`[${WARNING_ATTR}]`);
}

export function removeWarning(): void {
  const warning = getWarning();
  if (warning) warning.remove();
}

function isDarkBackground(): boolean {
  // Check computed background on body, then html
  for (const el of [document.body, document.documentElement]) {
    const bg = getComputedStyle(el).backgroundColor;
    const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) continue;
    const [, rs, gs, bs, as] = match;
    const a = as !== undefined ? parseFloat(as) : 1;
    if (a < 0.1) continue; // transparent, try next element
    const luminance =
      (0.299 * Number(rs) + 0.587 * Number(gs) + 0.114 * Number(bs)) / 255;
    return luminance < 0.5;
  }
  // Fall back to class-based detection
  const html = document.documentElement;
  if (
    html.classList.contains("dark") ||
    html.getAttribute("data-theme") === "dark" ||
    document.body.classList.contains("dark")
  )
    return true;
  return false;
}

function createWarningElement(): HTMLElement {
  const warning = document.createElement("div");
  warning.setAttribute(WARNING_ATTR, "true");
  warning.className = "waitaiminute-warning";
  const dark = isDarkBackground();
  warning.style.color = dark ? "#fca5a5" : "#7f1d1d";
  warning.style.background = dark ? "#450a0a" : "#fee2e2";
  warning.style.border = dark ? "1px solid #7f1d1d33" : "1px solid #ef444433";

  const icon = document.createElement("span");
  icon.className = "waitaiminute-warning-icon";
  icon.textContent = "\u26A0";
  warning.appendChild(icon);

  const text = document.createElement("span");
  text.className = "waitaiminute-warning-text";
  warning.appendChild(text);

  return warning;
}

export function updateWarning(matches: SensitiveMatch[]): void {
  const warning = getWarning();
  if (!warning) return;

  const text = warning.querySelector(".waitaiminute-warning-text");
  if (!text) return;

  const details = matches.map((m) => `${m.type} (${m.match})`).join(", ");
  text.textContent = `Potential sensitive info detected: ${details}`;
}

export function injectWarning(config: SiteConfig, input: Element): void {
  if (warningExists()) return;

  let container: Element | null = null;

  if (config.floating) {
    // For floating/auto-detect, walk up to find a suitable ancestor
    const minWidth = window.innerWidth * 0.4;
    let el: Element | null = input;
    while (el.parentElement && el.parentElement !== document.body) {
      el = el.parentElement;
      if (el.nextElementSibling) {
        const rect = el.getBoundingClientRect();
        if (rect.width >= minWidth && rect.height >= 80) {
          container = el;
          break;
        }
      }
    }
    if (!container) container = el;
  } else {
    if (config.containerSelector) {
      container = input.closest(config.containerSelector);
    }
    if (!container) {
      container = input.parentElement;
    }
    const levels = config.ancestorLevels ?? 0;
    for (let i = 0; i < levels; i++) {
      if (container?.parentElement) {
        container = container.parentElement;
      }
    }
  }

  if (!container) return;

  const warning = createWarningElement();
  container.after(warning);
}
