import { Eyebrow, Hud, RichText, Section, h2Class } from "@/components/fx";
import type { CalculatorConfig, HomeContent } from "@/lib/content/types";

import { CalculatorConsole } from "./calculator-teaser-console";

export function CalculatorTeaser({ content, config }: { content: HomeContent["calculator"]; config: CalculatorConfig }) {
  return (
    <Section id="calc" tone="dawn" labelledBy="calc-h" className="overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(194_65_12/0.12)_1px,transparent_1.4px)] [background-size:22px_22px] [mask-image:linear-gradient(90deg,#000,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-44 -top-40 size-[620px] rounded-full bg-[radial-gradient(circle,rgb(255_201_60/0.55),rgb(255_138_0/0.18)_45%,transparent_70%)]"
      />
      <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 id="calc-h" className={h2Class}>
            <RichText text={content.heading} />
          </h2>
          <p className="max-w-[480px] text-[17px] leading-relaxed text-ink-muted">{content.lead}</p>
          <div className="flex flex-wrap gap-2">
            {content.chips.map((c) => (
              <Hud key={c} light dot="none">
                {c}
              </Hud>
            ))}
          </div>
        </div>
        <div className="corners min-w-0 p-2.5">
          <CalculatorConsole config={config} ctaLabel={content.ctaLabel} />
        </div>
      </div>
    </Section>
  );
}
