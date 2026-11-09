import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow, Hud, RichText } from "@/components/fx";
import { QuoteCta } from "@/components/sections/home/quote-cta";
import { ServicesSection } from "@/components/sections/home/services";
import { getHome, getServices, getSite } from "@/lib/content";
import { t } from "@/lib/content/ui";

export const metadata: Metadata = {
  title: "Solar services",
  description:
    "Every SunRyse solar service in one place: system design, panel installation, hybrid and battery systems, electrical works, maintenance and specialty solar.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const [home, services, site] = await Promise.all([getHome(), getServices(), getSite()]);
  const counts = {
    systems: services.filter((s) => s.category === "systems").length,
    installation: services.filter((s) => s.category === "installation").length,
    specialty: services.filter((s) => s.category === "specialty").length,
  };

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-sky-200),var(--color-day-100)_45%,var(--color-day-50))] pt-[calc(var(--site-top)+40px)] pb-14">
        <div aria-hidden className="fx-grid absolute inset-0 -z-10 [mask-image:radial-gradient(90%_75%_at_50%_20%,black,transparent_80%)]" />
        <div className="container-site flex flex-col gap-5">
          <nav aria-label={t(site.ui, "breadcrumb")} className="font-label text-xs tracking-[0.12em] text-ink-muted uppercase">
            <Link href="/" className="inline-flex min-h-11 items-center hover:text-sun-700">{t(site.ui, "home")}</Link>
            <span className="px-2" aria-hidden>/</span>
            <span className="text-sun-700" aria-current="page">{t(site.ui, "services")}</span>
          </nav>
          <Eyebrow>{home.services.eyebrow}</Eyebrow>
          <h1 className="max-w-[900px] font-display text-[clamp(40px,5.6vw,76px)] leading-none font-bold tracking-[-0.045em] text-balance">
            <RichText text={home.services.heading} />
          </h1>
          <p className="max-w-[620px] text-lg leading-relaxed text-ink-muted">{home.services.lead}</p>
          <div className="flex flex-wrap gap-2">
            <Hud light>{counts.systems} {t(site.ui, "categorySystems").toLowerCase()}</Hud>
            <Hud light dot="amber">{counts.installation} {t(site.ui, "categoryInstallation").toLowerCase()}</Hud>
            <Hud light>{counts.specialty} {t(site.ui, "categorySpecialty").toLowerCase()}</Hud>
          </div>
        </div>
      </section>
      <ServicesSection content={home.services} services={services} ui={site.ui} showAll />
      <QuoteCta content={home.cta} site={site} />
    </>
  );
}
