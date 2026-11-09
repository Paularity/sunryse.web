"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";
import type { Project, SolutionSlug, UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";

type Filter = "all" | SolutionSlug;
const PAGE_SIZE = 6;
const MONO = "font-label uppercase tracking-[0.12em]";
const FILTERS: { id: Filter; labelKey: string }[] = [
  { id: "all", labelKey: "filterAll" },
  { id: "residential", labelKey: "segmentResidential" },
  { id: "commercial", labelKey: "segmentCommercial" },
  { id: "industrial", labelKey: "segmentIndustrial" },
];
const SEG_TEXT: Record<SolutionSlug, string> = {
  residential: "text-sun-700",
  commercial: "text-sky-600",
  industrial: "text-leaf-600",
};

type Props = {
  projects: Project[];
  total: string;
  cardStats: { text: string; tone: "muted" | "leaf" }[];
  ui: UiLabels;
};

export function ProjectBrowser({ projects, total, cardStats, ui }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [count, setCount] = useState(PAGE_SIZE);
  const id = useId();
  const matching = filter === "all" ? projects : projects.filter((p) => p.segment === filter);
  const shown = matching.slice(0, count);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label={t(ui, "filterProjects")}
          className={cn(MONO, "flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-navy-900/10 bg-white p-[5px] text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden")}
        >
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                id={`${id}-${f.id}`}
                aria-selected={on}
                aria-controls={`${id}-panel`}
                onClick={() => {
                  setFilter(f.id);
                  setCount(PAGE_SIZE);
                }}
                className={cn(
                  "min-h-11 flex-none rounded-xl px-4 uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
                  on ? "bg-navy-900 text-white" : "bg-transparent text-navy-900 hover:bg-day-100",
                )}
              >
                {t(ui, f.labelKey)}
              </button>
            );
          })}
        </div>
        <span className={cn(MONO, "text-[11px] text-ink-muted")} aria-live="polite">
          {t(ui, "showingOf", { shown: shown.length, total })}
        </span>
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${filter}`}
        className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-[18px]"
      >
        {shown.map((p) => (
          <Link
            key={p.slug}
            href="/contact"
            className="glass-card fx-lift group flex min-w-0 flex-col overflow-hidden rounded-[22px] text-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            <div className="relative h-[240px]">
              <Image src={p.image.src} alt={p.image.alt} fill sizes="(min-width:1001px) 33vw, (min-width:641px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-col gap-3 p-5">
              <span className={cn(MONO, "flex justify-between text-[11px]")}>
                <span className={SEG_TEXT[p.segment]}>{t(ui, `segment${p.segment.charAt(0).toUpperCase()}${p.segment.slice(1)}`)}</span>
                <span className="text-ink-muted">{p.completed}</span>
              </span>
              <h3 className="font-display m-0 text-xl font-bold tracking-normal">{p.title}</h3>
              <div className={cn(MONO, "flex flex-wrap gap-4 border-t border-navy-900/[.08] pt-3 text-[11px] text-ink-muted")}>
                {cardStats.map((s) => (
                  <span key={s.text} className={s.tone === "leaf" ? "text-leaf-600" : undefined}>
                    {s.text}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {matching.length > shown.length ? (
        <div className="mt-9 flex justify-center">
          <button
            type="button"
            onClick={() => setCount((c) => c + PAGE_SIZE)}
            className={cn(MONO, "rounded-[14px] border border-navy-900/[.18] bg-white px-[26px] py-[17px] text-xs text-navy-900 transition-colors hover:border-sky-500")}
          >
            {t(ui, "loadMoreProjects")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
