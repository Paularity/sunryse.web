import type { CSSProperties } from "react";

import { Hud, Section, SectionHeader } from "@/components/fx";
import { TONE, TONE_TEXT } from "@/components/icons";
import type { HomeContent } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/* Travelling light pulse: horizontal track on lg+, vertical timeline below. */
const PULSE_CSS = `
.pr-pulse{position:absolute;left:0;right:0;top:-160px;height:160px;pointer-events:none;background:linear-gradient(180deg,transparent,var(--color-white),transparent);animation:pr-y 3.4s ease-in-out infinite}
@media (min-width:1024px){.pr-pulse{top:0;bottom:0;height:auto;left:-160px;right:auto;width:160px;background:linear-gradient(90deg,transparent,var(--color-white),transparent);animation-name:pr-x}}
@keyframes pr-x{to{left:100%}}
@keyframes pr-y{to{top:100%}}
@media (prefers-reduced-motion:reduce){.pr-pulse{display:none}}
`;

export function ProcessSection({ content }: { content: HomeContent["process"] }) {
  return (
    <Section tone="grid" labelledBy="process-h">
      <style>{PULSE_CSS}</style>
      <SectionHeader
        id="process-h"
        className="mb-12"
        eyebrow={content.eyebrow}
        heading={content.heading}
        aside={<Hud light>{content.chip}</Hud>}
      />

      <ol className="relative grid grid-cols-1 gap-[26px] pl-1 lg:grid-cols-5 lg:gap-4 lg:pl-0">
        <li
          aria-hidden
          className="absolute inset-y-2.5 left-[25px] z-0 w-[3px] overflow-hidden rounded-[3px] bg-[linear-gradient(180deg,var(--color-sun-300),var(--color-sun-500)_30%,var(--color-sky-500)_70%,var(--color-leaf-500))] lg:inset-y-auto lg:inset-x-0 lg:top-6 lg:h-[3px] lg:w-auto lg:bg-[linear-gradient(90deg,var(--color-sun-300),var(--color-sun-500)_30%,var(--color-sky-500)_70%,var(--color-leaf-500))]"
        >
          <i className="pr-pulse" />
        </li>

        {content.steps.map((step, i) => {
          const n = String(i + 1).padStart(2, "0");
          return (
            <li key={step.title} className="relative flex min-w-0 flex-row items-start gap-4 lg:flex-col lg:gap-4">
              <span
                style={{ "--c": TONE[step.tone] } as CSSProperties}
                className="relative z-10 grid size-[50px] shrink-0 place-items-center rounded-full border-2 border-[color:var(--c)] bg-white font-label text-[13px] text-navy-900 shadow-[0_0_0_6px_var(--color-white),0_0_26px_-2px_var(--c)]"
              >
                {n}
              </span>
              <div className="glass-card flex min-w-0 flex-1 flex-col gap-1.5 rounded-[18px] p-[18px] max-sm:border-0! max-sm:bg-none! max-sm:p-0! max-sm:pt-0.5! max-sm:shadow-none! lg:flex-none">
                <span className={cn("font-label text-[11px] uppercase tracking-[0.12em]", TONE_TEXT[step.tone])}>Step {n}</span>
                <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-navy-900">{step.title}</h3>
                <p className="text-[15px] leading-relaxed text-ink-muted">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
