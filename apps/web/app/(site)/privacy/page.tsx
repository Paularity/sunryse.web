import type { Metadata } from "next";

import { LegalPage } from "@/components/pages/legal/legal-page";
import legal from "@/content/pages/legal.json";
import { getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: legal.privacy.meta.title,
  description: legal.privacy.meta.description,
  alternates: { canonical: "/privacy" },
};

export default async function Page() {
  return <LegalPage doc={legal.privacy} site={await getSite()} />;
}
