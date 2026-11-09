"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Fixed header stack: collapses the announcement bar once scrolled, hides on scroll down / shows on scroll up. */
export function HeaderShell({ announcement, children }: { announcement: ReactNode; children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      setScrolled(y > 8);
      if (y < 200) setHidden(false);
      else if (delta > 6) setHidden(true);
      else if (delta < -6) setHidden(false);
      if (Math.abs(delta) > 6 || y < 200) lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-out motion-reduce:transition-none",
        hidden && "-translate-y-full",
      )}
    >
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none",
          scrolled ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden" aria-hidden={scrolled || undefined}>
          {announcement}
        </div>
      </div>
      {children}
    </header>
  );
}
