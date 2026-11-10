import Image from "next/image";
import Link from "next/link";
import { Battery as BatteryIcon, Check } from "lucide-react";
import { useId } from "react";

import { Hud, PhotoFrame, RichText } from "@/components/fx";
import type { HomeContent, UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";
import { formatPeso } from "@/lib/solar-calc";
import { HeroWebglLoader } from "@/components/three-d/hero-webgl-loader";
import { Pin, RooftopWorld, Scene } from "@/components/three-d/models";

import { HeroBillForm } from "./hero-bill-form";
import { HeroMotion } from "./hero-motion";
import { HeroStatus } from "./hero-status";

type Estimate = { systemKwp: number; panels: number; monthlySavings: number; paybackYears: number | null };

const mono = "font-label text-[11px] uppercase tracking-[0.12em]";
const PANEL =
  "rounded-[4px] border-2 border-day-100 shadow-[0_6px_0_var(--color-ink-muted)] bg-[linear-gradient(155deg,rgb(255_255_255/0.55),transparent_35%),linear-gradient(160deg,var(--color-sky-500),var(--color-sky-700)_55%,var(--color-navy-900))]";

function payback(ui: UiLabels, n: number | null) {
  return n == null ? "—" : `${n.toFixed(1)} ${t(ui, "years")}`;
}

export function HeroSection({ hero, estimate, ui }: { hero: HomeContent["hero"]; estimate: Estimate; ui: UiLabels }) {
  const gid = useId();
  const pinChip = "max-sm:px-2.5 max-sm:py-1.5 max-sm:text-[11px]";
  const pins = {
    panels: <Hud className={pinChip}>{t(ui, "pinPanels", { n: estimate.panels })}</Hud>,
    battery: (
      <Hud light className={pinChip}>
        {t(ui, "pinBattery")}
      </Hud>
    ),
    grid: (
      <Hud light dot="amber">
        {t(ui, "pinGrid")}
      </Hud>
    ),
  };
  const stageInset =
    "absolute inset-x-0 top-0 bottom-0 sm:-inset-x-5 sm:-top-[30px] lg:-left-10 lg:-right-[60px] lg:-top-10";
  return (
    <section
      aria-label={t(ui, "heroAria")}
      className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-sky-200)_0%,var(--color-dawn-50)_60%,var(--color-sun-300)_150%)] pt-[calc(var(--site-top)+36px)] pb-[120px] lg:pb-[180px]"
    >
      {/* backdrop */}
      <div aria-hidden className="absolute inset-0 fx-grid" />
      <div
        aria-hidden
        className="absolute top-10 -right-[420px] size-[1100px] animate-[fx-spin_240s_linear_infinite] rounded-full bg-[repeating-conic-gradient(from_0deg,rgb(255_201_60/0.38)_0deg_3deg,transparent_3deg_12deg)] [mask-image:radial-gradient(circle,black_22%,transparent_62%)] max-lg:opacity-70"
      />
      {/* solar-panel field */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[130px] overflow-hidden [perspective:900px] lg:h-[200px]"
      >
        <div className="absolute inset-x-[-15%] -bottom-[70px] grid h-[360px] origin-bottom [transform:rotateX(62deg)] grid-cols-6 gap-2.5 px-6 lg:grid-cols-10">
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className={`${PANEL} ${i >= 18 ? "max-lg:hidden" : ""}`} />
          ))}
          <div className="pointer-events-none absolute inset-0 fx-sweep" />
        </div>
      </div>

      <div className="relative z-[2] container-site grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <Hud light dot="amber">
              <HeroStatus status={hero.status} />
            </Hud>
            <span className={`${mono} text-navy-900`}>{hero.tagline}</span>
          </div>
          <h1 className="font-display text-[44px] leading-none font-bold tracking-[-0.045em] text-navy-900 sm:text-[clamp(48px,5.1vw,74px)]">
            <RichText text={hero.heading} />
          </h1>
          <p className="max-w-[540px] text-[17px] leading-[1.55] text-navy-900/85 sm:text-[19px]">{hero.subheading}</p>
          <HeroBillForm
            ariaLabel={t(ui, "quickEstimateAria")}
            label={hero.billLabel}
            defaultValue={hero.billDefault}
            ctaLabel={hero.cta.label}
            href={hero.cta.href}
          />

          {/* compact estimate strip (below lg) */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl px-4 py-3 glass lg:hidden">
            <span className={`${mono} text-ink-muted`}>{hero.estimateLabel}</span>
            <span className="font-display font-bold">{estimate.systemKwp} kWp</span>
            <span className="font-display font-bold text-leaf-600">
              {formatPeso(estimate.monthlySavings)}
              {t(ui, "perMonth")}
            </span>
            <span className="font-display font-bold text-sun-700">{payback(ui, estimate.paybackYears)}</span>
          </div>

          <ul className={`${mono} flex flex-wrap gap-x-[18px] gap-y-2 text-navy-900`}>
            {hero.trust.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-leaf-600" strokeWidth={1.75} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 3D rooftop scene (all sizes); estimate card + live photo float over it on lg+ */}
        <HeroMotion className="relative -mx-4 h-[330px] min-w-0 sm:mx-0 sm:h-[460px] lg:h-[620px] lg:self-stretch">
          <Scene
            label={t(ui, "heroSceneAria")}
            className={stageInset}
            worldClassName="scale-[0.66] max-sm:left-[57%] max-sm:top-[62%] sm:scale-100 lg:scale-[0.86] xl:scale-[1.02]"
            sun={
              <div data-d3-sun className="d3-sun size-24 sm:size-[130px] lg:size-[150px]">
                <span className="d3-orbit" />
              </div>
            }
          >
            <RooftopWorld />
            <Pin x={-70} y={-100} z={200} className="max-sm:-translate-x-[30%]">
              {pins.panels}
            </Pin>
            <Pin x={-173} y={20} z={110} className="max-sm:hidden">
              {pins.battery}
            </Pin>
            <Pin x={-102} y={196} z={8} className="-ml-3 -translate-x-full max-sm:hidden">
              {pins.grid}
            </Pin>
          </Scene>
          <HeroWebglLoader pins={pins} className={`d3-webgl pointer-events-none ${stageInset}`} />

          <div className="d3-float absolute right-0 -bottom-3.5 z-[3] hidden w-[256px] flex-col gap-2.5 rounded-[20px] p-4 glass lg:flex xl:-right-10">
            <span className={`${mono} flex items-center justify-between gap-2 text-ink-muted`}>
              <span className="inline-flex items-center gap-2">
                <span className="fx-dot" />
                {hero.estimateLabel}
              </span>
              <BatteryIcon className="size-4 text-leaf-600" strokeWidth={1.75} aria-hidden />
            </span>
            <dl className="grid grid-cols-2 gap-3">
              {[
                { k: t(ui, "estimateSystem"), v: `${estimate.systemKwp} kWp`, unit: "", c: "" },
                { k: t(ui, "estimatePanels"), v: String(estimate.panels), unit: "", c: "" },
                {
                  k: t(ui, "estimateSavings"),
                  v: formatPeso(estimate.monthlySavings),
                  unit: t(ui, "perMonth"),
                  c: "text-leaf-600",
                },
                { k: t(ui, "estimatePayback"), v: payback(ui, estimate.paybackYears), unit: "", c: "text-sun-700" },
              ].map((s) => (
                <div key={s.k}>
                  <dt className={`${mono} block text-ink-muted`}>{s.k}</dt>
                  <dd className={`font-display text-[22px] font-bold ${s.c}`}>
                    {s.v}
                    {s.unit ? <span className="text-[13px]">{s.unit}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-navy-900/10 pt-2.5">
              <span className={`${mono} text-ink-muted`}>{t(ui, "typicalDailyOutput")}</span>
              <svg viewBox="0 0 260 46" className="mt-1.5 block h-[40px] w-full" aria-hidden>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" style={{ stopColor: "var(--color-sun-500)", stopOpacity: 0.45 }} />
                    <stop offset="1" style={{ stopColor: "var(--color-sun-500)", stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                <path d="M0 44 C40 44 62 38 92 24 S150 2 172 8 S222 38 260 44 Z" fill={`url(#${gid})`} />
                <path
                  d="M0 44 C40 44 62 38 92 24 S150 2 172 8 S222 38 260 44"
                  fill="none"
                  strokeWidth="2"
                  style={{ stroke: "var(--color-sun-500)" }}
                />
                <circle
                  cx="150"
                  cy="5"
                  r="4"
                  style={{ fill: "var(--color-sun-500)", filter: "drop-shadow(0 0 5px var(--color-sun-500))" }}
                />
              </svg>
              <span className={`${mono} flex justify-between text-ink-muted`}>
                <span>{t(ui, "time6am")}</span>
                <span>{t(ui, "timeNoon")}</span>
                <span>{t(ui, "time6pm")}</span>
              </span>
            </div>
          </div>

          <PhotoFrame
            className="d3-float absolute top-0 right-0 z-[3] hidden h-[142px] w-[214px] p-1.5 [animation-delay:-3s] lg:block xl:-right-2.5"
            chips={<Hud className="px-2.5 py-1.5 text-[11px]">{hero.liveChip}</Hud>}
          >
            <Image src={hero.image.src} alt={hero.image.alt} fill priority sizes="214px" className="object-cover" />
          </PhotoFrame>
        </HeroMotion>
      </div>

      <Link href="#solutions" className="scroll-cue">
        <span className="mouse" aria-hidden>
          <i />
        </span>
        {t(ui, "scrollToExplore")}
      </Link>
    </section>
  );
}
