"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";

import { Hud, Meter, PhotoFrame, SectionHeader } from "@/components/fx";
import { buttonVariants } from "@/components/ui/button";
import type { HomeContent, Solution } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const mono = "font-label uppercase tracking-[0.12em]";

export function SolutionsTabs({ content, solutions }: { content: HomeContent["solutions"]; solutions: Solution[] }) {
  const uid = useId();
  const [idx, setIdx] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const s = solutions[idx];
  if (!s) return null;

  function onKey(e: KeyboardEvent) {
    const n = solutions.length;
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % n;
    else if (e.key === "ArrowLeft") next = (idx - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else return;
    e.preventDefault();
    setIdx(next);
    refs.current[next]?.focus();
  }

  const tabs = (
    <div
      role="tablist"
      aria-label="Choose a property type"
      onKeyDown={onKey}
      className="glass flex max-w-full gap-1 overflow-x-auto rounded-2xl p-[5px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {solutions.map((t, i) => {
        const on = i === idx;
        return (
          <button
            key={t.slug}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${i}`}
            aria-selected={on}
            aria-controls={`${uid}-panel`}
            tabIndex={on ? 0 : -1}
            onClick={() => setIdx(i)}
            className={cn(
              mono,
              "inline-flex min-h-[46px] flex-none items-center gap-2 rounded-xl px-[18px] text-xs transition-[background,color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
              on ? "bg-navy-900 text-white shadow-[0_8px_18px_-8px_rgb(11_31_77/0.6)]" : "text-navy-900 hover:bg-white/70",
            )}
          >
            <span className="opacity-55">{String(i + 1).padStart(2, "0")}</span>
            {t.title}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <SectionHeader eyebrow={content.eyebrow} heading={content.heading} id="solutions-heading" aside={tabs} />
      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${idx}`}
        className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-10"
      >
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Hud light className="self-start">
            {s.tag}
          </Hud>
          <h3 className="font-display text-[clamp(34px,3.4vw,46px)] font-bold leading-[1.02] tracking-[-0.035em]">{s.title}</h3>
          <p className="text-[17px] leading-[1.65] text-ink-muted">{s.summary}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Typical size" value={s.typicalSize} meter={s.sizeMeter} tone="sun" />
            <Stat label={s.metricLabel} value={s.metricValue} meter={s.metricMeter} tone="leaf" valueClass="text-leaf-600" />
          </div>
          <Link href={`/solutions/${s.slug}`} className={cn(buttonVariants({ variant: "navy", size: "xl" }), "self-start")}>
            Explore {s.title}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <PhotoFrame
          className="h-[300px] lg:h-[440px]"
          chips={
            <>
              <Hud>System online</Hud>
              <Hud dot="none">{s.typicalSize}</Hud>
            </>
          }
          caption={<span className={cn(mono, "glass rounded-[10px] px-[11px] py-2 text-[11px]")}>{s.caption}</span>}
        >
          <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width:1024px) 34vw, 100vw" className="object-cover" />
        </PhotoFrame>

        <ol className={cn(mono, "m-0 grid list-none gap-2 p-0 text-xs")}>
          {s.features.map((f, i) => (
            <li key={f} className="box-border flex min-h-11 items-center gap-3 rounded-[14px] border border-navy-900/8 bg-white/80 px-3.5 py-2 text-navy-900">
              <span className="text-[11px] text-sun-700">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1">{f}</span>
              <Check className="size-4 text-sun-500" strokeWidth={1.75} aria-hidden />
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

function Stat({ label, value, meter, tone, valueClass }: { label: string; value: string; meter: number; tone: "sun" | "leaf"; valueClass?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[14px] border border-navy-900/8 bg-white/75 p-3.5 shadow-[inset_0_1px_0_white]">
      <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{label}</span>
      <span className={cn("font-display text-[22px] font-bold leading-[1.15] tracking-[-0.02em]", valueClass)}>{value}</span>
      <Meter value={meter} tone={tone} />
    </div>
  );
}
