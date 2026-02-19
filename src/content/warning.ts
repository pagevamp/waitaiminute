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

function createWarningElement(): HTMLElement {
  const warning = document.createElement("div");
  warning.setAttribute(WARNING_ATTR, "true");
  warning.className = "waitaiminute-warning";

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
  text.textContent = `Sensitive info detected: ${details}`;
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
