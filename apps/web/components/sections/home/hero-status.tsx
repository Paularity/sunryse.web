"use client";

import { ScrambleLabel } from "@/components/motion/scramble-label";

/** Status text (scramble) followed by a blinking caret. */
export function HeroStatus({ status }: { status: string }) {
  return (
    <>
      <ScrambleLabel lines={[status]} className="text-[11px]" />
      <span aria-hidden className="animate-[fx-blink_1s_steps(1)_infinite]">_</span>
    </>
  );
}
