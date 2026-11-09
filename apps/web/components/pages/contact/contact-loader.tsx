"use client";

import { useSearchParams } from "next/navigation";

import { ContactForm, type ContactFormProps } from "./contact-form";

const SEGMENTS = { residential: "residential", home: "residential", commercial: "commercial", business: "commercial", industrial: "industrial" } as const;

/** Reads ?bill=&segment=&type= on the client (keeps the page prerendered) and prefills the form. */
export function ContactFromQuery(props: Pick<ContactFormProps, "content" | "messengerUrl" | "ui">) {
  const sp = useSearchParams();
  const bill = Number(sp.get("bill"));
  const segment = SEGMENTS[(sp.get("segment") ?? "") as keyof typeof SEGMENTS];
  const type = sp.get("type") ?? undefined;
  const key = `${bill}|${segment}|${type}`;
  return (
    <ContactForm
      key={key}
      {...props}
      initialBill={Number.isFinite(bill) && bill > 0 ? Math.min(Math.round(bill), 10_000_000) : undefined}
      initialSegment={segment}
      initialSystem={type}
    />
  );
}
