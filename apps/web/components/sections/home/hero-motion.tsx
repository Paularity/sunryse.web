"use client";

import { useRef, type ReactNode } from "react";

import { gsap, MQ_FULL, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Scroll camera for the 3D hero (desktop, motion allowed): as the hero scrolls away the camera
 * dollies in and orbits, and the sun climbs its arc. Phones and reduced motion keep the resting pose.
 */
export function HeroMotion({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_FULL, () => {
        const root = ref.current;
        const cam = root?.querySelector<HTMLElement>("[data-d3-cam]");
        const sun = root?.querySelector<HTMLElement>("[data-d3-sun]");
        if (!root || !cam) return;
        const section = root.closest("section") ?? root;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.6 },
        });
        tl.to(cam, { y: -40, rotationX: -14, rotationZ: -10, scale: 1.12 }, 0);
        if (sun) {
          // The sun's idle arc is a CSS animation; hand it to the scroll instead.
          gsap.set(sun, { animation: "none", offsetDistance: "30%" });
          tl.to(sun, { offsetDistance: "78%" }, 0);
        }
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
