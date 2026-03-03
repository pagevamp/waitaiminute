import { SiteConfig } from "./sites/types";
import { findInput } from "./injector";
import { incrementSubmitCount } from "../shared/counter-storage";

let abortController: AbortController | null = null;
let trackedInput: Element | null = null;
let lastSubmitTime = 0;

const DEBOUNCE_MS = 500;

function extractText(el: Element): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  return el.textContent ?? "";
}

function recordSubmit(): void {
  const now = Date.now();
  if (now - lastSubmitTime < DEBOUNCE_MS) return;
  lastSubmitTime = now;
  incrementSubmitCount(window.location.hostname);
}

function isInputStale(config: SiteConfig): boolean {
  if (!trackedInput) return true;
  if (!trackedInput.isConnected) return true;
  const current = findInput(config);
  return current !== trackedInput;
}

function matchesSubmitButton(target: EventTarget | null, config: SiteConfig): boolean {
  if (!config.submitButtonSelectors || !(target instanceof Element)) return false;
  for (const selector of config.submitButtonSelectors) {
    // Check if the clicked element or any ancestor matches the selector
    if (target.matches(selector) || target.closest(selector)) return true;
  }
  return false;
}

export function startTracking(config: SiteConfig): void {
  if (abortController && !isInputStale(config)) return;

  if (abortController) {
    abortController.abort();
    abortController = null;
  }

  const input = findInput(config);
  if (!input) return;

  trackedInput = input;
  abortController = new AbortController();
  const { signal } = abortController;

  // Enter key listener on document capture phase — fires before frameworks
  // like ProseMirror can stopImmediatePropagation on the input element
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
      // Only count if the event originates from our tracked input
      const target = e.target as Element | null;
      if (!target || (target !== input && !input.contains(target))) return;
      const text = extractText(input).trim();
      if (!text) return;
      recordSubmit();
    },
    { signal, capture: true },
  );

  // Delegated pointerdown listener on capture phase — fires before the app
  // processes the submit and clears the input field
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!matchesSubmitButton(e.target, config)) return;
      const currentInput = findInput(config);
      const text = extractText(currentInput ?? input).trim();
      if (!text) return;
      recordSubmit();
    },
    { signal, capture: true },
  );
}

export function stopTracking(): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  trackedInput = null;
}
