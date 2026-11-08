"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";

// Register once, client-side only. Import gsap helpers from here, never from "gsap" directly.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP);
}

/** Desktop + motion allowed: pins, scrubs, horizontal scroll. */
export const MQ_FULL = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
/** Small screens with motion allowed: simple fades/translates only. */
export const MQ_LITE = "(max-width: 1023px) and (prefers-reduced-motion: no-preference)";
/** Reduced motion: no animation, final states only. */
export const MQ_REDUCED = "(prefers-reduced-motion: reduce)";

export { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP };
