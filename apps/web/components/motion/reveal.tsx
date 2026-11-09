"use client";

import { useRef, type ReactNode } from "react";

import { gsap, useGSAP, MQ_FULL, MQ_LITE } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Fade/rise children into view on scroll. Direct children with [data-reveal] stagger.
 * Reduced motion: renders in final state (no animation is registered).
 */
export function Reveal({ children, className, stagger = 0.08, as: Tag = "div" }: { children: ReactNode; className?: string; stagger?: number; as?: "div" | "ul" | "ol" }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const run = (distance: number) => {
        const items = ref.current?.querySelectorAll<HTMLElement>("[data-reveal]");
        const targets = items && items.length ? items : ref.current;
        if (!targets) return;
        gsap.from(targets, {
          autoAlpha: 0,
          y: distance,
          duration: 0.8,
          ease: "power3.out",
          stagger,
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        });
      };
      mm.add(MQ_FULL, () => run(28));
      mm.add(MQ_LITE, () => run(16));
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref as never} className={cn(className)}>
      {children}
    </Tag>
  );
}
