import { Battery, House, Plug, Sun, Zap } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { GoArrow } from "@/components/fx";
import type { Service, UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";
import { cn } from "@/lib/utils";

export const mono = "font-label text-[11px] uppercase tracking-[0.12em]";

/** Shared dark glass card shell (linked): lift + gradient ring on hover. */
export const deckCard =
  "group glass-dark fx-ring fx-lift relative block overflow-hidden rounded-3xl text-white outline-offset-4 focus-visible:outline-2 focus-visible:outline-sun-300 hover:text-white";

const pad = (n: number) => String(n).padStart(2, "0");
const catLabel = (ui: UiLabels, c: Service["category"]) => t(ui, `category${c.charAt(0).toUpperCase()}${c.slice(1)}`);

function Title({ s, big }: { s: Service; big?: boolean }) {
  return (
    <span className="flex flex-col gap-2.5">
      <h3
        className={cn(
          "font-display font-bold tracking-[-0.03em]",
          big ? "text-2xl leading-[1.1] sm:text-[30px]" : "text-xl leading-snug tracking-[-0.01em]",
        )}
      >
        {s.title}
      </h3>
      <span className={cn("leading-relaxed text-ink-soft", big ? "max-w-[460px] text-[15px]" : "text-sm")}>
        {s.summary}
      </span>
    </span>
  );
}

function Footer({ ui }: { ui: UiLabels }) {
  return (
    <span className="flex items-center justify-between gap-3">
      <span className={cn(mono, "text-ink-glow")}>{t(ui, "learnMore")}</span>
      <GoArrow dark />
    </span>
  );
}

/* ───────── Energy-flow diagram (illustrative) ───────── */
function Node({ k, v, icon, tone }: { k: string; v: string; icon: ReactNode; tone: string }) {
  return (
    <span className="relative z-10 flex flex-col items-start gap-1 rounded-[14px] border border-white/15 bg-navy-950/90 p-2 sm:flex-row sm:items-center sm:gap-2.5 sm:px-3 sm:py-2.5">
      <span className={cn("max-sm:hidden", tone)}>{icon}</span>
      <span>
        <span className={cn("block text-ink-soft", mono)}>{k}</span>
        <span className="block font-display text-sm leading-tight font-bold whitespace-nowrap text-white sm:text-base">
          {v}
        </span>
      </span>
    </span>
  );
}

const FLOW =
  "[stroke-dasharray:3_9] [stroke-linecap:round] animate-[fx-flow_1.8s_linear_infinite] motion-reduce:animate-none";

function EnergyFlow({ ui }: { ui: UiLabels }) {
  return (
    <div
      role="img"
      aria-label={t(ui, "energyFlowAlt")}
      className="relative grid min-h-[170px] grid-cols-[28%_24%_30%] items-center justify-between sm:min-h-[210px] sm:grid-cols-[26%_22%_26%]"
    >
      <svg aria-hidden className="absolute inset-0 size-full overflow-visible">
        <g className="stroke-white/15" strokeWidth="2">
          <line x1="26%" y1="50%" x2="39%" y2="50%" />
          <line x1="61%" y1="50%" x2="67.5%" y2="50%" />
          <line x1="67.5%" y1="15%" x2="67.5%" y2="85%" />
          <line x1="67.5%" y1="15%" x2="74%" y2="15%" />
          <line x1="67.5%" y1="50%" x2="74%" y2="50%" />
          <line x1="67.5%" y1="85%" x2="74%" y2="85%" />
        </g>
        <g strokeWidth="2.5">
          <line className={cn(FLOW, "stroke-sun-300")} x1="26%" y1="50%" x2="39%" y2="50%" />
          <line className={cn(FLOW, "stroke-sun-500")} x1="61%" y1="50%" x2="67.5%" y2="50%" />
          <line className={cn(FLOW, "stroke-glow-sky")} x1="67.5%" y1="50%" x2="67.5%" y2="15%" />
          <line className={cn(FLOW, "stroke-glow-sky")} x1="67.5%" y1="15%" x2="74%" y2="15%" />
          <line className={cn(FLOW, "stroke-sun-500")} x1="67.5%" y1="50%" x2="74%" y2="50%" />
          <line className={cn(FLOW, "stroke-glow-leaf")} x1="67.5%" y1="50%" x2="67.5%" y2="85%" />
          <line className={cn(FLOW, "stroke-glow-leaf")} x1="67.5%" y1="85%" x2="74%" y2="85%" />
        </g>
        <circle cx="67.5%" cy="50%" r="4" className="fill-sun-300" />
      </svg>

      <Node
        k={t(ui, "nodeSolar")}
        v="4.2 kW"
        tone="text-sun-300"
        icon={<Sun className="size-[22px]" strokeWidth={1.75} />}
      />

      <span className="relative z-10 flex flex-col items-center gap-2 rounded-[14px] border border-sun-300/50 bg-navy-950/90 px-2.5 py-4 text-center shadow-[0_0_0_6px_rgb(255_138_0/0.08),0_0_40px_-8px_rgb(255_138_0/0.6)]">
        <span className="grid size-11 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--color-sun-300),var(--color-sun-500)_50%,var(--color-sun-600))] text-navy-900">
          <Zap className="size-[22px]" strokeWidth={1.75} aria-hidden />
        </span>
        <span>
          <span className={cn("block text-ink-soft", mono)}>{t(ui, "nodeInverter")}</span>
          <span className="block font-display text-sm font-bold text-white sm:text-base">{t(ui, "nodeHybrid")}</span>
        </span>
      </span>

      <span className="relative z-10 grid gap-2.5">
        <Node
          k={t(ui, "nodeHome")}
          v="2.1 kW"
          tone="text-glow-sky"
          icon={<House className="size-[22px]" strokeWidth={1.75} />}
        />
        <Node
          k={t(ui, "nodeGrid")}
          v="+1.3 kW"
          tone="text-sun-500"
          icon={<Plug className="size-[22px]" strokeWidth={1.75} />}
        />
        <Node
          k={t(ui, "nodeBattery")}
          v="82%"
          tone="text-glow-leaf"
          icon={<Battery className="size-[22px]" strokeWidth={1.75} />}
        />
      </span>
    </div>
  );
}

/* ───────── Roof scan ───────── */
function RoofScan({ ui }: { ui: UiLabels }) {
  return (
    <div className="relative grid h-[140px] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] bg-[radial-gradient(80%_90%_at_50%_0%,rgb(74_147_255/0.28),transparent_70%)] lg:h-[180px]">
      <div
        aria-hidden
        className="grid [transform:perspective(520px)_rotateX(46deg)_rotateZ(-10deg)] grid-cols-[repeat(4,34px)] grid-rows-[repeat(2,50px)] gap-[5px] rounded-lg border border-dashed border-sun-300/60 p-2"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className="rounded-[4px] border border-sky-200/35 bg-[linear-gradient(160deg,var(--color-sky-600),var(--color-navy-900))]"
          />
        ))}
      </div>
      <span className="fx-scan motion-reduce:hidden" aria-hidden />
      <span className={cn("absolute bottom-2.5 left-3 text-ink-glow", mono)}>{t(ui, "roofScan")}</span>
    </div>
  );
}

/* ───────── Battery gauge ───────── */
function BatteryGauge({ ui }: { ui: UiLabels }) {
  const seg = "flex-1 rounded-md border";
  return (
    <div className="relative flex h-[140px] flex-col items-center justify-center gap-3.5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] bg-[radial-gradient(80%_90%_at_50%_100%,rgb(45_184_76/0.24),transparent_70%)] lg:h-[180px]">
      <span className="flex items-baseline gap-2.5">
        <span className="font-display text-4xl font-bold tracking-[-0.03em]">82%</span>
        <span className={cn("text-ink-soft", mono)}>{t(ui, "illustrative")}</span>
      </span>
      <span aria-hidden className="flex items-center gap-1">
        <span className="flex h-14 w-[170px] gap-[5px] rounded-xl border-[1.5px] border-white/35 p-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                seg,
                "border-transparent bg-[linear-gradient(180deg,var(--color-glow-leaf),var(--color-leaf-500))] shadow-[0_0_18px_-4px_rgb(45_184_76/0.8)]",
              )}
            />
          ))}
          <span
            className={cn(
              seg,
              "animate-[fx-blink_1.6s_ease-in-out_infinite] border-transparent bg-[linear-gradient(180deg,var(--color-glow-leaf),var(--color-leaf-500))] shadow-[0_0_18px_-4px_rgb(45_184_76/0.8)] motion-reduce:animate-none",
            )}
          />
          <span className={cn(seg, "border-white/10 bg-white/10")} />
        </span>
        <span className="h-5 w-1.5 rounded-r bg-white/35" />
      </span>
    </div>
  );
}

/** Featured row ("All" view). Order of services: [0] big hybrid card, [1] design, [2] battery. */
export function ServicesFeatured({ items, ui }: { items: Service[]; ui: UiLabels }) {
  const [big, second, third] = items;
  const slot = "min-w-0 shrink-0 basis-[86%] snap-start sm:basis-auto";
  return (
    <div className="-mr-4 mb-3 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto py-1 pr-4 sm:mr-0 sm:mb-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pr-0 sm:[perspective:1400px] lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
      {big ? (
        <Link
          href={`/services/${big.slug}`}
          className={cn(
            deckCard,
            slot,
            "d3-tilt sr-tilt flex flex-col gap-5 p-5 after:opacity-100! sm:col-span-2 sm:gap-[22px] sm:p-7",
          )}
        >
          <span className="flex flex-wrap items-center justify-between gap-3">
            <span className={cn(mono, "inline-flex items-center gap-2 text-sun-300")}>
              <span
                className="size-2 animate-[fx-blink_1.8s_ease-in-out_infinite] rounded-full bg-glow-leaf shadow-[0_0_10px_var(--color-glow-leaf)] motion-reduce:animate-none"
                aria-hidden
              />
              {t(ui, "mostRequested")} · {catLabel(ui, big.category)}
            </span>
            <span className={cn(mono, "text-ink-soft")}>{t(ui, "illustrativeValues")}</span>
          </span>
          <Title s={big} big />
          <EnergyFlow ui={ui} />
          <Footer ui={ui} />
        </Link>
      ) : null}
      {second ? (
        <Link
          href={`/services/${second.slug}`}
          style={{ "--k": 1 } as CSSProperties}
          className={cn(deckCard, slot, "d3-tilt sr-tilt flex flex-col gap-[18px] p-6")}
        >
          <span className={cn(mono, "flex justify-between gap-2 text-glow-sky")}>
            <span>
              {pad(second.order)} · {catLabel(ui, second.category)}
            </span>
          </span>
          <RoofScan ui={ui} />
          <span className="mt-auto">
            <Title s={second} />
          </span>
          <Footer ui={ui} />
        </Link>
      ) : null}
      {third ? (
        <Link
          href={`/services/${third.slug}`}
          style={{ "--k": 1 } as CSSProperties}
          className={cn(deckCard, slot, "d3-tilt sr-tilt flex flex-col gap-[18px] p-6")}
        >
          <span className={cn(mono, "flex justify-between gap-2 text-glow-sky")}>
            <span>
              {pad(third.order)} · {catLabel(ui, third.category)}
            </span>
          </span>
          <BatteryGauge ui={ui} />
          <span className="mt-auto">
            <Title s={third} />
          </span>
          <Footer ui={ui} />
        </Link>
      ) : null}
    </div>
  );
}
