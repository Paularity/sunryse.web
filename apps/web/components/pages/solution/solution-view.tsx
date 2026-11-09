import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SolutionSubnav } from "./subnav";
import { Icon, TONE, TONE_TEXT } from "@/components/icons";
import { Eyebrow, Hud, RichText, Section, SectionHeader, Stars, PhotoFrame, h2Class } from "@/components/fx";
import { Reveal } from "@/components/motion/reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { SolutionDetails } from "@/lib/content/pages/solution";
import type { Faq, IconName, Solution, Testimonial, Tone } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const ANCHOR = "scroll-mt-[calc(var(--site-top)+56px)]";
const BENEFIT_ICONS: { icon: IconName; tone: Tone }[] = [
  { icon: "trending-down", tone: "leaf" },
  { icon: "battery", tone: "sky" },
  { icon: "file-text", tone: "amber" },
  { icon: "solar-panel", tone: "navy" },
  { icon: "activity", tone: "sky" },
  { icon: "headset", tone: "sun" },
];

type Props = { solution: Solution; details: SolutionDetails; faqs: Faq[]; testimonials: Testimonial[] };

export function SolutionView({ solution, details, faqs, testimonials }: Props) {
  const stripNum = (s: string) => s.replace(/^\[[^\]]*\]\s*/, "");
  const subnav = [
    { id: "systems", label: stripNum(details.systems.eyebrow).replace(/^Choose your /, "") },
    { id: "how", label: "How it works" },
    { id: "packages", label: "Packages" },
    { id: "details", label: stripNum(details.details.eyebrow) },
    { id: "benefits", label: "Benefits" },
    { id: "faq", label: "FAQ" },
    { id: "reviews", label: "Reviews" },
  ];
  subnav[0].label = subnav[0].label.charAt(0).toUpperCase() + subnav[0].label.slice(1);

  return (
    <>
      <Hero solution={solution} details={details} />
      <SolutionSubnav items={subnav} cta={{ label: "Calculate savings", href: "/calculator" }} />
      <Systems details={details} />
      <HowItWorks details={details} />
      <Packages details={details} />
      <Details details={details} />
      <Benefits solution={solution} details={details} />
      <FaqBlock details={details} faqs={faqs} />
      <Reviews details={details} testimonials={testimonials} />
      <CtaBand details={details} />
    </>
  );
}

/* ───────────────────────────── Hero ───────────────────────────── */
function Hero({ solution, details }: Pick<Props, "solution" | "details">) {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-sky-200)_0%,var(--color-day-100)_45%,var(--color-dawn-50)_100%)] pb-[clamp(48px,7vw,80px)] pt-[calc(var(--site-top)+24px)]">
      <div
        aria-hidden
        className="fx-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[900px] [mask-image:radial-gradient(90%_75%_at_50%_20%,black,transparent_80%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-44 -z-10 size-[620px] rounded-full bg-[radial-gradient(circle,rgb(255_201_60/0.55),transparent_65%)]"
      />
      <div className="container-site grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-5">
          <nav aria-label="Breadcrumb" className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            <ol className="flex flex-wrap items-center gap-x-1.5">
              <li>
                <Link href="/" className="inline-flex min-h-11 items-center hover:text-sun-700 focus-visible:underline">Home</Link>
              </li>
              <li aria-hidden>/</li>
              <li>Solutions</li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-sun-700">{solution.title}</li>
            </ol>
          </nav>
          <h1 className="font-display text-[clamp(2.75rem,5.2vw,4.6rem)] font-bold leading-[0.98] tracking-[-0.045em] text-balance">
            <RichText text={details.heading} />
          </h1>
          <p className="max-w-[540px] text-[clamp(1rem,1.4vw,1.1875rem)] leading-relaxed text-navy-900/80">{solution.summary}</p>
          <div className="flex flex-wrap gap-2.5">
            <Button asChild variant="navy" size="xl">
              <Link href={details.primaryCta.href}>{details.primaryCta.label} →</Link>
            </Button>
            <Button asChild variant="line" size="xl">
              <Link href={details.secondaryCta.href}>{details.secondaryCta.label}</Link>
            </Button>
          </div>
          <dl className="mt-1.5 grid max-w-[560px] grid-cols-2 gap-2.5 sm:grid-cols-3">
            {details.stats.map((s, i) => (
              <div key={s.label} className={cn("glass rounded-2xl p-3.5", i === 2 && "col-span-2 sm:col-span-1")}>
                <dt className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{s.label}</dt>
                <dd className={cn("font-display text-[22px] font-bold", TONE_TEXT[s.tone])}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <PhotoFrame
          className="h-[320px] sm:h-[420px] lg:h-[520px]"
          chips={<Hud>System online</Hud>}
          caption={<span className="glass rounded-[10px] px-3 py-2 font-label text-[11px] uppercase tracking-[0.12em]">{solution.caption}</span>}
        >
          <Image
            src={solution.image.src}
            alt={solution.image.alt}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </PhotoFrame>
      </div>
    </section>
  );
}

/* ───────────────────────────── 01 Systems ───────────────────────────── */
function Systems({ details }: { details: SolutionDetails }) {
  const { systems } = details;
  return (
    <Section id="systems" tone="white" className={ANCHOR}>
      <SectionHeader eyebrow={systems.eyebrow} heading={systems.heading} />
      <Reveal className="grid gap-4 md:grid-cols-2">
        {systems.cards.map((c) => (
          <article
            key={c.title}
            data-reveal
            className={cn("glass-card flex min-w-0 flex-col gap-4 rounded-3xl p-6 sm:p-8", c.featured && "ring-2 ring-sun-500")}
          >
            <header className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-[28px] font-bold tracking-[-0.03em]">{c.title}</h3>
              <span
                className={cn(
                  "rounded-full px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.12em]",
                  c.featured ? "bg-dawn-50 text-sun-700" : "bg-day-100 text-sky-600",
                )}
              >
                {c.tag}
              </span>
            </header>
            <p className="leading-relaxed text-ink-muted">{c.description}</p>
            <ul className="flex flex-col gap-2.5">
              {c.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full bg-leaf-500 text-white">
                    <Icon name="check" className="size-3.5" strokeWidth={2.5} />
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <p className="mt-auto border-t border-line pt-3.5 font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              Best for: {c.best}
            </p>
          </article>
        ))}
      </Reveal>
    </Section>
  );
}

/* ───────────────────────────── 02 How it works ───────────────────────────── */
function NodeArt({ kind }: { kind: "sun" | "panel" | "inverter" }) {
  if (kind === "sun") {
    return <span aria-hidden className="mx-auto block size-14 rounded-full bg-[radial-gradient(circle,var(--color-sun-300),var(--color-sun-500))] shadow-[0_0_30px_rgb(255_138_0/0.5)]" />;
  }
  if (kind === "panel") {
    return (
      <span
        aria-hidden
        className="mx-auto block h-11 w-16 rounded-md bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.5)_0_1px,transparent_1px_25%),linear-gradient(160deg,var(--color-sky-500),var(--color-navy-700))]"
      />
    );
  }
  return (
    <span aria-hidden className="mx-auto grid size-14 place-items-center rounded-2xl bg-navy-900 font-label text-[11px] text-sun-300">
      INV
    </span>
  );
}

function FlowArrow() {
  return <ArrowRight aria-hidden className="mx-auto size-7 shrink-0 rotate-90 text-sun-500 lg:rotate-0" strokeWidth={1.75} />;
}

function HowItWorks({ details }: { details: SolutionDetails }) {
  const { how } = details;
  return (
    <Section id="how" tone="tint" className={ANCHOR}>
      <SectionHeader eyebrow={how.eyebrow} heading={how.heading} />
      <ol className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
        {how.nodes.map((n) => (
          <li key={n.title} className="contents">
            <div className={cn("glass-card flex min-w-0 flex-1 flex-col gap-3 rounded-[20px] p-5 text-center", n.kind === "inverter" && "ring-2 ring-sun-500")}>
              <NodeArt kind={n.kind} />
              <span className="font-display font-bold">{n.title}</span>
              <span className="text-[13px] text-ink-muted">{n.note}</span>
            </div>
            <FlowArrow />
          </li>
        ))}
        <li className="flex min-w-0 flex-[1.2] flex-col gap-2.5">
          {how.outputs.map((o) => (
            <div key={o.title} className="glass-card flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5">
              <span className="font-display font-bold">{o.title}</span>
              <span className={cn("text-right font-label text-[11px] uppercase tracking-[0.12em]", TONE_TEXT[o.tone])}>{o.note}</span>
            </div>
          ))}
        </li>
      </ol>
    </Section>
  );
}

/* ───────────────────────────── 03 Packages ───────────────────────────── */
function Packages({ details }: { details: SolutionDetails }) {
  const p = details.packages;
  return (
    <Section id="packages" tone="white" className={ANCHOR}>
      <SectionHeader eyebrow={p.eyebrow} heading={p.heading} lead={p.lead} />
      <Reveal className="grid gap-4 lg:grid-cols-3">
        {p.items.map((it) => (
          <article
            key={it.tag}
            data-reveal
            className={cn(
              "glass-card flex min-w-0 flex-col gap-3.5 rounded-3xl p-7",
              it.featured && "bg-[linear-gradient(170deg,var(--color-dawn-50),white_55%)] ring-2 ring-sun-500",
            )}
          >
            <span className={cn("font-label text-[11px] uppercase tracking-[0.12em]", it.featured ? "text-sun-700" : "text-ink-muted")}>
              {it.featured ? "★ " : ""}{it.tag}
            </span>
            <p className="font-display text-[46px] font-bold leading-none tracking-[-0.04em]">
              {it.kwp}
              <span className="text-lg text-ink-muted"> kWp</span>
            </p>
            <p className="text-ink-muted">
              {p.billLabel} <b className="text-navy-900">{it.bill}</b>
              {p.billUnit}
            </p>
            <dl className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-day-50 p-3">
                <dt className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">Panels</dt>
                <dd className="font-display font-bold">{it.panels}</dd>
              </div>
              <div className="rounded-xl bg-day-50 p-3">
                <dt className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{p.priceLabel}</dt>
                <dd className="font-display font-bold">{it.price}</dd>
              </div>
            </dl>
            <Button asChild variant={it.featured ? "sun" : "line"} size="xl" className="mt-auto w-full">
              <Link href="/contact">{p.ctaLabel} →</Link>
            </Button>
          </article>
        ))}
      </Reveal>
    </Section>
  );
}

/* ───────────────────────────── 04 Details (net metering / ROI / O&M) ───────────────────────────── */
function Details({ details }: { details: SolutionDetails }) {
  const d = details.details;
  return (
    <Section id="details" tone="dawn" className={ANCHOR}>
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="flex min-w-0 flex-col gap-4">
          <Eyebrow>{d.eyebrow}</Eyebrow>
          <h2 className={h2Class}>
            <RichText text={d.heading} />
          </h2>
          <p className="max-w-[520px] text-[17px] leading-relaxed text-ink-muted">{d.lead}</p>
        </div>
        <ol className="flex min-w-0 flex-col gap-3">
          {d.steps.map((s, i) => (
            <li key={s.title} className="glass-card flex items-center gap-4 rounded-[18px] px-5 py-4">
              <span className="grid size-[46px] shrink-0 place-items-center rounded-full bg-navy-900 font-label text-xs text-sun-300">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block font-display font-bold">{s.title}</span>
                <span className="text-sm text-ink-muted">{s.description}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ───────────────────────────── 05 Benefits ───────────────────────────── */
function Benefits({ solution, details }: Pick<Props, "solution" | "details">) {
  return (
    <Section id="benefits" tone="light" className={ANCHOR}>
      <SectionHeader eyebrow={details.benefits.eyebrow} heading={details.benefits.heading} />
      <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {solution.features.map((f, i) => {
          const b = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
          return (
            <div key={f} data-reveal className="glass-card flex items-center gap-4 rounded-[20px] p-5">
              <span className="glow-tile size-12 rounded-[14px]" style={{ "--c": TONE[b.tone] } as React.CSSProperties}>
                <Icon name={b.icon} className="size-5" />
              </span>
              <span className="font-display text-[17px] font-bold leading-snug">{f}</span>
            </div>
          );
        })}
      </Reveal>
    </Section>
  );
}

/* ───────────────────────────── 06 FAQ ───────────────────────────── */
function FaqBlock({ details, faqs }: { details: SolutionDetails; faqs: Faq[] }) {
  return (
    <Section id="faq" tone="white" className={ANCHOR}>
      <div className="grid items-start gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-14">
        <div className="flex flex-col gap-4">
          <Eyebrow>{details.faq.eyebrow}</Eyebrow>
          <h2 className={h2Class}>
            <RichText text={details.faq.heading} />
          </h2>
        </div>
        <Accordion type="single" collapsible className="glass-card rounded-[22px] px-5 py-1 sm:px-6">
          {faqs.map((q, i) => (
            <AccordionItem key={q.question} value={`q${i}`} className="border-line">
              <AccordionTrigger className="min-h-11 items-center gap-3 py-5 font-display text-[17px] font-bold">{q.question}</AccordionTrigger>
              <AccordionContent className="pb-5 text-[15px] leading-relaxed text-ink-muted">{q.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

/* ───────────────────────────── 07 Reviews ───────────────────────────── */
function Reviews({ details, testimonials }: { details: SolutionDetails; testimonials: Testimonial[] }) {
  const list = testimonials.slice(0, 3);
  if (!list.length) return null;
  return (
    <Section id="reviews" tone="tint" className={ANCHOR}>
      <SectionHeader eyebrow={details.reviews.eyebrow} heading={details.reviews.heading} />
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {list.map((t, i) => (
          <li key={`${i}-${t.name}`} className="glass-card flex w-[86%] shrink-0 snap-start flex-col gap-4 rounded-3xl p-6 md:w-auto">
            <Stars rating={t.rating} />
            <blockquote className="leading-relaxed text-navy-900/85">“{t.quote}”</blockquote>
            <footer className="mt-auto flex items-center gap-3">
              <span className="glow-tile size-11 rounded-full font-display font-bold" style={{ "--c": TONE[t.tone] } as React.CSSProperties}>
                {t.initial}
              </span>
              <span>
                <span className="block font-display font-bold">{t.name}</span>
                <span className="text-[13px] text-ink-muted">{t.roleLocation}</span>
              </span>
            </footer>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ───────────────────────────── CTA ───────────────────────────── */
function CtaBand({ details }: { details: SolutionDetails }) {
  return (
    <section className="fx-dark">
      <div className="container-site flex flex-wrap items-center justify-between gap-6 py-16">
        <h2 className="max-w-[640px] font-display text-[clamp(30px,4vw,52px)] font-extrabold leading-none tracking-[-0.045em] text-balance">
          {details.cta.heading}
        </h2>
        <Button asChild variant="sun" size="xl" className="fx-sheen h-14 px-7 text-[13px]">
          <Link href="/contact">{details.cta.label} »</Link>
        </Button>
      </div>
    </section>
  );
}
