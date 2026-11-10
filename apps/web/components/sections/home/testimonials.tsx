import { SectionHeader, Stars } from "@/components/fx";
import { TONE } from "@/components/icons";
import type { HomeContent, Testimonial } from "@/lib/content/types";

export function TestimonialsSection({
  content,
  testimonials,
}: {
  content: HomeContent["testimonials"];
  testimonials: Testimonial[];
}) {
  return (
    <section aria-labelledby="testimonials-h" className="relative bg-white py-[clamp(64px,9vw,112px)]">
      <div className="container-site">
        <SectionHeader
          id="testimonials-h"
          eyebrow={content.eyebrow}
          heading={content.heading}
          aside={
            <div className="flex items-center gap-3.5 rounded-[18px] px-4 py-3 glass">
              <span className="font-display text-4xl font-bold tracking-[-0.03em]">{content.rating}</span>
              <span className="flex flex-col gap-1.5">
                <Stars rating={5} />
                <span className="font-label text-[11px] tracking-[0.12em] text-ink-muted uppercase">
                  {content.reviewsLabel}
                </span>
              </span>
            </div>
          }
        />
        {/* shared gradient for the quote marks */}
        <svg width="0" height="0" aria-hidden className="absolute">
          <defs>
            <linearGradient id="quote-mark-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: "var(--color-sun-300)" }} />
              <stop offset="1" style={{ stopColor: "var(--color-sun-600)" }} />
            </linearGradient>
          </defs>
        </svg>
        <div className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-3 sm:-mx-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {testimonials.map((t, i) => (
            <figure
              key={`${i}-${t.name}`}
              className="d3-tilt sr-tilt fx-ring relative m-0 flex min-h-[320px] w-[84%] shrink-0 snap-start flex-col gap-[18px] rounded-[22px] p-[26px] glass-card sm:w-[72%] lg:min-h-0 lg:w-auto"
            >
              <span
                aria-hidden
                className="absolute inset-x-6 top-0 h-0.5 rounded bg-[linear-gradient(90deg,var(--color-sun-300),var(--color-sun-600),transparent)]"
              />
              <div className="flex items-center justify-between">
                <Stars rating={t.rating} />
                <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="url(#quote-mark-grad)"
                    d="M3 21c3 0 7-1 7-8V5H3v7h4c0 4-2 5-4 5zm11 0c3 0 7-1 7-8V5h-7v7h4c0 4-2 5-4 5z"
                  />
                </svg>
              </div>
              <blockquote className="m-0 text-[17px] leading-relaxed text-navy-900">{t.quote}</blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-navy-900/10 pt-4">
                <span
                  className="glow-tile size-11 rounded-full font-display text-lg font-bold ring-2 ring-white"
                  style={{ ["--c" as string]: TONE[t.tone] }}
                  aria-hidden
                >
                  {t.initial}
                </span>
                <span className="min-w-0">
                  <b className="block font-display">{t.name}</b>
                  <span className="font-label text-[11px] tracking-[0.1em] text-ink-muted uppercase">
                    {t.roleLocation}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
