import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { RichText } from "@/components/fx";
import { ContactForm } from "@/components/pages/contact/contact-form";
import { ContactFromQuery } from "@/components/pages/contact/contact-loader";
import { QuickContact, SideContact } from "@/components/pages/contact/contact-panels";
import { getSite } from "@/lib/content";
import { getContactPage } from "@/lib/content/pages/contact";
import { t } from "@/lib/content/ui";

/** Board h1: the last `*~word~*` becomes the boxed sun word with the board's own padding. */
function Heading({ text }: { text: string }) {
  const m = /^(.*?)\*~(.+?)~\*$/.exec(text);
  if (!m) return <RichText text={text} />;
  return (
    <>
      {m[1]}
      <span className="hl hl-sun inline-block rounded-[18px] bg-white/60 px-3.5 pb-1.5">
        <span className="text-sun">{m[2]}</span>
      </span>
    </>
  );
}

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
    <div className="relative isolate bg-[linear-gradient(180deg,var(--color-sky-200),var(--color-day-50)_35%,var(--color-dawn-50))] pt-[calc(var(--site-top)+4px)] pb-[72px] leading-[normal]">
      <div
        aria-hidden
        className="fx-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[900px] [mask-image:radial-gradient(90%_75%_at_50%_20%,black,transparent_80%)]"
      />
      <div className="container-site flex flex-col gap-7">
        <header className="flex max-w-[760px] flex-col gap-3.5">
          <nav aria-label={t(site.ui, "breadcrumb")} className="font-label text-[12px] uppercase tracking-[0.12em] text-ink-muted">
            <Link href="/" className="hover:text-navy-900">
              {t(site.ui, "home")}
            </Link>{" "}
            / <span aria-current="page" className="text-sun-700">{page.breadcrumb}</span>
          </nav>
          <h1 className="m-0 font-display text-[clamp(38px,5.2vw,76px)] leading-none font-bold tracking-[-0.045em]">
            <Heading text={page.heading} />
          </h1>
          <p className="m-0 text-[18px] leading-[1.6] text-navy-900/80">{page.lead}</p>
        </header>

        <QuickContact ui={site.ui} phone={site.phone} messengerUrl={site.messengerUrl} divider={page.quickDivider} />

        <div className="grid items-start gap-7 min-[1001px]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Suspense fallback={<ContactForm content={formContent} ui={site.ui} messengerUrl={site.messengerUrl} />}>
            <ContactFromQuery content={formContent} ui={site.ui} messengerUrl={site.messengerUrl} />
          </Suspense>
          <SideContact site={site} nextSteps={page.nextSteps} />
        </div>
      </div>
    </div>
  );
}
