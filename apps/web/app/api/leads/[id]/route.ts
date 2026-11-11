import { NextResponse, type NextRequest } from "next/server";
import { clientKey, createRateLimiter } from "@/lib/lead-guard";
import { leadIdSchema, leadUpdateSchema } from "@/lib/lead-schema";
import { strapiUpdate } from "@/lib/strapi";

/**
 * Calculator: attaches the visitor's answers and estimate to the lead created at the contact step.
 * Only calculator fields can change; contact details can't be edited through this route.
 */
/** Estimate updates per visitor (each change of package, battery or payment sends one). */
const allow = createRateLimiter({ limit: 40, windowMs: 10 * 60_000 });

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
  if (!allow(clientKey(req.headers))) return NextResponse.json({ ok: false }, { status: 429 });
  const { id } = await ctx.params;
  if (!leadIdSchema.safeParse(id).success) return NextResponse.json({ ok: false }, { status: 400 });
  const parsed = leadUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  try {
    await strapiUpdate("leads", id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
