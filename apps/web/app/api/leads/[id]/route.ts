import { NextResponse, type NextRequest } from "next/server";
import { leadIdSchema, leadUpdateSchema } from "@/lib/lead-schema";
import { strapiUpdate } from "@/lib/strapi";

/**
 * Calculator: attaches the visitor's answers and estimate to the lead created at the contact step.
 * Only calculator fields can change; contact details can't be edited through this route.
 */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
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
