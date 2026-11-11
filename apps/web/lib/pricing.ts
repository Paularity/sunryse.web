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

/**
 * The standard package nearest to a calculated system: same system type and the same battery-or-not (a hybrid
 * estimate without a battery is not comparable to a hybrid package with one), the visitor's segment preferred,
 * then the closest kWp (the smaller one on a tie). Null when nothing comparable is in the catalogue.
 */
export function closestPackage<P extends Pick<Package, "systemType" | "segment" | "kwp" | "batteryKwh">>(
  list: P[],
  system: { systemType: PackageSystemType; kwp: number; segment?: Package["segment"]; batteryKwh?: number },
): P | null {
  const hasBattery = (system.batteryKwh ?? 0) > 0;
  const sameType = list.filter((p) => p.systemType === system.systemType && (p.batteryKwh ?? 0) > 0 === hasBattery);
  const sameSegment = sameType.filter((p) => p.segment === system.segment);
  const pool = sameSegment.length ? sameSegment : sameType;
  let best: P | null = null;
  for (const p of pool) {
    const d = Math.abs(p.kwp - system.kwp);
    const bd = best ? Math.abs(best.kwp - system.kwp) : Infinity;
    if (d < bd || (d === bd && best && p.kwp < best.kwp)) best = p;
  }
  return best;
}
