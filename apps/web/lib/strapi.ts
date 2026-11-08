import "server-only";
import qs from "qs";
import { cacheLife, cacheTag } from "next/cache";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://localhost:1337";

type FetchOptions = {
  /** Strapi REST query (populate, filters, sort, pagination…) — serialized with qs. */
  query?: Record<string, unknown>;
  /** Cache tags; revalidated by the Strapi webhook via /api/revalidate. */
  tags?: string[];
};

export class StrapiError extends Error {
  constructor(
    public status: number,
    public path: string,
  ) {
    super(`Strapi ${status} for ${path}`);
  }
}

/**
 * Cached read from the Strapi REST API (server only).
 * Uses Cache Components: `'use cache'` + tags, invalidated with revalidateTag(tag, "max").
 */
export async function strapiFetch<T>(path: string, { query, tags = [] }: FetchOptions = {}): Promise<T> {
  "use cache";
  cacheLife("hours");
  cacheTag("strapi", ...tags);

  const search = query ? `?${qs.stringify(query, { encodeValuesOnly: true })}` : "";
  const url = `${STRAPI_URL}/api/${path.replace(/^\//, "")}${search}`;

  const res = await fetch(url, {
    headers: process.env.STRAPI_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_TOKEN}` } : undefined,
  });
  if (!res.ok) throw new StrapiError(res.status, path);
  return (await res.json()) as T;
}

/** Absolute URL for a Strapi media path (uploads are served by Strapi in dev). */
export function strapiMedia(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${STRAPI_URL}${url}`;
}

/** Uncached write — used only by server routes (e.g. lead creation). */
export async function strapiCreate<T>(collection: string, data: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api/${collection}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.STRAPI_TOKEN ?? ""}`,
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new StrapiError(res.status, collection);
  return (await res.json()) as T;
}
