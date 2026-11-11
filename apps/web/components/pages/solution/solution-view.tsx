import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { SolutionSubnav } from "./subnav";
import { Icon } from "@/components/icons";
import { Hud } from "@/components/fx";
import { PackageCard } from "@/components/pricing/pricing-cards";
import { CARD_GRID } from "@/components/pricing/pricing-sections";
import { RooftopWorld } from "@/components/three-d/models";
import { HeroSceneFrame } from "@/components/three-d/scenes";
import { SolutionModel } from "@/components/three-d/solution-model";
import type { PricingPage } from "@/lib/content/pages/pricing";
import type { SolutionDetails } from "@/lib/content/pages/solution";
import type { Package, Solution, UiLabels } from "@/lib/content/types";
import { pickPackages } from "@/lib/pricing";
import { t } from "@/lib/content/ui";
import { cn } from "@/lib/utils";

/* Board constants (docs/designs/Solution.dc.html) */
const SECTION = "py-[clamp(64px,8vw,100px)]";
const SPLIT = "grid grid-cols-[1.05fr_.95fr] items-center gap-[56px] max-[1000px]:grid-cols-1 [&>*]:min-w-0";
const MONO = "font-label uppercase tracking-[0.12em]";
const EYEBROW = `${MONO} inline-flex items-center gap-[10px] text-[11px] text-sun-700 before:size-[7px] before:shrink-0 before:animate-[fx-ping_2.4s_ease-out_infinite] before:rounded-full before:bg-current before:content-['']`;
const H2 = "font-display font-bold text-[clamp(32px,4vw,56px)] leading-[1.02] tracking-[-0.04em]";
const CARD = "glass-card";
const HL_BLUE =
  "mx-[2px] inline-block rounded-[14px] px-[12px] pb-[4px] shadow-[0_0_0_2px_var(--color-sky-500),0_14px_34px_-14px_rgb(30_111_232/0.75)] bg-[linear-gradient(180deg,rgb(255_255_255/0.75),rgb(234_242_255/0.75))]";
const HL_SUN =
  "mx-[2px] inline-block rounded-[18px] bg-white/55 px-[16px] pb-[6px] shadow-[0_0_0_2px_var(--color-sun-500),0_16px_40px_-14px_rgb(255_138_0/0.85)]";
const TONE_COLOR: Record<string, string> = {
  leaf: "text-leaf-600",
  sky: "text-sky-600",
  amber: "text-sun-700",
  sun: "text-sun-700",
};

/** `*word*` → glowing frame, `~word~` → sun gradient text. */
function Rich({ text, hl, depth = 0 }: { text: string; hl: string; depth?: number }): ReactNode {
  const out: ReactNode[] = [];
  const re = /([*~])(.+?)\1/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const inner = depth < 1 ? <Rich text={m[2]} hl={hl} depth={depth + 1} /> : m[2];
    out.push(
      <span key={`${depth}-${m.index}`} className={m[1] === "*" ? hl : "text-sun"}>
        {inner}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

type Props = {
  solution: Solution;
  details: SolutionDetails;
  ui: UiLabels;
  /** Catalogue packages for this segment and the pricing copy for their cards. */
  packages: Package[];
  pricingCopy: PricingPage["packages"];
};

export function SolutionView({ solution, details, ui, packages, pricingCopy }: Props) {
  const stripNum = (s: string) => s.replace(/^\[[^\]]*\]\s*/, "");
  const subnav = [
    { id: "systems", label: t(ui, "subnavSystems") },
    { id: "how", label: t(ui, "subnavHow") },
    { id: "packages", label: t(ui, "subnavPackages") },
    { id: "net-metering", label: stripNum(details.details.eyebrow) },
    { id: "faq", label: t(ui, "subnavFaq") },
  ];

  return (
    <>
      <Hero solution={solution} details={details} ui={ui} />
      <SolutionSubnav items={subnav} cta={{ label: t(ui, "calculateSavings"), href: "/calculator" }} ui={ui} />
      <Systems details={details} ui={ui} />
      <HowItWorks details={details} ui={ui} />
      <Packages details={details} packages={packages} copy={pricingCopy} />
      <NetMetering details={details} />
      <ProjectsFaq details={details} />
      <CtaBand details={details} />
    </>
  );
}

/* ───────────────────────────── Hero ───────────────────────────── */
function Hero({ solution, details, ui }: Pick<Props, "solution" | "details" | "ui">) {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-sky-200)_0%,var(--color-day-100)_45%,var(--color-dawn-50)_100%)] pt-[var(--site-top)] pb-[80px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[900px] fx-grid [mask-image:radial-gradient(90%_75%_at_50%_20%,black,transparent_80%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[180px] -right-[160px] -z-10 size-[620px] rounded-full bg-[radial-gradient(circle,rgb(255_201_60/0.55),transparent_65%)]"
      />
      <div className={cn("relative container-site", SPLIT)}>
        <div className="flex flex-col gap-[22px]">
          <span className={`${MONO} text-[11px] text-ink-muted`}>
            {t(ui, "home")} / {t(ui, "solutions")} / <span className="text-sun-700">{solution.title}</span>
          </span>
          <h1 className="m-0 font-display text-[clamp(44px,5.6vw,84px)] leading-[0.98] font-bold tracking-[-0.045em]">
            <Rich text={details.heading} hl={HL_SUN} />
          </h1>
          <p className="m-0 max-w-[540px] text-[19px] leading-[1.6] text-navy-900/85">{details.lead}</p>
          <div className="flex flex-wrap gap-[10px]">
            <Link
              href={details.primaryCta.href}
              className={`${MONO} rounded-[14px] bg-navy-900 px-[22px] py-[17px] text-[12px] text-white`}
            >
              {details.primaryCta.label} →
            </Link>
            <Link
              href={details.secondaryCta.href}
              className={`${MONO} rounded-[14px] border border-navy-900/15 bg-white px-[22px] py-[17px] text-[12px] text-navy-900`}
            >
              {details.secondaryCta.label}
            </Link>
          </div>
          <div className="mt-[6px] grid max-w-[560px] grid-cols-3 gap-[10px] max-[640px]:grid-cols-2 max-[640px]:[&>div:last-child]:col-[1/-1]">
            {details.stats.map((s) => (
              <div key={s.label} className="min-w-0 rounded-[16px] p-[14px] glass">
                <span className={`${MONO} block text-[11px] text-ink-muted`}>{s.label}</span>
                <span className={cn("font-display text-[22px] font-bold", TONE_COLOR[s.tone])}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <HeroSceneFrame
          className="h-[520px] max-[1000px]:h-[400px] max-[640px]:h-[330px]"
          label={t(ui, "solutionSceneAria", { title: solution.title.toLowerCase() })}
          world={solution.slug === "residential" ? <RooftopWorld /> : <SolutionModel slug={solution.slug} />}
          chips={<Hud>{t(ui, "systemOnline")}</Hud>}
          photo={{ src: solution.image.src, alt: solution.image.alt, caption: solution.caption }}
        />
      </div>
    </section>
  );
}

/* ───────────────────────────── 01 Systems ───────────────────────────── */
function Systems({ details, ui }: { details: SolutionDetails; ui: UiLabels }) {
  const { systems } = details;
  return (
    <section id="systems" className={cn(SECTION, "scroll-mt-[calc(var(--site-top)+56px)] bg-white")}>
      <div className="container-site">
        <span className={EYEBROW}>{systems.eyebrow}</span>
        <h2 className={cn(H2, "mt-[16px] mb-[40px]")}>
          <Rich text={systems.heading} hl={HL_BLUE} />
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[18px]">
          {systems.cards.map((c) => (
            <div
              key={c.title}
              className={cn(
                CARD,
                "flex min-w-0 flex-col gap-[16px] rounded-[24px] p-[30px]",
                c.featured && "border-sun-500!",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[28px] font-bold">{c.title}</span>
                <span
                  className={cn(
                    MONO,
                    "rounded-full px-[11px] py-[7px] text-[11px]",
                    c.featured ? "bg-dawn-50 text-sun-700" : "bg-day-100 text-sky-600",
                  )}
                >
                  {c.tag}
                </span>
              </div>
              <p className="m-0 leading-[1.6] text-ink-muted">{c.description}</p>
              <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-[10px]">
                    <span className="grid size-[22px] flex-none place-items-center rounded-full bg-leaf-500 text-white">
                      <Icon name="check" className="size-3" strokeWidth={2.5} />
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <span className={`${MONO} mt-auto border-t border-navy-900/10 pt-[14px] text-[11px] text-ink-muted`}>
                {t(ui, "bestFor", { value: c.best })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── 02 How it works ───────────────────────────── */
function NodeArt({ kind, ui }: { kind: "sun" | "panel" | "inverter"; ui: UiLabels }) {
  if (kind === "sun") {
    return (
      <span
        aria-hidden
        className="mx-auto mb-[12px] block size-[56px] rounded-full bg-[radial-gradient(circle,var(--color-sun-300),var(--color-sun-500))]"
      />
    );
  }
  if (kind === "panel") {
    return (
      <span
        aria-hidden
        className="mx-auto mb-[18px] block h-[44px] w-[64px] rounded-[6px] bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.5)_0_1px,transparent_1px_25%),linear-gradient(160deg,var(--color-sky-500),var(--color-navy-700))]"
      />
    );
  }
  return (
    <span
      className={`${MONO} mx-auto mb-[12px] grid size-[56px] place-items-center rounded-[14px] bg-navy-900 text-[11px] text-sun-300`}
    >
      {t(ui, "inverterAbbr")}
    </span>
  );
}

function Arrow() {
  return (
    <span aria-hidden className="text-[26px] text-sun-500 max-[1000px]:rotate-90 max-[1000px]:self-center">
      →
    </span>
  );
}

function HowItWorks({ details, ui }: { details: SolutionDetails; ui: UiLabels }) {
  const { how } = details;
  return (
    <section id="how" className={cn(SECTION, "scroll-mt-[calc(var(--site-top)+56px)] bg-day-100")}>
      <div className="container-site">
        <span className={EYEBROW}>{how.eyebrow}</span>
        <h2 className={cn(H2, "mt-[16px] mb-[44px]")}>{how.heading}</h2>
        <div className="flex items-center gap-[10px] max-[1000px]:flex-col max-[1000px]:items-stretch">
          {how.nodes.map((n) => (
            <FlowNode key={n.title} n={n} ui={ui} />
          ))}
          <div className="flex min-w-0 flex-[1.2] flex-col gap-[10px]">
            {how.outputs.map((o) => (
              <div key={o.title} className={cn(CARD, "flex justify-between rounded-[16px] px-[16px] py-[14px]")}>
                <span className="font-display font-bold">{o.title}</span>
                <span className={cn(MONO, "text-[11px]", TONE_COLOR[o.tone])}>{o.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowNode({ n, ui }: { n: SolutionDetails["how"]["nodes"][number]; ui: UiLabels }) {
  return (
    <>
      <div
        className={cn(
          CARD,
          "min-w-0 flex-1 rounded-[20px] p-[22px] text-center",
          n.kind === "inverter" && "border-sun-500!",
        )}
      >
        <NodeArt kind={n.kind} ui={ui} />
        <span className="font-display font-bold">{n.title}</span>
        <span className="mt-[4px] block text-[13px] text-ink-muted">{n.note}</span>
      </div>
      <Arrow />
    </>
  );
}

/* ───────────────────────────── 03 Packages ───────────────────────────── */
function Packages({
  details,
  packages,
  copy,
}: {
  details: SolutionDetails;
  packages: Package[];
  copy: PricingPage["packages"];
}) {
  const p = details.packages;
  // Packages from the catalogue (Strapi → Package) when this segment has any; the old per-page cards otherwise.
  const catalogue = pickPackages(packages, 3);
  if (catalogue.length) {
    return (
      <section id="packages" className={cn(SECTION, "scroll-mt-[calc(var(--site-top)+56px)] bg-white")}>
        <div className="container-site">
          <div className="mb-[40px] flex flex-wrap items-end justify-between gap-[24px]">
            <div>
              <span className={EYEBROW}>{p.eyebrow}</span>
              <h2 className={cn(H2, "mt-[16px] mb-0")}>{p.heading}</h2>
            </div>
            <div className="flex max-w-[380px] flex-col items-start gap-4">
              <p className="m-0 leading-[1.6] text-ink-muted">{p.lead}</p>
              <Link
                href="/pricing"
                className={cn(MONO, "inline-flex min-h-11 items-center text-[12px] text-sky-600 hover:text-sun-700")}
              >
                {copy.seeAllLabel} →
              </Link>
            </div>
          </div>
          <div className={CARD_GRID}>
            {catalogue.map((pkg) => (
              <PackageCard key={pkg.slug} pkg={pkg} copy={copy} />
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="packages" className={cn(SECTION, "scroll-mt-[calc(var(--site-top)+56px)] bg-white")}>
      <div className="container-site">
        <div className="mb-[40px] flex flex-wrap items-end justify-between gap-[24px]">
          <div>
            <span className={EYEBROW}>{p.eyebrow}</span>
            <h2 className={cn(H2, "mt-[16px] mb-0")}>{p.heading}</h2>
          </div>
          <p className="m-0 max-w-[380px] leading-[1.6] text-ink-muted">{p.lead}</p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[18px]">
          {p.items.map((it) => (
            <div
              key={it.tag}
              className={cn(
                CARD,
                "flex min-w-0 flex-col gap-[14px] rounded-[24px] p-[28px]",
                it.featured && "border-sun-500! bg-[linear-gradient(170deg,var(--color-dawn-50),white_55%)]!",
              )}
            >
              <span className={cn(MONO, "text-[11px]", it.featured ? "text-sun-700" : "text-ink-muted")}>
                {it.featured ? "★ " : ""}
                {it.tag}
              </span>
              <span className="font-display text-[46px] font-bold tracking-[-0.04em]">
                {it.kwp}
                <span className="text-[18px] text-ink-muted"> kWp</span>
              </span>
              <span className="text-ink-muted">
                {p.billLabel} <b className="text-navy-900">{it.bill}</b>
                {p.billUnit}
              </span>
              <div className="grid grid-cols-2 gap-[8px]">
                <div className="min-w-0 rounded-[12px] bg-day-50 p-[12px]">
                  <span className={`${MONO} block text-[11px] text-ink-muted`}>Panels</span>
                  <span className="font-display font-bold">{it.panels}</span>
                </div>
                <div className="min-w-0 rounded-[12px] bg-day-50 p-[12px]">
                  <span className={`${MONO} block text-[11px] text-ink-muted`}>{p.priceLabel}</span>
                  <span className="font-display font-bold">{it.price}</span>
                </div>
              </div>
              <Link
                href="/contact"
                className={cn(
                  MONO,
                  "mt-auto rounded-[14px] p-[15px] text-center text-[12px] text-navy-900",
                  it.featured
                    ? "bg-[linear-gradient(135deg,var(--color-sun-300),var(--color-sun-500)_50%,var(--color-sun-600))]"
                    : "bg-day-50",
                )}
              >
                {p.ctaLabel} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── 04 Net metering ───────────────────────────── */
function NetMetering({ details }: { details: SolutionDetails }) {
  const d = details.details;
  return (
    <section
      id="net-metering"
      className={cn(
        SECTION,
        "scroll-mt-[calc(var(--site-top)+56px)] bg-[linear-gradient(180deg,var(--color-dawn-50),var(--color-dawn-100))]",
      )}
    >
      <div className={cn("container-site", SPLIT)}>
        <div className="flex flex-col gap-[18px]">
          <span className={EYEBROW}>{d.eyebrow}</span>
          <h2 className={cn(H2, "m-0")}>{d.heading}</h2>
          <p className="m-0 text-[17px] leading-[1.65] text-ink-muted">{d.lead}</p>
        </div>
        <div className="flex flex-col gap-[12px]">
          {d.steps.map((s, i) => (
            <div key={s.title} className={cn(CARD, "flex items-center gap-[16px] rounded-[18px] px-[20px] py-[18px]")}>
              <span
                className={`${MONO} grid size-[46px] flex-none place-items-center rounded-full bg-navy-900 text-[12px] text-sun-300`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block font-display font-bold">{s.title}</span>
                <span className="text-[14px] text-ink-muted">{s.description}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── 05 Projects + FAQ ───────────────────────────── */
function ProjectsFaq({ details }: { details: SolutionDetails }) {
  const { projects, faq } = details;
  return (
    <section id="faq" className={cn(SECTION, "scroll-mt-[calc(var(--site-top)+56px)] bg-white")}>
      <div className="container-site">
        <span className={EYEBROW}>{projects.eyebrow}</span>
        <div className="mt-[28px] mb-[80px] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[16px]">
          {projects.items.map((pr) => (
            <figure key={pr.src} className="relative m-0 h-[300px] overflow-hidden rounded-[20px]">
              <Image src={pr.src} alt={pr.alt} fill sizes="(min-width: 1001px) 33vw, 100vw" className="object-cover" />
              <figcaption
                className={`${MONO} absolute inset-x-[12px] bottom-[12px] flex justify-between rounded-[10px] px-[12px] py-[10px] text-[11px] glass`}
              >
                <span>{pr.location}</span>
                <span className="text-sun-700">{pr.kwp}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className={cn(SPLIT, "items-start")}>
          <h2 className="m-0 font-display text-[clamp(32px,4vw,52px)] leading-[1.02] font-bold tracking-[-0.04em]">
            {faq.heading}
          </h2>
          <ul className={cn(CARD, "m-0 list-none rounded-[22px] px-[24px] py-[4px]")}>
            {faq.questions.map((q) => (
              <li
                key={q}
                className="flex min-h-[44px] items-center justify-between gap-[12px] border-b border-navy-900/10 py-[20px] text-left font-display text-[17px] font-bold"
              >
                {q}{" "}
                <span aria-hidden className="font-normal text-ink-muted">
                  +
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── CTA ───────────────────────────── */
function CtaBand({ details }: { details: SolutionDetails }) {
  return (
    <section className="bg-[linear-gradient(120deg,var(--color-sun-300),var(--color-sun-500)_45%,var(--color-sun-600))]">
      <div className="container-site flex flex-wrap items-center justify-between gap-[24px] py-[64px]">
        <h2 className="m-0 max-w-[640px] font-display text-[clamp(32px,4vw,56px)] leading-none font-extrabold tracking-[-0.045em]">
          {details.cta.heading}
        </h2>
        <Link
          href="/contact"
          className={`${MONO} rounded-[14px] bg-navy-900 px-[26px] py-[19px] text-[13px] text-white`}
        >
          {details.cta.label} »
        </Link>
      </div>
    </section>
  );
}
