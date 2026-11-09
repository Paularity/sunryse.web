import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Eyebrow, Hud, PhotoFrame, RichText, Section, h2Class } from "@/components/fx";
import { Icon, TONE } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getBrands } from "@/lib/content";
import { getAboutPage } from "@/lib/content/pages/about";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getAboutPage();
  return { title: meta.title, description: meta.description };
}

export default async function AboutPage() {
  const [page, brands] = await Promise.all([getAboutPage(), getBrands()]);
  const { hero, story, mission, vision, values, timeline, credentials, cta } = page;

  return (
    <>
      <section
        className="relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-sky-200),#D7EBFF_40%,#FFF3DC_80%,var(--color-dawn-100))] text-center"
        style={{ paddingTop: "calc(var(--site-top) + 24px)" }}
      >
        <div
          className="fx-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[900px] opacity-60 [mask-image:radial-gradient(90%_75%_at_50%_20%,#000,transparent_80%)]"
          aria-hidden
        />
        <div
          aria-hidden
          className="absolute bottom-[-200px] left-1/2 -z-10 size-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_40%,#FFFBEA,var(--color-sun-300)_30%,var(--color-sun-500)_70%,var(--color-sun-600))] shadow-[0_0_140px_60px_rgb(255_178_26/0.5)] sm:bottom-[-260px] sm:size-[560px]"
        />
        <div className="container-site relative flex flex-col items-center gap-5 pb-[clamp(220px,28vw,300px)]">
          <nav aria-label="Breadcrumb" className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            <Link href="/" className="inline-flex min-h-11 items-center hover:text-sun-700">
              Home
            </Link>{" "}
            / <span aria-current="page" className="text-sun-700">About</span>
          </nav>
          <h1 className="font-display max-w-[1000px] text-[clamp(44px,6vw,92px)] font-bold leading-[0.98] tracking-[-0.045em] text-balance">
            <RichText text={hero.heading} />
          </h1>
          <p className="max-w-[640px] text-[clamp(17px,1.6vw,19px)] leading-relaxed text-navy-700">{hero.lead}</p>
        </div>
      </section>

      <Section tone="white">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <PhotoFrame className="h-80 sm:h-[480px]" chips={<Hud>{story.chip}</Hud>}>
            <Image src={story.image.src} alt={story.image.alt} fill sizes="(min-width:1024px) 600px, 100vw" className="object-cover" />
          </PhotoFrame>
          <div className="flex flex-col gap-5">
            <Eyebrow>{story.eyebrow}</Eyebrow>
            <h2 className={h2Class}>
              <RichText text={story.heading} />
            </h2>
            {story.paragraphs.map((t) => (
              <p key={t} className="text-[17px] leading-[1.7] text-ink-muted">
                {t}
              </p>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="tint">
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-[linear-gradient(140deg,var(--color-sun-300),var(--color-sun-500)_60%,var(--color-sun-600))] p-7 text-navy-900 sm:p-9">
            <span className="font-label text-[11px] uppercase tracking-[0.12em]">{mission.label}</span>
            <p className="font-display mt-3.5 text-[clamp(21px,2.2vw,26px)] font-bold leading-tight tracking-[-0.02em]">{mission.text}</p>
          </div>
          <div className="rounded-3xl bg-navy-900 p-7 text-white sm:p-9">
            <span className="font-label text-[11px] uppercase tracking-[0.12em] text-sun-300">{vision.label}</span>
            <p className="font-display mt-3.5 text-[clamp(21px,2.2vw,26px)] font-bold leading-tight tracking-[-0.02em]">{vision.text}</p>
          </div>
        </div>
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <li key={v.title} className="glass-card flex flex-col gap-2.5 rounded-[20px] p-6">
              <span className="glow-tile size-11 rounded-full" style={{ "--c": TONE[v.tone] } as CSSProperties}>
                <Icon name={v.icon} className="size-5" />
              </span>
              <h3 className="font-display text-[19px] font-bold">{v.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{v.description}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="white">
        <div className="mb-12 flex flex-col gap-4">
          <Eyebrow>{timeline.eyebrow}</Eyebrow>
          <h2 className={h2Class}>
            <RichText text={timeline.heading} />
          </h2>
        </div>
        <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          <span
            aria-hidden
            className="absolute bottom-2 left-[9px] top-2 w-[3px] rounded bg-[linear-gradient(180deg,var(--color-sun-300),var(--color-sun-500)_35%,var(--color-sky-500)_75%,var(--color-leaf-500))] sm:hidden"
          />
          <span
            aria-hidden
            className="absolute inset-x-0 top-[9px] hidden h-[3px] rounded bg-[linear-gradient(90deg,var(--color-sun-300),var(--color-sun-500)_35%,var(--color-sky-500)_75%,var(--color-leaf-500))] lg:block"
          />
          {timeline.items.map((m) => (
            <li key={m.title} className="relative flex flex-col gap-2.5 pl-9 sm:pl-0 sm:pt-8">
              <span aria-hidden className="absolute left-0 top-0 size-5 rounded-full border-4 bg-white" style={{ borderColor: TONE[m.tone] }} />
              <span className="font-label text-xs uppercase tracking-[0.12em] text-sun-700">{m.year}</span>
              <h3 className="font-display text-[19px] font-bold">{m.title}</h3>
              <p className="text-sm text-ink-muted">{m.description}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="light">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Eyebrow>{credentials.eyebrow}</Eyebrow>
            {credentials.items.map((c) => (
              <div key={c.title} className="glass-card flex items-center gap-3.5 rounded-2xl px-[18px] py-4">
                <span className="grid size-10 flex-none place-items-center rounded-xl bg-day-100 text-sky-600">
                  <Icon name="check" />
                </span>
                <span>
                  <b className="font-display block">{c.title}</b>
                  <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{c.detail}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <Eyebrow>{page.brands.eyebrow}</Eyebrow>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {brands.map((b) => (
                <li key={b.name} className="glass-card grid h-20 place-items-center rounded-[14px] px-2 text-center">
                  <span className="font-display text-lg font-extrabold">{b.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

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
