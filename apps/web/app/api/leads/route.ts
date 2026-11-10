import { NextResponse, type NextRequest } from "next/server";
import { leadSchema } from "@/lib/lead-schema";
import { strapiCreate } from "@/lib/strapi";

/** Creates a lead in Strapi using the server-side API token. Returns its id so the calculator can update it. */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
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
    // TODO(phase 6): notify SunRyse by email (Resend) once the address is confirmed.
    return NextResponse.json({ ok: true, id: created.data?.documentId ?? null });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save your request. Please call us." }, { status: 502 });
  }
}
