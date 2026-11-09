"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useId, useState } from "react";

import { Hud } from "@/components/fx";
import { cn } from "@/lib/utils";
import type { Project, SolutionSlug } from "@/lib/content/types";

type Filter = "all" | SolutionSlug;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "industrial", label: "Industrial" },
];
const SEG_TEXT: Record<SolutionSlug, string> = {
  residential: "text-sun-700",
  commercial: "text-sky-600",
  industrial: "text-leaf-600",
};

export function ProjectBrowser({ projects, total, allLabel, allNote }: { projects: Project[]; total: string; allLabel: string; allNote: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const id = useId();
  const shown = filter === "all" ? projects : projects.filter((p) => p.segment === filter);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Filter projects"
          className="font-label flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-navy-900/10 bg-white p-1.5 text-xs uppercase tracking-[0.12em] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                onClick={() => setFilter(f.id)}
                className={cn(
                  "min-h-11 flex-none rounded-xl px-4 uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
                  on ? "bg-navy-900 text-white" : "bg-transparent text-navy-900 hover:bg-day-100",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted" aria-live="polite">
          Showing {shown.length} of {total}
        </span>
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${filter}`}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {shown.map((p) => (
          <Link
            key={p.slug}
            href="/contact"
            className="glass-card fx-lift group flex min-w-0 flex-col overflow-hidden rounded-[22px] text-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            <div className="relative h-56 sm:h-60">
              <Image src={p.image.src} alt={p.image.alt} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
              <Hud light dot="none" className={cn("absolute left-3 top-3 capitalize", SEG_TEXT[p.segment])}>
                {p.segment}
              </Hud>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{p.completed}</span>
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">{p.title}</h3>
              <p className="text-sm text-ink-muted">{p.location}</p>
              <dl className="font-label mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-navy-900/10 pt-3 text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                <div><dt className="sr-only">Size</dt><dd>{p.sizeKwp}</dd></div>
                <div><dt className="sr-only">System</dt><dd>{p.system}</dd></div>
              </dl>
            </div>
          </Link>
        ))}

        <Link
          href="/contact"
          className="fx-dark group flex min-h-56 flex-col justify-between gap-6 rounded-[22px] p-6 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          <span className="font-label text-[11px] uppercase tracking-[0.12em] text-sun-300">{allNote}</span>
          <span className="flex items-center justify-between gap-4">
            <span className="font-display text-2xl font-bold tracking-[-0.03em]">{allLabel}</span>
            <span aria-hidden className="grid size-11 place-items-center rounded-full border border-white/20 transition-transform group-hover:-rotate-45">
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
