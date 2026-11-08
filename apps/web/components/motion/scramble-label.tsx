"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, useGSAP, MQ_REDUCED } from "@/lib/gsap";

type Props = {
  /** Status lines to cycle through, e.g. "Sizing your system_". */
  lines: string[];
  className?: string;
  /** Seconds each line stays on screen. */
  hold?: number;
};

/** Recipe R02: rotating mono status label with GSAP ScrambleText. */
export function ScrambleLabel({ lines, className, hold = 2.5 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!ref.current || lines.length < 2) return;
      if (window.matchMedia(MQ_REDUCED).matches) return;

      const tl = gsap.timeline({ repeat: -1 });
      lines.forEach((line) => {
        tl.to(ref.current, {
          duration: 0.9,
          scrambleText: { text: line, chars: "01░▒▓_", speed: 0.6 },
          ease: "none",
        }).to({}, { duration: hold });
      });
    },
    { scope: ref, dependencies: [lines.join("|"), hold] },
  );

  return (
    <span ref={ref} className={cn("label", className)} aria-live="off">
      {lines[0]}
    </span>
  );
}
