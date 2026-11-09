"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";
import { cn } from "@/lib/utils";

export type SubnavItem = { id: string; label: string };

/** Sticky in-page navigation. Highlights the section currently in view. */
export function SolutionSubnav({ items, cta, ui }: { items: SubnavItem[]; cta: { label: string; href: string }; ui: UiLabels }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Pick the visible section nearest the top of the viewport band.
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav
      aria-label={t(ui, "onThisPage")}
      className="sticky top-[var(--site-top)] z-20 border-b border-line bg-white/90 backdrop-blur-md"
    >
      <div className="container-site flex items-center gap-1 overflow-x-auto py-1.5 font-label text-xs uppercase tracking-[0.12em] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={active === item.id ? "location" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl px-3.5 text-navy-900 transition-colors outline-none hover:bg-sky-500/10 focus-visible:ring-2 focus-visible:ring-sky-600",
              active === item.id && "bg-navy-900 text-white hover:bg-navy-900",
            )}
          >
            {item.label}
          </a>
        ))}
        <Link
          href={cta.href}
          className="ml-auto inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl pl-6 pr-2 text-sun-700 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-sky-600"
        >
          {cta.label} →
        </Link>
      </div>
    </nav>
  );
}
