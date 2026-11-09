import { Hud } from "@/components/fx";
import type { Brand } from "@/lib/content/types";

/** Infinite CSS marquee of installed brands. */
export function BrandRail({ label, brands }: { label: string; brands: Brand[] }) {
  const item = "whitespace-nowrap pr-14 font-display text-[22px] font-bold text-navy-900 opacity-50 transition-opacity duration-300 hover:opacity-100";
  return (
    <section aria-label={label} className="bg-day-50 pb-[30px] pt-[34px]">
      <div className="container-site flex flex-wrap items-center gap-x-7 gap-y-4">
        <Hud light dot="amber" className="flex-none">
          {label}
        </Hud>
        <div className="group min-w-[240px] flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-[fx-marquee_36s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {brands.map((b) => (
              <span key={b.name} className={item}>
                {b.name}
              </span>
            ))}
            {brands.map((b) => (
              <span key={`dup-${b.name}`} aria-hidden className={item}>
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
