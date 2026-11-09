import { Eyebrow, Hud, Section, RichText, h2Class } from "@/components/fx";
import { Icon, TONE } from "@/components/icons";
import type { HomeContent, Warranty } from "@/lib/content/types";

export function WhySection({ content, warranty }: { content: HomeContent["why"]; warranty: Warranty[] }) {
  return (
    <Section tone="grid" labelledBy="why-h">
      <div className="grid items-start gap-14 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 id="why-h" className={h2Class}>
            <RichText text={content.heading} />
          </h2>
          <ul className="mt-2 grid list-none gap-3 p-0 sm:grid-cols-2">
            {content.items.map((w) => (
              <li key={w.title} className="glass-card fx-lift fx-ring flex min-w-0 gap-3.5 rounded-[18px] p-5">
                <span className="glow-tile size-11 rounded-xl" style={{ ["--c" as string]: TONE[w.tone ?? "sun"] }}>
                  <Icon name={w.icon ?? "sun"} />
                </span>
                <span className="min-w-0">
                  <b className="mb-1 block font-display text-[17px]">{w.title}</b>
                  <span className="text-sm leading-normal text-ink-muted">{w.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="fx-screen rounded-3xl p-6 sm:p-7">
          <Hud>{content.warrantyLabel}</Hud>
          <dl className="m-0 mt-3.5">
            {warranty.map((w) => (
              <div key={w.item} className="flex items-baseline gap-2.5 border-b border-white/10 py-3.5">
                <dt className="min-w-0 font-semibold">{w.item}</dt>
                <span aria-hidden className="mb-1 min-w-4 flex-1 self-end border-b border-dotted border-white/30" />
                <dd className="m-0 shrink-0 font-label text-[13px] text-sun-500">{w.years}</dd>
              </div>
            ))}
          </dl>
          <span className="mt-4 block font-label text-[11px] uppercase tracking-[0.1em] text-ink-soft">{content.warrantyNote}</span>
        </div>
      </div>
    </Section>
  );
}
