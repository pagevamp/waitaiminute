import { SiteConfig } from "./sites/types";
import { getRandomMessage } from "./rotation";

const BANNER_ATTR = "data-waitaiminute-banner";

export function findInput(config: SiteConfig): Element | null {
  for (const selector of config.inputSelectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

export function bannerExists(): boolean {
  return document.querySelector(`[${BANNER_ATTR}]`) !== null;
}

export function getBanner(): HTMLElement | null {
  return document.querySelector(`[${BANNER_ATTR}]`);
}

export function removeBanner(): void {
  const banner = getBanner();
  if (banner) banner.remove();
}

function createBannerElement(): HTMLElement {
  const banner = document.createElement("div");
  banner.setAttribute(BANNER_ATTR, "true");
  banner.className = "waitaiminute-banner";

  const icon = document.createElement("span");
  icon.className = "waitaiminute-icon";
  icon.textContent = "\u270B";
  banner.appendChild(icon);

  const text = document.createElement("span");
  text.className = "waitaiminute-text";
  text.textContent = getRandomMessage();
  banner.appendChild(text);

  return banner;
}

/**
 * Walk up from the input element to find a good insertion point.
 * For "before": finds the first wide ancestor with a previous sibling.
 * For "after": finds the first tall+wide ancestor with a next sibling.
 */
function findInsertionAncestor(
  input: Element,
  position: "before" | "after"
): Element | null {
  const minWidth = window.innerWidth * 0.4;
  const minHeight = position === "after" ? 80 : 0;
  let el: Element | null = input;

  while (el.parentElement && el.parentElement !== document.body) {
    el = el.parentElement;
    const hasSibling =
      position === "after" ? el.nextElementSibling : el.previousElementSibling;
    if (hasSibling) {
      const rect = el.getBoundingClientRect();
      if (rect.width >= minWidth && rect.height >= minHeight) {
        return el;
      }
    }
  }

  return el;
}

function insertBannerRelativeTo(
  banner: HTMLElement,
  target: Element,
  position: "before" | "after"
): void {
  if (position === "after") {
    target.after(banner);
  } else {
    target.parentElement?.insertBefore(banner, target);
  }
}

function injectAutoDetectBanner(config: SiteConfig): HTMLElement | null {
  const input = findInput(config);
  if (!input) return null;

  const position = config.insertPosition ?? "before";
  const ancestor = findInsertionAncestor(input, position);
  if (!ancestor?.parentElement) return null;

  const banner = createBannerElement();
  insertBannerRelativeTo(banner, ancestor, position);

  return banner;
}

function injectDomBanner(config: SiteConfig): HTMLElement | null {
  const input = findInput(config);
  if (!input) return null;

  let container: Element | null = null;
  if (config.containerSelector) {
    container = input.closest(config.containerSelector);
  }
  if (!container) {
    container = input.parentElement;
  }
  if (!container) return null;

  const levels = config.ancestorLevels ?? 0;
  for (let i = 0; i < levels; i++) {
    if (container.parentElement) {
      container = container.parentElement;
    }
  }

  const banner = createBannerElement();
  insertBannerRelativeTo(banner, container, config.insertPosition ?? "before");

  return banner;
}

export function injectBanner(config: SiteConfig): HTMLElement | null {
  if (bannerExists()) return getBanner();

  if (config.floating) {
    return injectAutoDetectBanner(config);
  }
  return injectDomBanner(config);
}

export function updateBannerMessage(message: string): void {
  const banner = getBanner();
  if (!banner) return;

  const text = banner.querySelector(".waitaiminute-text");
  if (!text) return;

  text.classList.add("waitaiminute-fade-out");
  setTimeout(() => {
    text.textContent = message;
    text.classList.remove("waitaiminute-fade-out");
  }, 300);
}
