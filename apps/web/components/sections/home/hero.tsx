import Image from "next/image";
import { Check } from "lucide-react";
import { useId } from "react";

import { Hud, PhotoFrame, RichText } from "@/components/fx";
import type { HomeContent } from "@/lib/content/types";
import { formatPeso } from "@/lib/solar-calc";

import { HeroBillForm } from "./hero-bill-form";
import { HeroStatus } from "./hero-status";

type Estimate = { systemKwp: number; panels: number; monthlySavings: number; paybackYears: number | null };

const mono = "font-label text-[11px] uppercase tracking-[0.12em]";
const PANEL =
  "rounded-[4px] border-2 border-day-100 shadow-[0_6px_0_var(--color-ink-muted)] bg-[linear-gradient(155deg,rgb(255_255_255/0.55),transparent_35%),linear-gradient(160deg,var(--color-sky-500),var(--color-sky-700)_55%,var(--color-navy-900))]";

function payback(n: number | null) {
  return n == null ? "—" : `${n.toFixed(1)} yrs`;
}

export function HeroSection({ hero, estimate }: { hero: HomeContent["hero"]; estimate: Estimate }) {
  const gid = useId();
  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-sky-200)_0%,var(--color-dawn-50)_60%,var(--color-sun-300)_150%)] pb-[120px] pt-[calc(var(--site-top)+36px)] lg:pb-[180px]"
    >
      {/* backdrop */}
      <div aria-hidden className="fx-grid absolute inset-0" />
      <div
        aria-hidden
        className="absolute -right-[420px] top-10 size-[1100px] animate-[fx-spin_240s_linear_infinite] rounded-full bg-[repeating-conic-gradient(from_0deg,rgb(255_201_60/0.38)_0deg_3deg,transparent_3deg_12deg)] [mask-image:radial-gradient(circle,black_22%,transparent_62%)] max-lg:opacity-70"
      />
      <div
        aria-hidden
        className="absolute right-[-60px] top-[140px] size-[260px] rounded-full bg-[radial-gradient(circle_at_45%_40%,var(--color-dawn-50),var(--color-sun-300)_25%,var(--color-sun-500)_65%,var(--color-sun-600))] shadow-[0_0_80px_24px_rgb(255_178_26/0.5),0_0_200px_90px_rgb(255_138_0/0.22)] lg:right-[13%] lg:top-[230px] lg:size-[460px] lg:shadow-[0_0_120px_40px_rgb(255_178_26/0.55),0_0_300px_140px_rgb(255_138_0/0.25)]"
      />
      <div aria-hidden className="pointer-events-none absolute right-[calc(13%-90px)] top-[140px] hidden size-[640px] lg:block">
        <span className="absolute inset-0 animate-[fx-spin_70s_linear_infinite] rounded-full border border-white/75" />
        <span className="absolute inset-20 animate-[fx-spin_45s_linear_infinite_reverse] rounded-full border border-dashed border-white/55" />
        <span className="absolute inset-0 animate-[fx-spin_20s_linear_infinite] rounded-full before:absolute before:-top-[5px] before:left-1/2 before:-ml-[5px] before:size-2.5 before:rounded-full before:bg-white before:shadow-[0_0_14px_4px_rgb(255_255_255/0.9),0_0_30px_8px_rgb(255_178_26/0.6)] before:content-['']" />
      </div>
      {/* solar-panel field */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[130px] overflow-hidden [perspective:900px] lg:h-[200px]">
        <div className="absolute inset-x-[-15%] -bottom-[70px] grid h-[360px] origin-bottom grid-cols-6 gap-2.5 px-6 [transform:rotateX(62deg)] lg:grid-cols-10">
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className={`${PANEL} ${i >= 18 ? "max-lg:hidden" : ""}`} />
          ))}
          <div className="fx-sweep pointer-events-none absolute inset-0" />
        </div>
      </div>

      <div className="container-site relative z-[2] grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <Hud light dot="amber">
              <HeroStatus status={hero.status} />
            </Hud>
            <span className={`${mono} text-navy-900`}>{hero.tagline}</span>
          </div>
          <h1 className="font-display text-[clamp(44px,5.1vw,74px)] font-bold leading-none tracking-[-0.045em] text-navy-900">
            <RichText text={hero.heading} />
          </h1>
          <p className="max-w-[540px] text-[17px] leading-[1.55] text-navy-900/85 sm:text-[19px]">{hero.subheading}</p>
          <HeroBillForm label={hero.billLabel} defaultValue={hero.billDefault} ctaLabel={hero.cta.label} href={hero.cta.href} />

          {/* compact estimate strip (below lg) */}
          <div className="glass flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl px-4 py-3 lg:hidden">
            <span className={`${mono} text-ink-muted`}>{hero.estimateLabel}</span>
            <span className="font-display font-bold">{estimate.systemKwp} kWp</span>
            <span className="font-display font-bold text-leaf-600">{formatPeso(estimate.monthlySavings)}/mo</span>
            <span className="font-display font-bold text-sun-700">{payback(estimate.paybackYears)}</span>
          </div>

          <ul className={`${mono} flex flex-wrap gap-x-[18px] gap-y-2 text-navy-900`}>
            {hero.trust.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-leaf-600" strokeWidth={1.75} aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* visual column (lg+) */}
        <div className="relative hidden min-w-0 flex-col items-end lg:flex">
          <div className="glass relative z-[2] -mb-9 ml-2.5 flex w-[300px] flex-col gap-3 self-start rounded-[20px] p-[18px]">
            <span className={`${mono} inline-flex items-center gap-2 text-ink-muted`}>
              <span className="fx-dot" />
              {hero.estimateLabel}
            </span>
            <dl className="grid grid-cols-2 gap-3">
              {[
                { k: "System", v: `${estimate.systemKwp} kWp`, unit: "", c: "" },
                { k: "Panels", v: String(estimate.panels), unit: "", c: "" },
                { k: "Savings", v: formatPeso(estimate.monthlySavings), unit: "/mo", c: "text-leaf-600" },
                { k: "Payback", v: payback(estimate.paybackYears), unit: "", c: "text-sun-700" },
              ].map((s) => (
                <div key={s.k}>
                  <dt className={`${mono} block text-ink-muted`}>{s.k}</dt>
                  <dd className={`font-display text-2xl font-bold ${s.c}`}>
                    {s.v}
                    {s.unit ? <span className="text-[13px]">{s.unit}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-navy-900/10 pt-2.5">
              <span className={`${mono} text-ink-muted`}>Typical daily output</span>
              <svg viewBox="0 0 260 46" className="mt-1.5 block h-[46px] w-full" aria-hidden>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" style={{ stopColor: "var(--color-sun-500)", stopOpacity: 0.45 }} />
                    <stop offset="1" style={{ stopColor: "var(--color-sun-500)", stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                <path d="M0 44 C40 44 62 38 92 24 S150 2 172 8 S222 38 260 44 Z" fill={`url(#${gid})`} />
                <path d="M0 44 C40 44 62 38 92 24 S150 2 172 8 S222 38 260 44" fill="none" strokeWidth="2" style={{ stroke: "var(--color-sun-500)" }} />
                <circle cx="150" cy="5" r="4" style={{ fill: "var(--color-sun-500)", filter: "drop-shadow(0 0 5px var(--color-sun-500))" }} />
              </svg>
              <span className={`${mono} flex justify-between text-ink-muted`}>
                <span>6 AM</span>
                <span>Noon</span>
                <span>6 PM</span>
              </span>
            </div>
          </div>
          <PhotoFrame
            className="h-[270px] w-full max-w-[400px]"
            chips={
              <>
                <span />
                <Hud>{hero.liveChip}</Hud>
              </>
            }
            caption={<span className={`${mono} glass rounded-[9px] px-2.5 py-[7px]`}>{hero.imageCaption}</span>}
          >
            <Image src={hero.image.src} alt={hero.image.alt} fill priority sizes="400px" className="object-cover" />
          </PhotoFrame>
        </div>
      </div>
    </section>
  );
}
