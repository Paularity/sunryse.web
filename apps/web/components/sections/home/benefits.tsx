import type { CSSProperties } from "react";

import { Icon, TONE } from "@/components/icons";
import type { HomeContent } from "@/lib/content/types";

/** Glass dock overlapping the hero by 64px. */
export function BenefitsDock({ items }: { items: HomeContent["benefits"] }) {
  return (
    <section aria-label="Benefits" className="relative z-[4] -mt-16">
      <div className="container-site">
        <ul
          className="glass grid gap-0 overflow-x-auto rounded-3xl p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(190px, 1fr))` }}
        >
          {items.map((b) => (
            <li
              key={b.title}
              className="flex items-center gap-3.5 rounded-[18px] p-3.5 transition-colors duration-300 hover:bg-white/75 sm:px-[18px] sm:py-4 [&:not(:first-child)]:shadow-[-1px_0_0_rgb(11_31_77/0.08)]"
            >
              <span className="glow-tile size-[46px] rounded-[14px]" style={{ "--c": TONE[b.tone ?? "sun"] } as CSSProperties}>
                <Icon name={b.icon ?? "sun"} className="size-5" />
              </span>
              <span className="font-display text-[15px] font-bold leading-[1.3]">{b.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
