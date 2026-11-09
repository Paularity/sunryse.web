import { ArrowRight, Star } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ───────────────────────────── Rich text ─────────────────────────────
 * `*word*` → glowing frame · `~word~` → sun gradient · `^word^` → sky gradient.
 * Markers may nest one level, e.g. `*~sun.~*`.
 */
const MARKS: Record<string, string> = { "*": "hl", "~": "text-sun", "^": "text-sky" };

export function RichText({ text, className }: { text: string; className?: string }) {
  return <span className={className}>{parse(text)}</span>;
}

function parse(text: string, depth = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /([*~^])(.+?)\1/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const cls = MARKS[m[1]];
    out.push(
      <span key={`${depth}-${m.index}`} className={cls}>
        {depth < 1 ? parse(m[2], depth + 1) : m[2]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* ───────────────────────────── Layout ───────────────────────────── */
type SectionProps = {
  id?: string;
  className?: string;
  /** "light" (default), "tint" (day-100), "white", "grid" (blueprint dots), "dawn" (warm), "dark" (energy band) */
  tone?: "light" | "tint" | "white" | "grid" | "dawn" | "dark";
  children: ReactNode;
  labelledBy?: string;
};

const TONES: Record<NonNullable<SectionProps["tone"]>, string> = {
  light: "bg-day-50",
  tint: "bg-day-100",
  white: "bg-white",
  grid: "bg-white fx-grid",
  dawn: "bg-[linear-gradient(180deg,var(--color-dawn-50),var(--color-dawn-100))]",
  dark: "fx-dark",
};

/** Standard section: brand padding clamp(64px, 9vw, 112px) + site container. */
export function Section({ id, className, tone = "light", children, labelledBy }: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative py-[clamp(64px,9vw,112px)]", TONES[tone], className)}>
      <div className="container-site relative">{children}</div>
    </section>
  );
}

/** Mono eyebrow with pulsing dot. Orange on light, amber on dark. */
export function Eyebrow({ children, dark, className }: { children: ReactNode; dark?: boolean; className?: string }) {
  return <span className={cn("fx-eb", dark ? "text-sun-300" : "text-sun-700", className)}>{children}</span>;
}

export const h2Class = "font-display text-[clamp(32px,4.2vw,58px)] font-bold leading-[1.04] tracking-[-0.04em] text-balance";

/** Eyebrow + H2 (rich text) + optional lead, with an optional right-hand slot (tabs, chip, button). */
export function SectionHeader({
  eyebrow, heading, lead, aside, dark, id, className,
}: { eyebrow: string; heading: string; lead?: string; aside?: ReactNode; dark?: boolean; id?: string; className?: string }) {
  return (
    <div className={cn("mb-9 flex flex-wrap items-end justify-between gap-x-10 gap-y-6", className)}>
      <div className="flex max-w-[680px] flex-col gap-4">
        <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
        <h2 id={id} className={cn(h2Class, dark && "text-white")}>
          <RichText text={heading} />
        </h2>
        {lead ? <p className={cn("max-w-[540px] text-[17px] leading-relaxed", dark ? "text-ink-soft" : "text-ink-muted")}>{lead}</p> : null}
      </div>
      {aside}
    </div>
  );
}

/* ───────────────────────────── Small parts ───────────────────────────── */
/** Status chip with live dot. `light` for light backgrounds. */
export function Hud({ children, light, dot = "green", className }: { children: ReactNode; light?: boolean; dot?: "green" | "amber" | "none"; className?: string }) {
  return (
    <span className={cn("fx-hud", light && "fx-hud-light", className)}>
      {dot !== "none" ? <span className={cn("fx-dot", dot === "amber" && "fx-dot-amber")} /> : null}
      {children}
    </span>
  );
}

/** Thin glowing meter (decorative). */
export function Meter({ value, tone = "sun" }: { value: number; tone?: "sun" | "leaf" | "sky" }) {
  const fill = {
    sun: "bg-[linear-gradient(90deg,var(--color-sun-300),var(--color-sun-600))] shadow-[0_0_10px_rgb(255_138_0/0.7)]",
    leaf: "bg-[linear-gradient(90deg,var(--color-glow-leaf),var(--color-leaf-600))] shadow-[0_0_10px_rgb(45_184_76/0.6)]",
    sky: "bg-[linear-gradient(90deg,var(--color-sky-400),var(--color-sky-600))] shadow-[0_0_10px_rgb(30_111_232/0.6)]",
  }[tone];
  return (
    <span className="block h-1 overflow-hidden rounded bg-navy-900/8" aria-hidden>
      <i className={cn("block h-full rounded", fill)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  );
}

/** Round arrow button used as the "go" affordance on cards. Rotates on group hover. */
export function GoArrow({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full border transition-[transform,background,color,border-color] duration-300 group-hover:-rotate-45",
        dark
          ? "border-white/20 text-white group-hover:border-transparent group-hover:bg-[linear-gradient(135deg,var(--color-sun-300),var(--color-sun-500)_50%,var(--color-sun-600))] group-hover:text-navy-900"
          : "border-navy-900/15 text-navy-900 group-hover:border-transparent group-hover:bg-navy-900 group-hover:text-white",
        className,
      )}
    >
      <ArrowRight className="size-4" strokeWidth={1.75} />
    </span>
  );
}

export function Stars({ rating = 5, label }: { rating?: number; label?: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={label ?? `Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} aria-hidden className={cn("size-4 drop-shadow-[0_0_4px_rgb(255_178_26/0.5)]", i < rating ? "fill-sun-300 text-sun-300" : "text-navy-900/20")} strokeWidth={1.5} />
      ))}
    </span>
  );
}

/**
 * Photo frame with orange corner brackets, scan line and optional HUD chips.
 * Pass a next/image (fill) as children.
 */
export function PhotoFrame({ children, className, chips, caption }: { children: ReactNode; className?: string; chips?: ReactNode; caption?: ReactNode }) {
  return (
    <div className={cn("corners relative p-2", className)}>
      <div className="relative size-full overflow-hidden rounded-[18px]">
        {children}
        <span className="fx-scan" aria-hidden />
        {chips ? <div className="absolute inset-x-3.5 top-3.5 z-[1] flex flex-wrap justify-between gap-2">{chips}</div> : null}
        {caption ? <div className="absolute bottom-3.5 left-3.5 z-[1]">{caption}</div> : null}
      </div>
    </div>
  );
}
