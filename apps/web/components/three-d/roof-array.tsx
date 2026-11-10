import { Hud } from "@/components/fx";
import { cn } from "@/lib/utils";

import { Panels, Scene } from "./models";

/**
 * A tilted roof plate with `count` lit panels — used where the panel count follows the user's bill.
 * Pure markup (works in server and client components). Shows up to 40 panels.
 */
export function RoofArray({
  count,
  label,
  ariaLabel,
  hint,
  sun,
  className,
  scale = "scale-[0.6] sm:scale-[0.78]",
}: {
  count: number;
  label: string;
  ariaLabel: string;
  hint?: string;
  sun?: boolean;
  className?: string;
  scale?: string;
}) {
  const n = Math.max(1, Math.min(40, count));
  const cols = Math.min(8, Math.max(2, Math.ceil(Math.sqrt(n * 1.6))));
  const rows = Math.ceil(n / cols);
  const cell = 46;
  const w = cols * cell;
  const h = rows * 66;
  // Shrink large arrays so they always fit the frame.
  const fit = Math.min(1, 340 / w, 200 / h);
  return (
    <div className={cn("relative overflow-hidden", className)} role="img" aria-label={ariaLabel}>
      <Scene
        ground={false}
        className="absolute inset-0"
        worldClassName={cn(scale, "[animation-duration:10s]")}
        sun={sun ? <div className="d3-sun size-16 sm:size-[84px]" /> : undefined}
      >
        <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${fit})` }}>
          <div className="d3-shadow" style={{ left: -w / 2 - 40, top: -h / 2 - 20, width: w + 80, height: h + 60 }} />
          <div
            className="m-roof"
            style={{
              position: "absolute",
              left: -w / 2 - 14,
              top: -h / 2 - 14,
              width: w + 28,
              height: h + 28,
              borderRadius: 10,
              transform: "translateZ(14px)",
            }}
          />
          <div style={{ position: "absolute", left: -w / 2, top: -h / 2, transform: "translateZ(18px)" }}>
            {/* key remounts the grid so new panels drop in with the stagger */}
            <Panels key={n} cols={cols} rows={rows} w={w} h={h} className="d3-panels-grow" count={n} />
          </div>
        </div>
      </Scene>
      <Hud dot="amber" className="absolute bottom-3.5 left-3.5 z-[2]">
        {label}
      </Hud>
      {hint ? (
        <span className="absolute top-3.5 right-3.5 z-[2] hidden rounded-[10px] px-2.5 py-[7px] font-label text-[11px] tracking-[0.12em] text-navy-900 uppercase glass sm:block">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
