import "server-only";

import type { LeadInput } from "@/lib/lead-schema";

/**
 * Emails SunRyse when a new lead comes in, through Resend's HTTP API (no SDK).
 * Off until these are set (website env): RESEND_API_KEY, LEAD_NOTIFY_TO (comma-separated addresses) and
 * LEAD_NOTIFY_FROM (a sender on a domain verified in Resend, e.g. "SunRyse Website <leads@example.com>").
 * Never throws: a failed email must not lose or delay the lead, which is already saved in Strapi.
 */

type Lead = Omit<LeadInput, "consent" | "email"> & { email?: string };

const LABELS: [keyof Lead, string][] = [
  ["name", "Name"],
  ["phone", "Mobile"],
  ["email", "Email"],
  ["city", "City"],
  ["address", "Address"],
  ["segment", "Property"],
  ["monthlyBill", "Monthly bill (₱)"],
  ["packageName", "Package"],
  ["addOns", "Add-ons"],
  ["preferredPayment", "Payment"],
  ["roofType", "Roof"],
  ["message", "Message"],
  ["source", "Source"],
  ["stage", "Stage"],
];

/** Subject and plain-text body for one lead (pure, so it can be tested). */
export function leadEmail(lead: Lead, adminUrl?: string) {
  const lines = LABELS.flatMap(([key, label]) => {
    const v = lead[key];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return [];
    return [`${label}: ${Array.isArray(v) ? v.join(", ") : String(v)}`];
  });
  const where = lead.packageName ? ` · ${lead.packageName}` : lead.source === "calculator" ? " · calculator" : "";
  return {
    subject: `New lead: ${lead.name}${where}`,
    text: [...lines, ...(adminUrl ? ["", `Open in the CMS: ${adminUrl}`] : [])].join("\n"),
  };
}

export async function notifyNewLead(lead: Lead, id: string | null) {
  const key = process.env.RESEND_API_KEY;
  const to = (process.env.LEAD_NOTIFY_TO ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const from = process.env.LEAD_NOTIFY_FROM;
  if (!key || !to.length || !from) return;
  const cms = process.env.STRAPI_URL;
  const adminUrl = cms && id ? `${cms}/admin/content-manager/collection-types/api::lead.lead/${id}` : undefined;
  const { subject, text } = leadEmail(lead, adminUrl);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`Lead email failed: HTTP ${res.status}`);
  } catch (e) {
    console.error("Lead email failed:", e instanceof Error ? e.message : e);
  }
}
