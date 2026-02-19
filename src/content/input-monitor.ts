import { SiteConfig } from "./sites/types";
import { findInput } from "./injector";
import { detectSensitiveInfo } from "./detector";
import { injectWarning, updateWarning, removeWarning, warningExists } from "./warning";

let abortController: AbortController | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const DEBOUNCE_MS = 300;

function extractText(el: Element): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  // contenteditable elements
  return el.textContent ?? "";
}

function handleInput(config: SiteConfig, input: Element): void {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const text = extractText(input);
    const matches = detectSensitiveInfo(text);

    if (matches.length > 0) {
      if (!warningExists()) {
        injectWarning(config, input);
      }
      updateWarning(matches);
    } else {
      removeWarning();
    }
  }, DEBOUNCE_MS);
}

export function isMonitoring(): boolean {
  return abortController !== null;
}

export function startMonitoring(config: SiteConfig): void {
  if (isMonitoring()) return;

  const input = findInput(config);
  if (!input) return;

  abortController = new AbortController();
  const { signal } = abortController;

  const listener = () => handleInput(config, input);

  input.addEventListener("input", listener, { signal });
  input.addEventListener("keyup", listener, { signal });
}

export function stopMonitoring(): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  removeWarning();
}
