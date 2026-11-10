import type { Metadata } from "next";

import { LegalPage } from "@/components/pages/legal/legal-page";
import legal from "@/content/pages/legal.json";
import { getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: legal.terms.meta.title,
  description: legal.terms.meta.description,
  alternates: { canonical: "/terms" },
};

export default async function Page() {
  return <LegalPage doc={legal.terms} site={await getSite()} />;
}
