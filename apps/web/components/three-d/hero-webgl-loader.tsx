"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

const HeroWebgl = dynamic(() => import("./hero-webgl"), { ssr: false });

const MQ = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

/**
 * Upgrades the CSS-3D hero to WebGL on capable desktops, after the page is idle.
 * Phones, reduced motion, save-data, low-memory devices and browsers without WebGL2 keep the CSS scene.
 * Once the canvas has painted, the parent gets data-webgl="ready" and the CSS scene fades out.
 */
export function HeroWebglLoader({
  pins,
  className,
}: {
  pins: { panels: ReactNode; battery: ReactNode; grid: ReactNode };
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MQ);
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const capable = () => {
      if (!mq.matches || nav.connection?.saveData || (nav.deviceMemory ?? 8) < 4) return false;
      try {
        return !!document.createElement("canvas").getContext("webgl2");
      } catch {
        return false;
      }
    };
    let idle = 0;
    const schedule = () => {
      if (!capable()) return;
      const ric = typeof window.requestIdleCallback === "function";
      idle = ric
        ? window.requestIdleCallback(() => setOn(true), { timeout: 2500 })
        : window.setTimeout(() => setOn(true), 1200);
    };
    const onChange = () => {
      if (mq.matches) schedule();
      else {
        setOn(false);
        ref.current?.parentElement?.removeAttribute("data-webgl");
      }
    };
    schedule();
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className={className}>
      {on ? (
        <HeroWebgl pins={pins} onReady={() => ref.current?.parentElement?.setAttribute("data-webgl", "ready")} />
      ) : null}
    </div>
  );
}
