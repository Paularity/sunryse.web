import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Eyebrow, Hud, RichText } from "@/components/fx";
import { Icon, TONE } from "@/components/icons";
import { getBrands, getSite } from "@/lib/content";
import { getAboutPage } from "@/lib/content/pages/about";
import type { Tone } from "@/lib/content/types";
import { t } from "@/lib/content/ui";
import { cn } from "@/lib/utils";

const TEAM_BG: Partial<Record<Tone, string>> = {
  sun: "bg-[linear-gradient(160deg,var(--color-dawn-100),var(--color-dawn-50))]",
  sky: "bg-[linear-gradient(160deg,var(--color-sky-200),var(--color-day-100))]",
  leaf: "bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-leaf-500)_30%,white),color-mix(in_srgb,var(--color-leaf-500)_8%,white))]",
  flame: "bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-glow-flame)_35%,white),color-mix(in_srgb,var(--color-glow-flame)_10%,white))]",
};

const MONO = "font-label uppercase tracking-[0.12em]";
const EB = "text-[11px]! leading-[normal]!";
const H2 = "font-display m-0 text-[clamp(32px,4vw,54px)] font-bold leading-[1.02] tracking-[-0.04em]";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getAboutPage();
  return { title: meta.title, description: meta.description };
}

export default async function AboutPage() {
  const [page, brands, { ui }] = await Promise.all([getAboutPage(), getBrands(), getSite()]);
  const { hero, story, mission, vision, values, timeline, credentials, cta, team } = page;

  return (
    <div className="[line-height:normal]">
      {/* HERO — board: header 84 + 44 spacer; the fixed header stack (--site-top) replaces it */}
      <section
        className="relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-sky-200),var(--color-day-100)_40%,var(--color-dawn-50)_80%,var(--color-dawn-100))] pb-[100px] text-center"
        style={{ paddingTop: "calc(var(--site-top) + 4px)" }}
      >
        <div
          className="fx-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[900px] opacity-60 [mask-image:radial-gradient(90%_75%_at_50%_20%,black,transparent_80%)]"
          aria-hidden
        />
        <div
          aria-hidden
          className="absolute bottom-[-260px] left-1/2 -z-10 -ml-[280px] size-[560px] rounded-full bg-[radial-gradient(circle_at_50%_40%,var(--color-dawn-50),var(--color-sun-300)_25%,var(--color-sun-500)_55%,var(--color-sun-600)_85%)] shadow-[0_0_140px_60px_rgb(255_178_26/0.5)]"
        />
        <div className="container-site relative flex flex-col items-center gap-[22px]">
          <nav aria-label={t(ui, "breadcrumb")} className={cn(MONO, "text-[11px] text-ink-muted")}>
            <Link href="/" className="hover:text-sun-700">
              {t(ui, "home")}
            </Link>{" "}
            / <span aria-current="page" className="text-sun-700">{t(ui, "breadcrumbAbout")}</span>
          </nav>
          <h1 className="font-display m-0 max-w-[1000px] text-[clamp(44px,6vw,92px)] font-bold leading-[0.98] tracking-[-0.045em]">
            <RichText text={hero.heading} />
          </h1>
          <p className="m-0 max-w-[640px] text-[19px] leading-[1.6] text-navy-700">{hero.lead}</p>
          <div aria-hidden className="h-[180px] max-[1000px]:h-[110px]" />
        </div>
      </section>

      {/* STORY */}
      <section className="bg-white py-[100px]">
        <div className="container-site grid grid-cols-2 items-center gap-14 max-[1000px]:grid-cols-1 [&>*]:min-w-0">
          <figure className="corners relative m-0 box-border h-[480px] p-2.5 max-[1000px]:h-[320px]">
            <div className="relative size-full overflow-hidden rounded-[18px]">
              <Image src={story.image.src} alt={story.image.alt} fill sizes="(min-width:1001px) 600px, 100vw" className="object-cover" />
            </div>
            <span className="fx-scan" style={{ inset: 10 }} aria-hidden />
            <Hud className="absolute left-[22px] top-[22px] z-[2]">{story.chip}</Hud>
          </figure>
          <div className="flex flex-col gap-[18px]">
            <Eyebrow className={EB}>{story.eyebrow}</Eyebrow>
            <h2 className={H2}>
              <RichText text={story.heading} />
            </h2>
            {story.paragraphs.map((para) => (
              <p key={para} className="m-0 text-[17px] leading-[1.7] text-ink-muted">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION / VISION / VALUES */}
      <section className="bg-day-100 py-[100px]">
        <div className="container-site">
          <div className="mb-[18px] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[18px]">
            <div className="rounded-3xl bg-[linear-gradient(140deg,var(--color-sun-300),var(--color-sun-500)_60%,var(--color-sun-600))] p-[34px] text-navy-900">
              <span className={cn(MONO, "text-[11px]")}>{mission.label}</span>
              <p className="font-display m-0 mt-3.5 text-[26px] font-bold leading-[1.25] tracking-[-0.02em]">{mission.text}</p>
            </div>
            <div className="rounded-3xl bg-navy-900 p-[34px] text-white">
              <span className={cn(MONO, "text-[11px] text-sun-300")}>{vision.label}</span>
              <p className="font-display m-0 mt-3.5 text-[26px] font-bold leading-[1.25] tracking-[-0.02em]">{vision.text}</p>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
            {values.map((v) => (
              <div key={v.title} className="glass-card flex flex-col gap-2.5 rounded-[20px] p-6">
                <span className="grid size-11 place-items-center rounded-full text-white" style={{ background: TONE[v.tone] }}>
                  <Icon name={v.icon} className="size-[22px]" />
                </span>
                <span className="font-display text-[19px] font-bold">{v.title}</span>
                <span className="text-sm leading-[1.55] text-ink-muted">{v.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-white py-[100px]">
        <div className="container-site">
          <Eyebrow className={EB}>{timeline.eyebrow}</Eyebrow>
          <h2 className={cn(H2, "mb-12 mt-4")}>
            <RichText text={timeline.heading} />
          </h2>
          <div className="relative grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div
              aria-hidden
              className="absolute inset-x-0 top-[9px] h-[3px] rounded-[3px] bg-[linear-gradient(90deg,var(--color-sun-300),var(--color-sun-500)_35%,var(--color-sky-500)_75%,var(--color-leaf-500))]"
            />
            {timeline.items.map((m) => (
              <div key={m.title} className="relative flex flex-col gap-2.5">
                <span aria-hidden className="box-border size-5 rounded-full border-4 bg-white" style={{ borderColor: TONE[m.tone] }} />
                <span className={cn(MONO, "text-xs text-sun-700")}>{m.year}</span>
                <span className="font-display text-[19px] font-bold">{m.title}</span>
                <span className="text-sm text-ink-muted">{m.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      {team?.members?.length ? (
        <section className="bg-day-50 py-[100px]" aria-labelledby="team-h">
          <div className="container-site">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
              <div>
                <Eyebrow className={EB}>{team.eyebrow}</Eyebrow>
                <h2 id="team-h" className={cn(H2, "mt-4")}>
                  <RichText text={team.heading} />
                </h2>
              </div>
              <p className="m-0 max-w-[380px] leading-[1.6] text-ink-muted">{team.lead}</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
              {team.members.map((m, i) => (
                <div key={`${i}-${m.role}`} className="glass-card overflow-hidden rounded-[22px]">
                  <div role="img" aria-label={team.photoLabel} className={cn("grid h-[240px] place-items-center", TEAM_BG[m.tone] ?? TEAM_BG.sun)}>
                    <span aria-hidden className="font-display text-[54px] font-bold text-navy-900/35">
                      {m.initial}
                    </span>
                  </div>
                  <div className="p-[18px]">
                    <span className="font-display block text-lg font-bold">{m.name}</span>
                    <span className={cn(MONO, "text-[11px] text-ink-muted")}>{m.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CREDENTIALS + BRANDS */}
      <section className="bg-white py-[90px]">
        <div className="container-site grid grid-cols-2 items-start gap-14 max-[1000px]:grid-cols-1 [&>*]:min-w-0">
          <div className="flex flex-col gap-4">
            <Eyebrow className={EB}>{credentials.eyebrow}</Eyebrow>
            {credentials.items.map((c) => (
              <div key={c.title} className="glass-card flex items-center gap-3.5 rounded-2xl px-[18px] py-4">
                <span className="grid size-10 flex-none place-items-center rounded-xl bg-day-100 text-sky-600">
                  <Icon name="check" className="size-[18px]" strokeWidth={2.5} />
                </span>
                <span>
                  <b className="font-display block">{c.title}</b>
                  <span className={cn(MONO, "text-[11px] text-ink-muted")}>{c.detail}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <Eyebrow className={EB}>{page.brands.eyebrow}</Eyebrow>
            <div className="grid grid-cols-3 gap-2.5">
              {brands.map((b) => (
                <span
                  key={b.name}
                  className="glass-card font-display grid h-20 place-items-center rounded-[14px] text-lg font-extrabold max-[640px]:h-16 max-[640px]:text-[15px]"
                >
                  {b.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-[linear-gradient(120deg,var(--color-sun-300),var(--color-sun-500)_45%,var(--color-sun-600))]">
        <div className="container-site flex flex-wrap items-center justify-between gap-6 py-[60px]">
          <h2 className="font-display m-0 max-w-[640px] text-[clamp(30px,4vw,52px)] font-extrabold leading-none tracking-[-0.045em]">
            <RichText text={cta.heading} />
          </h2>
          <Link href={cta.href} className={cn(MONO, "rounded-[14px] bg-navy-900 px-[26px] py-[19px] text-[13px] text-white")}>
            {cta.label} »
          </Link>
        </div>
      </section>
    </div>
  );
}
