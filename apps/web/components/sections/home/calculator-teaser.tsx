import { Eyebrow, Hud, RichText, Section, h2Class } from "@/components/fx";
import type { CalculatorConfig, HomeContent, UiLabels } from "@/lib/content/types";

import { CalculatorTeaserLive } from "./calculator-teaser-live";

export function CalculatorTeaser({
  content,
  config,
  ui,
}: {
  content: HomeContent["calculator"];
  config: CalculatorConfig;
  ui: UiLabels;
}) {
  return (
    <Section id="calc" tone="dawn" labelledBy="calc-h" className="overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(194_65_12/0.12)_1px,transparent_1.4px)] [mask-image:linear-gradient(90deg,black,transparent_70%)] [background-size:22px_22px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-44 size-[620px] rounded-full bg-[radial-gradient(circle,rgb(255_201_60/0.55),rgb(255_138_0/0.18)_45%,transparent_70%)]"
      />
      <CalculatorTeaserLive
        config={config}
        ctaLabel={content.ctaLabel}
        ui={ui}
        intro={
          <>
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2 id="calc-h" className={h2Class}>
              <RichText text={content.heading} />
            </h2>
            <p className="max-w-[480px] text-[17px] leading-relaxed text-ink-muted">{content.lead}</p>
          </>
        }
        chips={
          <div className="flex flex-wrap gap-2">
            {content.chips.map((c) => (
              <Hud key={c} light dot="none">
                {c}
              </Hud>
            ))}
          </div>
        }
      />
    </Section>
  );
}
