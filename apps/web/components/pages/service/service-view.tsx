import Image from "next/image";
import Link from "next/link";

import { Icon, TONE } from "@/components/icons";
import { Eyebrow, Hud, RichText } from "@/components/fx";
import { Reveal } from "@/components/motion/reveal";
import type { ServiceDetails } from "@/lib/content/pages/service";
import type { Brand, Service, ServiceCategory, UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";

const CATEGORY_LABEL: Record<ServiceCategory, string> = { systems: "categorySystems", installation: "categoryInstallation", specialty: "categorySpecialty" };
const CATEGORY_CHIP: Record<ServiceCategory, string> = { systems: "bg-sky-500", installation: "bg-sun-700", specialty: "bg-leaf-600" };

const MONO = "font-label uppercase tracking-[0.12em]";
const BAND = "py-[90px]";
const SUN_FILL = "bg-[linear-gradient(135deg,var(--color-sun-300),var(--color-sun-500)_50%,var(--color-sun-600))]";
const BTN = `${MONO} text-[12px] text-navy-900 rounded-[14px] px-[22px] py-[17px]`;

const code = (s: Service) => `S/${String(s.order).padStart(2, "0")}`;
/** Re-number "[ 02 ] Title" eyebrows so numbering stays continuous when a section is hidden. */
const numbered = (n: number, eyebrow: string) => `[ ${String(n).padStart(2, "0")} ] ${eyebrow.replace(/^\[[^\]]*\]\s*/, "")}`;

type Props = { service: Service; details: ServiceDetails; brands: Brand[]; related: Service[]; ui: UiLabels };

export function ServiceView({ service, details, brands, related, ui }: Props) {
  // Content can list the brands (in order); otherwise filter by category, ordered by category priority.
  const shownBrands = details.brandNames?.length
    ? details.brandNames.map((n) => brands.find((b) => b.name === n)).filter((b) => b !== undefined)
    : brands
        .filter((b) => details.brandCategories.includes(b.category))
        .sort((x, y) => details.brandCategories.indexOf(x.category) - details.brandCategories.indexOf(y.category));
  let n = 1;
  return (
    <>
      <Hero service={service} details={details} ui={ui} />
      <Benefits details={details} />
      <Included details={details} eyebrow={numbered(n++, details.included.eyebrow)} />
      <Process
        details={details}
        brands={shownBrands}
        brandsEyebrow={shownBrands.length ? numbered(n++, details.brandsEyebrow) : ""}
        stepsEyebrow={numbered(n++, details.stepsEyebrow)}
      />
      <Related items={related} ui={ui} />
      <CtaBand details={details} ui={ui} />
    </>
  );
}

/* ───────────────────────────── Hero ───────────────────────────── */
function Hero({ service, details, ui }: Pick<Props, "service" | "details" | "ui">) {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-day-100),var(--color-day-50))] pb-[90px] pt-[calc(var(--site-top)-9px)]">
      <div
        aria-hidden
        className="fx-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[900px] [mask-image:radial-gradient(90%_75%_at_50%_20%,black,transparent_80%)]"
      />
      <div className="container-site grid grid-cols-2 items-center gap-14 max-[1000px]:grid-cols-1 [&>*]:min-w-0">
        <div className="flex flex-col gap-[22px]">
          <nav aria-label={t(ui, "breadcrumb")} className={`${MONO} text-[11px] text-ink-muted`}>
            <ol className="flex flex-wrap items-center gap-x-[0.5ch]">
              <li>
                <Link href="/" className="hover:text-sun-700 focus-visible:underline">{t(ui, "home")}</Link>
              </li>
              <li aria-hidden>/</li>
              <li>{t(ui, "services")}</li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-sun-700">{details.breadcrumbLabel ?? service.title}</li>
            </ol>
          </nav>
          <span className={`${MONO} self-start rounded-full px-3 py-[7px] text-[11px] text-white ${CATEGORY_CHIP[service.category]}`}>
            {code(service)} · {t(ui, CATEGORY_LABEL[service.category])}
          </span>
          <h1 className="m-0 font-display text-[clamp(42px,5.4vw,80px)] font-bold leading-[0.98] tracking-[-0.045em]">
            <RichText text={details.heroTitle} />
          </h1>
          <p className="m-0 max-w-[540px] text-[19px] leading-[1.6] text-navy-900/85">{details.heroSummary ?? service.summary}</p>
          <div className="flex flex-wrap gap-2.5">
            <Link href={details.primaryCta.href} className={`${BTN} fx-sheen ${SUN_FILL}`}>
              {details.primaryCta.label} →
            </Link>
            <Link href={details.secondaryCta.href} className={`${BTN} border border-navy-900/15 bg-white`}>
              {details.secondaryCta.label}
            </Link>
          </div>
        </div>
        <div className="corners p-2.5">
          <div className="relative h-[460px] overflow-hidden rounded-[18px] max-[1000px]:h-[260px]">
            <Image src={details.image.src} alt={details.image.alt} fill priority sizes="(min-width: 1000px) 45vw, 100vw" className="object-cover" />
            <span className="fx-scan !inset-0" aria-hidden />
            <div className="absolute inset-x-3.5 top-3.5 z-[1] flex flex-wrap justify-between gap-2">
              <Hud>{t(ui, "systemOnline")}</Hud>
            </div>
            <div className="absolute bottom-3.5 left-3.5 z-[1]">
              <span className={`glass rounded-[10px] px-3 py-2 text-[11px] ${MONO}`}>{details.imageCaption}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Benefits ───────────────────────────── */
function Benefits({ details }: { details: ServiceDetails }) {
  return (
    <section className={`${BAND} bg-white`}>
      <div className="container-site">
        <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {details.benefits.map((b) => (
            <div key={b.title} data-reveal className="glass-card flex min-w-0 flex-col gap-3 rounded-[22px] p-[26px]">
              <span className="glow-tile size-12 rounded-[14px]" style={{ "--c": TONE[b.tone] } as React.CSSProperties}>
                <Icon name={b.icon} className="size-[22px]" />
              </span>
              <h3 className="m-0 font-display text-[21px] font-bold">{b.title}</h3>
              <p className="m-0 leading-[1.6] text-ink-muted">{b.description}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────── Included + sizing ───────────────────────────── */
const SIZING_ROW = "grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2.5";

function Included({ details, eyebrow }: { details: ServiceDetails; eyebrow: string }) {
  const { included, sizing } = details;
  return (
    <section className={`${BAND} bg-day-100`}>
      <div className={sizing ? "container-site grid grid-cols-2 items-start gap-14 max-[1000px]:grid-cols-1 [&>*]:min-w-0" : "container-site flex flex-col gap-8"}>
        <div className="flex flex-col gap-[18px]">
          <Eyebrow className={`${MONO} text-[11px]`}>{eyebrow}</Eyebrow>
          <h2 className="m-0 font-display text-[clamp(32px,4vw,52px)] font-bold leading-[1.02] tracking-[-0.04em] [&_.hl]:rounded-[14px] [&_.hl]:px-3 [&_.hl]:pb-1">
            <RichText text={included.heading} />
          </h2>
          <ul className={sizing ? "m-0 mt-2 flex list-none flex-col gap-3 p-0" : "m-0 mt-2 grid list-none gap-3 p-0 md:grid-cols-2"}>
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
          <div className="glass-card rounded-3xl p-7">
            <span className={`${MONO} text-[11px] text-ink-muted`}>{sizing.title}</span>
            <div className="mt-4" role="table" aria-label={sizing.title}>
              <div role="row" className={`${SIZING_ROW} ${MONO} border-b border-navy-900/12 pb-2.5 text-[11px] text-ink-muted`}>
                {sizing.columns.map((c) => (
                  <span key={c} role="columnheader">{c}</span>
                ))}
              </div>
              {sizing.rows.map((r) => (
                <div key={r.goal} role="row" className={`${SIZING_ROW} border-b border-navy-900/8 py-4`}>
                  <span role="cell">
                    <b className="font-display">{r.goal}</b>
                    <span className="block text-[13px] text-ink-muted">{r.detail}</span>
                  </span>
                  <span role="cell" className="font-display font-bold">{r.capacity}</span>
                  <span role="cell" className={`${MONO} text-[11px] text-sky-600`}>{r.runtime}</span>
                </div>
              ))}
            </div>
            <span className={`${MONO} mt-3.5 block text-[11px] text-ink-muted`}>{sizing.footnote}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ───────────────────────────── Brands + process ───────────────────────────── */
function Process({ details, brands, brandsEyebrow, stepsEyebrow }: { details: ServiceDetails; brands: Brand[]; brandsEyebrow: string; stepsEyebrow: string }) {
  return (
    <section className={`${BAND} bg-white`}>
      <div className="container-site">
        {brands.length ? (
          <>
            <Eyebrow className={`${MONO} text-[11px]`}>{brandsEyebrow}</Eyebrow>
            <ul className="m-0 mb-[70px] mt-5 flex list-none flex-wrap gap-3 p-0">
              {brands.map((b) => (
                <li key={b.name} className="glass-card rounded-[14px] px-6 py-4 font-display text-[20px] font-extrabold">
                  {b.name}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <Eyebrow className={`${MONO} text-[11px]`}>{stepsEyebrow}</Eyebrow>
        <ol className="m-0 mt-5 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 p-0">
          {details.steps.map((s, i) => (
            <li key={s.title} className="flex min-w-0 flex-col gap-2 border-t-[3px] pt-4" style={{ borderColor: TONE[s.tone] }}>
              <span className={`${MONO} text-[11px] text-ink-muted`}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className="m-0 font-display text-[19px] font-bold">{s.title}</h3>
              <p className="m-0 text-[14px] leading-[1.55] text-ink-muted">{s.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────────────── Related ───────────────────────────── */
function Related({ items, ui }: { items: Service[]; ui: UiLabels }) {
  if (!items.length) return null;
  return (
    <section className={`${BAND} bg-[linear-gradient(180deg,var(--color-dawn-50),var(--color-dawn-100))]`}>
      <div className="container-site">
        <h2 className="m-0 mb-7 font-display text-[clamp(28px,3.4vw,44px)] font-bold tracking-[-0.04em]">{t(ui, "relatedServicesPlain")}</h2>
        <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
          {items.map((r) => (
            <Link
              key={r.slug}
              href={`/services/${r.slug}`}
              data-reveal
              className="glass-card fx-lift fx-ring flex min-h-[150px] min-w-0 flex-col gap-3 rounded-[20px] p-[22px] text-navy-900 outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              <span className={`${MONO} text-[11px] text-ink-muted`}>{code(r)}</span>
              <span className="mt-auto font-display text-[19px] font-bold">{r.title}</span>
              <span className={`${MONO} text-[11px] text-sky-600`}>{t(ui, "learnMore")} →</span>
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────── CTA ───────────────────────────── */
function CtaBand({ details, ui }: { details: ServiceDetails; ui: UiLabels }) {
  return (
    <section className="fx-dark">
      <div className="container-site flex flex-wrap items-center justify-between gap-6 py-16">
        <h2 className="m-0 max-w-[640px] font-display text-[clamp(30px,4vw,52px)] font-extrabold leading-none tracking-[-0.045em]">
          {details.ctaHeading}
        </h2>
        <Link href="/contact" className={`${MONO} fx-sheen rounded-[14px] px-[26px] py-[19px] text-[13px] text-navy-900 ${SUN_FILL}`}>
          {t(ui, "inquireNow")}
        </Link>
      </div>
    </section>
  );
}
