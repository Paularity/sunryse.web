import type { UiLabels } from "./types";

/**
 * Look up an interface label. `{name}` placeholders are filled from vars.
 * Labels come from site.ui (Strapi global.ui merged over content/site.json), so every key always exists.
 */
export function t(ui: UiLabels, key: string, vars?: Record<string, string | number>): string {
  const text = ui[key] ?? "";
  return vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text;
}
