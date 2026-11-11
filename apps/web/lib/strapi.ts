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

type CachedResult = { ok: true; body: unknown } | { ok: false; status: number };

/** How long a failed read is kept before Strapi is tried again (see cachedGet). */
const RETRY_SOON = "minutes";

/**
 * The cached part. It never throws: a good read is cached for hours (cleared by the Strapi webhook via
 * revalidateTag), a failed read for about a minute, so an outage is retried soon. Not "seconds": Next treats
 * caches that short as live data, so a build with the CMS down could not pre-render pages from the bundled
 * defaults and failed.
 */
async function cachedGet(url: string, tags: string[]): Promise<CachedResult> {
  "use cache";
  cacheTag("strapi", ...tags);
  try {
    const res = await fetch(url, {
      headers: process.env.STRAPI_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_TOKEN}` } : undefined,
    });
    if (!res.ok) {
      cacheLife(RETRY_SOON);
      return { ok: false, status: res.status };
    }
    cacheLife("hours");
    return { ok: true, body: await res.json() };
  } catch {
    cacheLife(RETRY_SOON);
    return { ok: false, status: 0 };
  }
}

/** Cached read from the Strapi REST API (server only). Throws StrapiError on failure. */
export async function strapiFetch<T>(path: string, { query, tags = [] }: FetchOptions = {}): Promise<T> {
  const search = query ? `?${qs.stringify(query, { encodeValuesOnly: true })}` : "";
  const url = `${STRAPI_URL}/api/${path.replace(/^\//, "")}${search}`;
  const result = await cachedGet(url, tags);
  if (!result.ok) throw new StrapiError(result.status, path);
  return result.body as T;
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

export async function strapiUpdate<T>(collection: string, documentId: string, data: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api/${collection}/${encodeURIComponent(documentId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.STRAPI_TOKEN ?? ""}`,
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new StrapiError(res.status, collection);
  return (await res.json()) as T;
}
