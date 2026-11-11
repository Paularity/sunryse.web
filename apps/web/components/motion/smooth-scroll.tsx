"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

let active: Lenis | null = null;

/**
 * Scroll to a position or element through Lenis when it runs (a plain window.scrollTo gets
 * overridden by its smoothing), else natively. Reduced motion jumps straight there.
 */
export function scrollToTarget(target: number | HTMLElement, offset = 0) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Exact page position (element scroll-margins and html scroll-padding would otherwise shift it).
  const top = (typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY) + offset;
  if (active) active.scrollTo(top, { immediate: reduced, duration: 1.4 });
  else window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
}

/**
 * Lenis smooth scrolling synced with GSAP ScrollTrigger (ChainGPT-style).
 * Disabled for users who prefer reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    active = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      active = null;
    };
  }, []);

  return null;
}
