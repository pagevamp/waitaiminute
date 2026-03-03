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

interface BannerTheme {
  light: { bg: [string, string]; text: string; border: string };
  dark: { bg: [string, string]; text: string; border: string };
}

const THEMES: BannerTheme[] = [
  { light: { bg: ["#dbeafe", "#bfdbfe"], text: "#1e3a8a", border: "#3b82f633" },
    dark:  { bg: ["#1e3a5f", "#1e40af"], text: "#bfdbfe", border: "#3b82f633" } },
  { light: { bg: ["#d1fae5", "#a7f3d0"], text: "#065f46", border: "#10b98133" },
    dark:  { bg: ["#064e3b", "#065f46"], text: "#a7f3d0", border: "#10b98133" } },
  { light: { bg: ["#ede9fe", "#ddd6fe"], text: "#4c1d95", border: "#8b5cf633" },
    dark:  { bg: ["#3b0764", "#4c1d95"], text: "#ddd6fe", border: "#8b5cf633" } },
  { light: { bg: ["#ccfbf1", "#99f6e4"], text: "#134e4a", border: "#14b8a633" },
    dark:  { bg: ["#134e4a", "#115e59"], text: "#99f6e4", border: "#14b8a633" } },
  { light: { bg: ["#fef3c7", "#fde68a"], text: "#78350f", border: "#f59e0b33" },
    dark:  { bg: ["#451a03", "#78350f"], text: "#fde68a", border: "#f59e0b33" } },
  { light: { bg: ["#fce7f3", "#fbcfe8"], text: "#831843", border: "#ec489933" },
    dark:  { bg: ["#500724", "#831843"], text: "#fbcfe8", border: "#ec489933" } },
  { light: { bg: ["#e0e7ff", "#c7d2fe"], text: "#312e81", border: "#6366f133" },
    dark:  { bg: ["#1e1b4b", "#312e81"], text: "#c7d2fe", border: "#6366f133" } },
];

function isDarkMode(): boolean {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return true;
  const html = document.documentElement;
  const body = document.body;
  if (html.classList.contains("dark") || body.classList.contains("dark")) return true;
  if (html.getAttribute("data-theme") === "dark") return true;
  if (html.getAttribute("data-mode") === "dark") return true;
  return false;
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function applyDailyTheme(banner: HTMLElement): void {
  const theme = THEMES[getDayOfYear() % THEMES.length];
  const colors = isDarkMode() ? theme.dark : theme.light;
  banner.style.background = `linear-gradient(135deg, ${colors.bg[0]}, ${colors.bg[1]})`;
  banner.style.color = colors.text;
  banner.style.borderColor = colors.border;
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
  applyDailyTheme(banner);

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
  applyDailyTheme(banner);

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
