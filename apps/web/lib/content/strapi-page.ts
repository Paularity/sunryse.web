import "server-only";

import { strapiFetch } from "@/lib/strapi";

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Merge editor content from Strapi over the bundled defaults, shaped by the defaults:
 * objects merge key by key (unknown keys are dropped), non-empty arrays replace the default
 * (each object item is filled from the matching default item), and values of the wrong type
 * are ignored. A half-edited or broken entry therefore never breaks a page.
 */
export function mergeContent<T>(base: T, over: unknown): T {
  if (over === undefined || over === null) return base;
  if (isObj(base)) {
    if (!isObj(over)) return base;
    const out: Json = {};
    for (const key of Object.keys(base)) out[key] = mergeContent(base[key], over[key]);
    return out as T;
  }
  if (Array.isArray(base)) {
    if (!Array.isArray(over) || over.length === 0) return base;
    const template = base[0];
    return over.map((item, i) => (template === undefined ? item : mergeContent(base[i] ?? template, item))) as T;
  }
  return (typeof over === typeof base ? over : base) as T;
}

/** Read one JSON field from a Strapi entry; null when Strapi is off, unreachable or empty. */
export async function strapiJson(path: string, field: string, tag: string, query?: Record<string, unknown>): Promise<unknown> {
  if (!process.env.STRAPI_URL) return null;
  try {
    const res = await strapiFetch<{ data: Json | Json[] | null }>(path, { tags: [tag], query });
    const entry = Array.isArray(res.data) ? res.data[0] : res.data;
    return entry?.[field] ?? null;
  } catch {
    return null;
  }
}

/** Page copy from a Strapi single type's `content` JSON, merged over the bundled defaults. */
export async function pageContent<T>(singleType: string, fallback: T): Promise<T> {
  return mergeContent(fallback, await strapiJson(singleType, "content", singleType));
}

/* ── Field helpers for single types built from real fields (About, Pricing) ── */
// Raw Strapi JSON, shape-checked field by field by the callers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Raw = Record<string, any>;

/** Blank text counts as "not filled in", so mergeContent keeps the bundled default. */
export const text = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
export const items = (v: unknown, map: (x: Raw) => unknown) => (Array.isArray(v) ? v.map(map) : undefined);
export const pick = (o: Raw | null | undefined, ...keys: string[]) =>
  o ? Object.fromEntries(keys.map((k) => [k, text(o[k])])) : undefined;
