"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import { GoArrow, SectionHeader } from "@/components/fx";
import { Icon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import type { Service, ServiceCategory } from "@/lib/content/types";
import { cn } from "@/lib/utils";

import { deckCard, mono } from "./services-featured";

type Filter = "all" | ServiceCategory;
const TABS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "systems", label: "Systems" },
  { id: "installation", label: "Installation" },
  { id: "specialty", label: "Specialty" },
];

const CAT: Record<ServiceCategory, { c: string; text: string; label: string }> = {
  systems: { c: "var(--color-glow-sky)", text: "text-glow-sky", label: "Systems" },
  installation: { c: "var(--color-glow-amber)", text: "text-glow-amber", label: "Installation" },
  specialty: { c: "var(--color-glow-leaf)", text: "text-glow-leaf", label: "Specialty" },
};

/** lg:col-span classes must be literal for Tailwind. */
const LG_SPAN = ["", "lg:col-span-1", "lg:col-span-2", "lg:col-span-3", "lg:col-span-4"];

type Props = {
  eyebrow: string;
  heading: string;
  lead: string;
  ctaHeading: string;
  ctaLabel: string;
  services: Service[];
  /** Slugs shown in the featured row (excluded from the module grid in "All"). */
  featuredSlugs: string[];
  /** Server-rendered featured row, shown only in "All". */
  featured: ReactNode;
  /** Show every module on all screen sizes (the /services page); no "View all" link. */
  showAll?: boolean;
};

export function ServicesDeck({ eyebrow, heading, lead, ctaHeading, ctaLabel, services, featuredSlugs, featured, showAll = false }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isAll = filter === "all";
  const limited = isAll && !showAll;

  const counts: Record<Filter, number> = {
    all: services.length,
    systems: services.filter((s) => s.category === "systems").length,
    installation: services.filter((s) => s.category === "installation").length,
    specialty: services.filter((s) => s.category === "specialty").length,
  };

  const sorted = [...services].sort((a, b) => a.order - b.order);
  const mods = isAll ? sorted.filter((s) => !featuredSlugs.includes(s.slug)) : sorted.filter((s) => s.category === filter);
  const n = mods.length;
  const tabletVisible = limited ? Math.min(n, 6) : n;
  const span = 4 - (n % 4); // leftover columns on the last desktop row (4 = a full row)
  const ctaSpan = LG_SPAN[span];
  const ctaWide = span >= 2; // row layout when wide

  const onKey = (e: KeyboardEvent, i: number) => {
    const last = TABS.length - 1;
    const next = e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    setFilter(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  const tabs = (
    <div
      role="tablist"
      aria-label="Filter services"
      className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-white/12 bg-white/6 p-[5px] backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((t, i) => {
        const sel = filter === t.id;
        return (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`sv-tab-${t.id}`}
            aria-selected={sel}
            aria-controls="sv-panel"
            tabIndex={sel ? 0 : -1}
            onClick={() => setFilter(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              mono,
              "inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 text-xs transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-sun-300",
              sel
                ? "bg-[linear-gradient(135deg,var(--color-sun-300),var(--color-sun-500)_50%,var(--color-sun-600))] text-navy-900"
                : "text-ink-glow hover:bg-white/8",
            )}
          >
            {t.label}
            <b className={cn("rounded-full px-[7px] py-[3px] text-[11px] font-medium", sel ? "bg-navy-900/15" : "bg-white/10")}>{counts[t.id]}</b>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <SectionHeader dark id="sv-h" eyebrow={eyebrow} heading={heading} lead={lead} aside={tabs} className="mb-9" />

      <div role="tabpanel" id="sv-panel" aria-labelledby={`sv-tab-${filter}`}>
        {isAll ? featured : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {mods.map((s, i) => {
            const cat = CAT[s.category];
            const hide = limited ? (i >= 6 ? "max-lg:hidden" : i >= 4 ? "max-sm:hidden" : "") : "";
            const lastOdd = i === tabletVisible - 1 && tabletVisible % 2 === 1;
            return (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className={cn(
                  deckCard,
                  "flex min-w-0 items-center gap-3.5 rounded-2xl p-3 sm:flex-col sm:items-stretch sm:gap-4 sm:rounded-[20px] sm:p-5",
                  hide,
                  lastOdd && "sm:max-lg:col-span-2",
                )}
              >
                <span className="contents sm:flex sm:items-center sm:gap-3">
                  <span
                    style={{ "--c": cat.c } as CSSProperties}
                    className="glow-tile order-1 size-[42px] rounded-[14px] sm:size-[46px]"
                  >
                    <Icon name={s.icon} className="size-5 text-navy-950" />
                  </span>
                  <span className={cn(mono, "hidden sm:block", cat.text)}>{cat.label}</span>
                  <GoArrow dark className="order-3 size-9 sm:order-none sm:ml-auto sm:size-[34px]" />
                </span>
                <span className="order-2 flex min-w-0 flex-1 flex-col gap-1.5 sm:order-none sm:flex-none">
                  <span className="font-display text-base font-semibold leading-snug tracking-[-0.01em] sm:text-[17px]">{s.title}</span>
                  <span className="hidden text-sm leading-normal text-ink-soft sm:block">{s.summary}</span>
                </span>
              </Link>
            );
          })}

          <div
            className={cn(
              "flex flex-col justify-between gap-3 rounded-[20px] bg-[linear-gradient(135deg,var(--color-sun-300),var(--color-sun-500)_52%,var(--color-sun-600))] p-[22px] text-navy-900 shadow-[0_24px_50px_-24px_rgb(255_90_31/0.8)]",
              "sm:col-span-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7 sm:gap-y-4",
              ctaSpan,
              ctaWide ? "lg:flex-row lg:flex-wrap lg:items-center" : "lg:flex-col lg:flex-nowrap lg:items-stretch lg:justify-between",
            )}
          >
            <span className="flex items-center gap-3 sm:min-w-[260px] sm:flex-1">
              <MessageCircle className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className="font-display text-lg font-bold leading-snug sm:text-[22px]">{ctaHeading}</span>
            </span>
            <Link href="/contact" className={cn(buttonVariants({ variant: "navy", size: "xl" }), "sm:flex-[0_1_240px]")}>
              {ctaLabel}
            </Link>
          </div>
        </div>

        {limited ? (
          <Link
            href="/services"
            className={cn(buttonVariants({ variant: "line", size: "xl" }), "mt-3.5 w-full border-white/25 bg-transparent text-white hover:bg-white/8 hover:text-white lg:hidden")}
          >
            View all {services.length} services
          </Link>
        ) : null}
      </div>
    </>
  );
}
