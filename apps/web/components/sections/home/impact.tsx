import type { CSSProperties } from "react";

import { Eyebrow, Section } from "@/components/fx";
import { Icon, TONE } from "@/components/icons";
import type { HomeContent, ImpactStat } from "@/lib/content/types";

export function ImpactBand({ content, stats }: { content: HomeContent["impact"]; stats: ImpactStat[] }) {
  return (
    <Section tone="dark" className="!py-20">
      <div className="flex flex-col gap-8">
        <Eyebrow dark>{content.eyebrow}</Eyebrow>
        <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <li key={s.label} className="glass-dark flex min-w-0 items-center gap-4 rounded-[20px] p-5">
              <span
                className="relative grid size-14 flex-none place-items-center rounded-full bg-white/5 text-[var(--c)]"
                style={{ "--c": TONE[s.tone] } as CSSProperties}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full p-0.5 motion-safe:animate-[fx-spin_6s_linear_infinite]"
                  style={{
                    background: "conic-gradient(from 0deg, var(--c), transparent 75%)",
                    WebkitMask: "linear-gradient(black 0 0) content-box, linear-gradient(black 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
                <Icon name={s.icon} className="size-6" />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-display text-[clamp(32px,3.4vw,46px)] font-bold leading-none tracking-[-0.04em] text-white">{s.value}</span>
                <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-soft">{s.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
