export interface SiteConfig {
  /** Hostnames this config applies to */
  hostnames: string[];
  /** Ordered list of CSS selectors for the text input element. First match wins. */
  inputSelectors: string[];
  /** CSS selector for the container to insert the banner above. If not provided, uses the input's parentElement. */
  containerSelector?: string;
  /** After finding the container, walk up this many additional parent levels before inserting. Default 0. */
  ancestorLevels?: number;
  /** If true, auto-detect insertion point by walking up the DOM. */
  floating?: boolean;
  /** Insert banner "before" or "after" the container. Default "before". */
  insertPosition?: "before" | "after";
  /** For auto-detect (floating), which Nth ancestor-with-sibling to use. Default 1. */
  siblingMatchIndex?: number;
}
