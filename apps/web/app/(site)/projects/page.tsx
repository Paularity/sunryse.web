import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Eyebrow, Hud, PhotoFrame, RichText, Section, h2Class } from "@/components/fx";
import { ProjectBrowser } from "@/components/pages/projects/project-browser";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/lib/content";
import { getProjectsPage } from "@/lib/content/pages/projects";
import { cn } from "@/lib/utils";

const STAT_TEXT: Record<string, string> = { navy: "text-navy-900", leaf: "text-leaf-600", amber: "text-sun-700" };

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getProjectsPage();
  return { title: meta.title, description: meta.description };
}

export default async function ProjectsPage() {
  const [page, projects] = await Promise.all([getProjectsPage(), getProjects()]);
  const { hero, featured, grid, cta } = page;

  return (
    <>
      <section
        className="relative isolate bg-[linear-gradient(180deg,var(--color-day-100),var(--color-day-50))] pb-10"
        style={{ paddingTop: "calc(var(--site-top) + 24px)" }}
      >
        <div
          className="fx-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[900px] opacity-60 [mask-image:radial-gradient(90%_75%_at_50%_20%,#000,transparent_80%)]"
          aria-hidden
        />
        <div className="container-site flex flex-wrap items-end justify-between gap-8">
          <div className="flex flex-col gap-5">
            <nav aria-label="Breadcrumb" className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              <Link href="/" className="inline-flex min-h-11 items-center hover:text-sun-700">
                Home
              </Link>{" "}
              / <span aria-current="page" className="text-sun-700">Projects</span>
            </nav>
            <h1 className="font-display text-[clamp(44px,5.6vw,84px)] font-bold leading-[0.98] tracking-[-0.045em] text-balance">
              <RichText text={hero.heading} />
            </h1>
          </div>
          <dl className="flex flex-wrap gap-7">
            {hero.stats.map((s) => (
              <div key={s.label} className="flex flex-col border-l-2 border-sun-500 pl-3.5">
                <dd className="font-display order-2 text-4xl font-bold">{s.value}</dd>
                <dt className="font-label order-3 text-[11px] uppercase tracking-[0.12em] text-ink-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="pb-[clamp(40px,6vw,70px)] pt-5" aria-labelledby="featured-title">
        <div className="container-site">
          <div className="glass-card grid overflow-hidden rounded-[28px] lg:grid-cols-[1.3fr_1fr]">
            <PhotoFrame
              className="min-h-72 lg:min-h-[440px]"
              chips={
                <Hud light dot="amber" className="text-sun-700">
                  {featured.chip}
                </Hud>
              }
            >
              <Image src={featured.image.src} alt={featured.image.alt} fill priority sizes="(min-width:1024px) 720px, 100vw" className="object-cover" />
            </PhotoFrame>
            <div className="flex min-w-0 flex-col gap-4 p-5 sm:p-8 lg:p-10">
              <Eyebrow className="text-sky-600">{featured.meta}</Eyebrow>
              <h2 id="featured-title" className="font-display text-[clamp(28px,3vw,38px)] font-bold leading-[1.05] tracking-[-0.04em]">
                {featured.title}
              </h2>
              <p className="leading-relaxed text-ink-muted">{featured.summary}</p>
              <dl className="grid grid-cols-2 gap-2.5">
                {featured.stats.map((f) => (
                  <div key={f.label} className="rounded-[14px] bg-day-50 p-3.5">
                    <dt className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{f.label}</dt>
                    <dd className={cn("font-display text-[22px] font-bold", STAT_TEXT[f.tone] ?? "text-navy-900")}>{f.value}</dd>
                  </div>
                ))}
              </dl>
              <Button asChild variant="navy" size="xl" className="mt-auto self-start">
                <Link href={featured.cta.href}>{featured.cta.label} →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-[clamp(64px,9vw,100px)]" aria-label="All projects">
        <div className="container-site">
          <ProjectBrowser projects={projects} total={grid.total} allLabel={grid.allLabel} allNote={grid.allNote} />
        </div>
      </section>

      <Section tone="dark">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <h2 className={cn(h2Class, "max-w-[640px] text-white")}>
            <RichText text={cta.heading} />
          </h2>
          <Button asChild variant="sun" size="xl">
            <Link href={cta.href}>{cta.label} »</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
