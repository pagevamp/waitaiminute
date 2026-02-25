import { SiteConfig } from "./sites/types";
import { getRandomMessage } from "./rotation";

const BANNER_ATTR = "data-waitaiminute-banner";
const TYPING_SPEED = 30; // ms per character

let typingTimer: ReturnType<typeof setTimeout> | null = null;

function cancelTyping(): void {
  if (typingTimer !== null) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }
}

function typeText(el: Element, message: string): void {
  cancelTyping();
  el.textContent = "";
  el.classList.add("waitaiminute-typing");

  let i = 0;
  function tick() {
    if (i < message.length) {
      el.textContent = message.slice(0, i + 1);
      i++;
      typingTimer = setTimeout(tick, TYPING_SPEED);
    } else {
      typingTimer = null;
      el.classList.remove("waitaiminute-typing");
    }
  }
  tick();
}

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
  cancelTyping();
  const banner = getBanner();
  if (banner) banner.remove();
}

function parseLuminance(color: string): number | null {
  const m = color.match(/\d+/g);
  if (!m || m.length < 3) return null;
  return (0.299 * Number(m[0]) + 0.587 * Number(m[1]) + 0.114 * Number(m[2])) / 255;
}

function applyOpaqueBackground(banner: HTMLElement): void {
  // Use the inherited text color to determine if the theme is dark or light
  const textLum = parseLuminance(getComputedStyle(banner).color);
  if (textLum === null) return;
  const expectLightBg = textLum < 0.5; // dark text → light background

  // Walk up to find the first ancestor bg that matches the expected theme
  let el: Element | null = banner.parentElement;
  while (el) {
    const bg = getComputedStyle(el).backgroundColor;
    if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
      const bgLum = parseLuminance(bg);
      if (bgLum !== null && (bgLum > 0.5) === expectLightBg) {
        banner.style.backgroundColor = bg;
        return;
      }
    }
    el = el.parentElement;
  }

  // Fallback: generic theme-appropriate background
  banner.style.backgroundColor = expectLightBg
    ? "rgb(255, 255, 255)"
    : "rgb(32, 33, 35)";
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
  banner.appendChild(text);

  typeText(text, getRandomMessage());

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
  applyOpaqueBackground(banner);

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
  applyOpaqueBackground(banner);

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

  cancelTyping();
  text.classList.add("waitaiminute-fade-out");
  setTimeout(() => {
    text.classList.remove("waitaiminute-fade-out");
    typeText(text, message);
  }, 300);
}
