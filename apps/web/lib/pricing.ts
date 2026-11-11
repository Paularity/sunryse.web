import type { Package, PackageSystemType } from "@/lib/content/types";

/** "{count} × {watt} W panels" → "10 × 645 W panels". Unknown placeholders are left as they are. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

/** URL-safe key for names without a slug field (add-ons): "Extra battery module" → "extra-battery-module". */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Drop a leading section number ("[ 01 ] System packages" → "System packages") where the copy is reused elsewhere. */
export const unnumbered = (eyebrow: string) => eyebrow.replace(/^\s*\[\s*\d+\s*\]\s*/, "");

/** Packages grouped by system type, groups and items in CMS order. */
export function groupPackages(list: Package[]) {
  const groups = new Map<PackageSystemType, Package[]>();
  for (const p of list) groups.set(p.systemType, [...(groups.get(p.systemType) ?? []), p]);
  return [...groups].map(([type, items]) => ({ type, items }));
}

/**
 * A short row of packages for teasers (homepage, solution pages): the first featured package with its neighbours
 * of the same system type, in CMS order. Without a featured one it starts at the first package. Tops up from the
 * rest of the list when that type has fewer than `n`.
 */
export function pickPackages(list: Package[], n = 3): Package[] {
  if (list.length <= n) return list;
  const anchor = list.find((p) => p.featured) ?? list[0];
  const group = list.filter((p) => p.systemType === anchor.systemType);
  const at = group.indexOf(anchor);
  const start = Math.max(0, Math.min(at - Math.floor((n - 1) / 2), group.length - n));
  const picked = group.slice(start, start + n);
  for (const p of list) if (picked.length < n && !picked.includes(p)) picked.push(p);
  return picked;
}
