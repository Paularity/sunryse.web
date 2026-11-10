import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { RichText } from "@/components/fx";
import { ProjectBrowser } from "@/components/pages/projects/project-browser";
import { getProjects, getSite } from "@/lib/content";
import { getProjectsPage } from "@/lib/content/pages/projects";
import { t } from "@/lib/content/ui";
import { cn } from "@/lib/utils";

const STAT_TEXT: Record<string, string> = { navy: "text-navy-900", leaf: "text-leaf-600", amber: "text-sun-700" };
const MONO = "font-label uppercase tracking-[0.12em]";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getProjectsPage();
  return { title: meta.title, description: meta.description };
}

export default async function ProjectsPage() {
  const [page, projects, { ui }] = await Promise.all([getProjectsPage(), getProjects(), getSite()]);
  const { hero, featured, grid, cta } = page;

  return (
    <div className="[line-height:normal]">
      {/* HERO — board: header 84 + 31 spacer; the layout's fixed header stack (--site-top) replaces it */}
      <section
        className="relative isolate bg-[linear-gradient(180deg,var(--color-day-100),var(--color-day-50))] pb-[31px]"
        style={{ paddingTop: "var(--site-top)" }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[900px] fx-grid [mask-image:radial-gradient(90%_75%_at_50%_20%,black,transparent_80%)] opacity-60"
          aria-hidden
        />
        <div className="container-site flex flex-wrap items-end justify-between gap-8">
          <div className="flex flex-col gap-[18px]">
            <nav aria-label={t(ui, "breadcrumb")} className={cn(MONO, "text-[11px] text-ink-muted")}>
              <Link href="/" className="hover:text-sun-700">
                {t(ui, "home")}
              </Link>{" "}
              /{" "}
              <span aria-current="page" className="text-sun-700">
                {t(ui, "breadcrumbProjects")}
              </span>
            </nav>
            <h1 className="m-0 font-display text-[clamp(44px,5.6vw,84px)] leading-[0.98] font-bold tracking-[-0.045em]">
              <RichText text={hero.heading} />
            </h1>
          </div>
          <dl className="m-0 flex flex-wrap gap-7">
            {hero.stats.map((s) => (
              <div key={s.label} className="border-l-2 border-sun-500 pl-3.5">
                <dd className="m-0 block font-display text-[36px] font-bold">{s.value}</dd>
                <dt className={cn(MONO, "text-[11px] text-ink-muted")}>{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FEATURED */}
      <section className="pt-5 pb-[70px]" aria-labelledby="featured-title">
        <div className="container-site">
          <div className="d3-tilt sr grid grid-cols-[1.3fr_1fr] overflow-hidden rounded-[28px] glass-card max-[1000px]:grid-cols-1">
            <div className="relative min-h-[440px] max-[1000px]:min-h-[280px]">
              <Image
                src={featured.image.src}
                alt={featured.image.alt}
                fill
                priority
                sizes="(min-width:1001px) 720px, 100vw"
                className="object-cover"
              />
              <span
                className={cn(
                  MONO,
                  "absolute top-[18px] left-[18px] inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] text-sun-700 glass",
                )}
              >
                <Star aria-hidden className="size-3 fill-current" strokeWidth={1.75} />
                {featured.chip}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-[18px] p-10 max-[640px]:p-[22px]">
              <span className={cn(MONO, "text-[11px] text-sky-600")}>{featured.meta}</span>
              <h2
                id="featured-title"
                className="m-0 font-display text-[38px] leading-[1.05] font-bold tracking-[-0.04em]"
              >
                {featured.title}
              </h2>
              <p className="m-0 leading-[1.65] text-ink-muted">{featured.summary}</p>
              <dl className="m-0 grid grid-cols-2 gap-2.5">
                {featured.stats.map((f) => (
                  <div key={f.label} className="rounded-[14px] bg-day-50 p-3.5">
                    <dt className={cn(MONO, "block text-[11px] text-ink-muted")}>{f.label}</dt>
                    <dd className={cn("m-0 font-display text-[22px] font-bold", STAT_TEXT[f.tone] ?? "text-navy-900")}>
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link
                href={featured.cta.href}
                className={cn(MONO, "mt-auto self-start rounded-[14px] bg-navy-900 px-[22px] py-4 text-xs text-white")}
              >
                {featured.cta.label} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER + GRID */}
      <section className="pb-[100px]" aria-label={t(ui, "allProjectsAria")}>
        <div className="container-site">
          <ProjectBrowser projects={projects} total={grid.total} cardStats={grid.cardStats} ui={ui} />
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-[linear-gradient(120deg,var(--color-sun-300),var(--color-sun-500)_45%,var(--color-sun-600))]">
        <div className="container-site flex flex-wrap items-center justify-between gap-6 py-[60px]">
          <h2 className="m-0 max-w-[640px] font-display text-[clamp(30px,4vw,52px)] leading-none font-extrabold tracking-[-0.045em]">
            <RichText text={cta.heading} />
          </h2>
          <Link
            href={cta.href}
            className={cn(MONO, "rounded-[14px] bg-navy-900 px-[26px] py-[19px] text-[13px] text-white")}
          >
            {cta.label} »
          </Link>
        </div>
      </section>
    </div>
  );
}
