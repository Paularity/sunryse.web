import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { RichText } from "@/components/fx";
import { ContactForm } from "@/components/pages/contact/contact-form";
import { ContactFromQuery } from "@/components/pages/contact/contact-loader";
import { QuickContact, SideContact } from "@/components/pages/contact/contact-panels";
import { getSite } from "@/lib/content";
import { getContactPage } from "@/lib/content/pages/contact";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getContactPage();
  return { title: meta.title, description: meta.description, alternates: { canonical: "/contact" } };
}

export default async function ContactPage() {
  const [page, site] = await Promise.all([getContactPage(), getSite()]);
  const formContent = {
    properties: page.properties,
    roofs: page.roofs,
    interests: page.interests,
    stepNames: page.stepNames,
    nextSteps: page.nextSteps,
    privacyNote: page.privacyNote,
    consentLabel: page.consentLabel,
    successBody: page.successBody,
  };

  return (
    <div className="relative isolate bg-[linear-gradient(180deg,var(--color-sky-200),var(--color-day-50)_35%,var(--color-dawn-50))] pt-[calc(var(--site-top)+2rem)] pb-16 lg:pb-24">
      <div
        aria-hidden
        className="fx-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[900px] [mask-image:radial-gradient(90%_75%_at_50%_20%,#000,transparent_80%)]"
      />
      <div className="container-site flex flex-col gap-7">
        <header className="flex max-w-[760px] flex-col gap-3.5">
          <nav aria-label="Breadcrumb" className="font-label text-xs uppercase tracking-[0.12em] text-ink-muted">
            <Link href="/" className="inline-flex min-h-11 items-center hover:text-navy-900">
              Home
            </Link>{" "}
            / <span aria-current="page" className="text-sun-700">{page.breadcrumb}</span>
          </nav>
          <h1 className="font-display text-[clamp(38px,5.2vw,76px)] leading-none font-bold tracking-[-0.045em] text-balance">
            <RichText text={page.heading} />
          </h1>
          <p className="m-0 text-lg leading-relaxed text-navy-900/80">{page.lead}</p>
        </header>

        <QuickContact phone={site.phone} messengerUrl={site.messengerUrl} divider={page.quickDivider} />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Suspense fallback={<ContactForm content={formContent} messengerUrl={site.messengerUrl} />}>
            <ContactFromQuery content={formContent} messengerUrl={site.messengerUrl} />
          </Suspense>
          <SideContact site={site} nextSteps={page.nextSteps} />
        </div>
      </div>
    </div>
  );
}
