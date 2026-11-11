import { after, NextResponse, type NextRequest } from "next/server";
import { clientKey, createRateLimiter, isBot } from "@/lib/lead-guard";
import { notifyNewLead } from "@/lib/lead-notify";
import { leadSchema } from "@/lib/lead-schema";
import { strapiCreate } from "@/lib/strapi";

/** New leads per visitor: generous for real people (a form and a calculator run), tight for scripts. */
const allow = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

/** Creates a lead in Strapi using the server-side API token. Returns its id so the calculator can update it. */
export async function POST(req: NextRequest) {
  if (!allow(clientKey(req.headers))) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please call us." }, { status: 429 });
  }
  const json = await req.json().catch(() => null);
  // Honeypot filled: answer like a success so the bot moves on, but save nothing.
  if (isBot(json)) return NextResponse.json({ ok: true, id: null });
  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // `consent` is required by the schema but is not stored in Strapi.
  // An empty optional email would fail Strapi's email validation, so it is dropped.
  const { consent: _consent, email, ...rest } = parsed.data;
  void _consent;
  const lead = { ...rest, ...(email ? { email } : {}) };
  try {
    const created = await strapiCreate<{ data?: { documentId?: string } }>("leads", {
      ...lead,
      source: lead.source ?? "website",
    });
    const id = created.data?.documentId ?? null;
    // Email SunRyse after the response is sent, so the visitor never waits on it (off until Resend is configured).
    after(() => notifyNewLead(lead, id));
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save your request. Please call us." }, { status: 502 });
  }
}
