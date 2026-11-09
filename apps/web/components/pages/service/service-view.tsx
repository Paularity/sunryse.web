import Image from "next/image";
import Link from "next/link";

import { Icon, TONE } from "@/components/icons";
import { Eyebrow, GoArrow, Hud, PhotoFrame, RichText, Section, SectionHeader, h2Class } from "@/components/fx";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { ServiceDetails } from "@/lib/content/pages/service";
import type { Brand, Service, ServiceCategory } from "@/lib/content/types";

const CATEGORY_LABEL: Record<ServiceCategory, string> = { systems: "Systems", installation: "Installation", specialty: "Specialty" };
const CATEGORY_CHIP: Record<ServiceCategory, string> = { systems: "bg-sky-500", installation: "bg-sun-700", specialty: "bg-leaf-600" };

const code = (s: Service) => `S/${String(s.order).padStart(2, "0")}`;
/** Re-number "[ 02 ] Title" eyebrows so numbering stays continuous when a section is hidden. */
const numbered = (n: number, eyebrow: string) => `[ ${String(n).padStart(2, "0")} ] ${eyebrow.replace(/^\[[^\]]*\]\s*/, "")}`;

type Props = { service: Service; details: ServiceDetails; brands: Brand[]; related: Service[] };

export function ServiceView({ service, details, brands, related }: Props) {
  const shownBrands = brands.filter((b) => details.brandCategories.includes(b.category));
  let n = 1;
  return (
    <>
      <Hero service={service} details={details} />
      <Benefits details={details} />
      <Included details={details} eyebrow={numbered(n++, details.included.eyebrow)} />
      <Process
        details={details}
        brands={shownBrands}
        brandsEyebrow={shownBrands.length ? numbered(n++, details.brandsEyebrow) : ""}
        stepsEyebrow={numbered(n++, details.stepsEyebrow)}
      />
      <Related items={related} />
      <CtaBand details={details} />
    </>
  );
}

/* ───────────────────────────── Hero ───────────────────────────── */
function Hero({ service, details }: Pick<Props, "service" | "details">) {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-day-100),var(--color-day-50))] pb-[clamp(48px,7vw,90px)] pt-[calc(var(--site-top)+24px)]">
      <div
        aria-hidden
        className="fx-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[900px] [mask-image:radial-gradient(90%_75%_at_50%_20%,black,transparent_80%)]"
      />
      <div className="container-site grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-5">
          <nav aria-label="Breadcrumb" className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            <ol className="flex flex-wrap items-center gap-x-1.5">
              <li>
                <Link href="/" className="inline-flex min-h-11 items-center hover:text-sun-700 focus-visible:underline">Home</Link>
              </li>
              <li aria-hidden>/</li>
              <li>Services</li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-sun-700">{service.title}</li>
            </ol>
          </nav>
          <span
            className={`self-start rounded-full px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.12em] text-white ${CATEGORY_CHIP[service.category]}`}
          >
            {code(service)} · {CATEGORY_LABEL[service.category]}
          </span>
          <h1 className="font-display text-[clamp(2.6rem,5vw,4.6rem)] font-bold leading-[0.98] tracking-[-0.045em] text-balance">
            <RichText text={details.heroTitle} />
          </h1>
          <p className="max-w-[540px] text-[clamp(1rem,1.4vw,1.1875rem)] leading-relaxed text-navy-900/80">{service.summary}</p>
          <div className="flex flex-wrap gap-2.5">
            <Button asChild variant="sun" size="xl" className="fx-sheen">
              <Link href={details.primaryCta.href}>{details.primaryCta.label} →</Link>
            </Button>
            <Button asChild variant="line" size="xl">
              <Link href={details.secondaryCta.href}>{details.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
        <PhotoFrame
          className="h-[300px] sm:h-[400px] lg:h-[460px]"
          chips={<Hud>System online</Hud>}
          caption={<span className="glass rounded-[10px] px-3 py-2 font-label text-[11px] uppercase tracking-[0.12em]">{details.imageCaption}</span>}
        >
          <Image src={details.image.src} alt={details.image.alt} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
        </PhotoFrame>
      </div>
    </section>
  );
}

/* ───────────────────────────── Benefits ───────────────────────────── */
function Benefits({ details }: { details: ServiceDetails }) {
  return (
    <Section tone="white">
      <Reveal className="grid gap-4 md:grid-cols-3">
        {details.benefits.map((b) => (
          <div key={b.title} data-reveal className="glass-card flex min-w-0 flex-col gap-3 rounded-[22px] p-6 sm:p-7">
            <span className="glow-tile size-12 rounded-[14px]" style={{ "--c": TONE[b.tone] } as React.CSSProperties}>
              <Icon name={b.icon} className="size-5" />
            </span>
            <h3 className="font-display text-[21px] font-bold tracking-[-0.02em]">{b.title}</h3>
            <p className="leading-relaxed text-ink-muted">{b.description}</p>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}

/* ───────────────────────────── Included + sizing ───────────────────────────── */
function Included({ details, eyebrow }: { details: ServiceDetails; eyebrow: string }) {
  const { included, sizing } = details;
  return (
    <Section tone="tint">
      <div className={sizing ? "grid items-start gap-10 lg:grid-cols-2 lg:gap-14" : "flex flex-col gap-8"}>
        <div className="flex min-w-0 flex-col gap-4">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className={h2Class}>
            <RichText text={included.heading} />
          </h2>
          <ul className={sizing ? "mt-2 flex flex-col gap-3" : "mt-2 grid gap-3 md:grid-cols-2"}>
            {included.items.map((it) => (
              <li key={it} className="glass-card flex items-center gap-3 rounded-[14px] px-4 py-3.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-leaf-500 text-white">
                  <Icon name="check" className="size-3.5" strokeWidth={2.5} />
                </span>
                {it}
              </li>
            ))}
          </ul>
        </div>
        {sizing ? (
          <div className="glass-card min-w-0 rounded-3xl p-5 sm:p-7">
            <p className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{sizing.title}</p>
            <table className="mt-4 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-navy-900/12 font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                  {sizing.columns.map((c) => (
                    <th key={c} scope="col" className="pb-2.5 pr-2 font-medium last:pr-0">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizing.rows.map((r) => (
                  <tr key={r.goal} className="border-b border-line align-middle last:border-0">
                    <th scope="row" className="py-4 pr-2 text-left font-normal">
                      <b className="font-display">{r.goal}</b>
                      <span className="block text-[13px] text-ink-muted">{r.detail}</span>
                    </th>
                    <td className="py-4 pr-2 font-display font-bold">{r.capacity}</td>
                    <td className="py-4 font-label text-[11px] uppercase tracking-[0.08em] text-sky-600">{r.runtime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3.5 font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{sizing.footnote}</p>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

/* ───────────────────────────── Brands + process ───────────────────────────── */
function Process({ details, brands, brandsEyebrow, stepsEyebrow }: { details: ServiceDetails; brands: Brand[]; brandsEyebrow: string; stepsEyebrow: string }) {
  return (
    <Section tone="white">
      {brands.length ? (
        <div className="mb-[clamp(48px,7vw,72px)] flex flex-col gap-5">
          <Eyebrow>{brandsEyebrow}</Eyebrow>
          <ul className="flex flex-wrap gap-3">
            {brands.map((b) => (
              <li key={b.name} className="glass-card rounded-2xl px-5 py-3.5 font-display text-xl font-extrabold sm:px-6 sm:py-4">
                {b.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Eyebrow>{stepsEyebrow}</Eyebrow>
      <ol className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {details.steps.map((s, i) => (
          <li key={s.title} className="flex min-w-0 flex-col gap-2 border-t-[3px] pt-4" style={{ borderColor: TONE[s.tone] }}>
            <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="font-display text-[19px] font-bold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-ink-muted">{s.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ───────────────────────────── Related ───────────────────────────── */
function Related({ items }: { items: Service[] }) {
  if (!items.length) return null;
  return (
    <Section tone="dawn">
      <SectionHeader eyebrow="Keep exploring" heading="Related *services*" />
      <Reveal className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <Link
            key={r.slug}
            href={`/services/${r.slug}`}
            data-reveal
            className="glass-card fx-lift fx-ring group flex min-h-[150px] min-w-0 flex-col gap-3 rounded-[20px] p-5 outline-none focus-visible:ring-2 focus-visible:ring-sky-600 sm:p-6"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                {code(r)} · {CATEGORY_LABEL[r.category]}
              </span>
              <Icon name={r.icon} className="size-5 text-sky-600" />
            </span>
            <span className="mt-auto font-display text-[19px] font-bold leading-snug">{r.title}</span>
            <span className="flex items-center justify-between font-label text-[11px] uppercase tracking-[0.12em] text-sky-600">
              Learn more
              <GoArrow className="size-9" />
            </span>
          </Link>
        ))}
      </Reveal>
    </Section>
  );
}

/* ───────────────────────────── CTA ───────────────────────────── */
function CtaBand({ details }: { details: ServiceDetails }) {
  return (
    <section className="fx-dark">
      <div className="container-site flex flex-wrap items-center justify-between gap-6 py-16">
        <h2 className="max-w-[640px] font-display text-[clamp(30px,4vw,52px)] font-extrabold leading-none tracking-[-0.045em] text-balance">
          {details.ctaHeading}
        </h2>
        <Button asChild variant="sun" size="xl" className="fx-sheen h-14 px-7 text-[13px]">
          <Link href="/contact">Inquire now »</Link>
        </Button>
      </div>
    </section>
  );
}
