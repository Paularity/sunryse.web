import { NextResponse, type NextRequest } from "next/server";
import { leadSchema } from "@/lib/lead-schema";
import { strapiCreate } from "@/lib/strapi";

/** Creates a quote request in Strapi using the server-side API token. */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // `consent` is required by the schema but is not stored in Strapi.
  const lead = { ...parsed.data, consent: undefined };
  try {
    await strapiCreate("leads", { ...lead, source: lead.source ?? "website" });
    // TODO(phase 6): notify SunRyse by email (Resend) once the address is confirmed.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save your request. Please call us." }, { status: 502 });
  }
}
