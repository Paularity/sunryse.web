import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Strapi webhook target. Configure in Strapi → Settings → Webhooks:
 *   URL: <site>/api/revalidate   Header: x-revalidate-secret: <REVALIDATE_SECRET>
 * Revalidates the "strapi" tag plus a tag named after the changed model (e.g. "service").
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { model?: unknown };
  const tags = ["strapi"];
  if (typeof body.model === "string" && /^[a-z0-9-]{1,64}$/.test(body.model)) tags.push(body.model);

  for (const tag of tags) revalidateTag(tag, "max");
  return NextResponse.json({ ok: true, revalidated: tags });
}
