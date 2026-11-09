"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Hud } from "@/components/fx";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/site/logo";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Service, Site, Solution } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const rowClass =
  "flex min-h-14 items-center justify-between gap-3 rounded-2xl px-4 font-display text-lg font-semibold text-navy-900 transition-colors hover:bg-sky-500/10 focus-visible:bg-sky-500/10";
const btnLine =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[14px] border border-navy-900/20 bg-white font-label text-xs uppercase tracking-[0.12em] text-navy-900";

export function MobileMenu({ site, services, solutions }: { site: Site; services: Service[]; solutions: Solution[] }) {
  const [open, setOpen] = useState(false);
  const [solOpen, setSolOpen] = useState(true);
  const close = () => setOpen(false);
  const tel = `tel:${site.phone.replace(/[^\d+]/g, "")}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className="grid size-12 place-items-center rounded-[14px] bg-navy-900 text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
      >
        <Menu className="size-[22px]" aria-hidden />
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 bg-[linear-gradient(180deg,var(--color-sky-200),var(--color-day-50)_40%)] p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>
        <div className="flex items-center justify-between px-4 pt-4">
          <Logo />
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="grid size-12 place-items-center rounded-[14px] bg-navy-900 text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X className="size-[22px]" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 px-4 pt-4">
          <a href={tel} className={btnLine}>
            <Icon name="phone" className="size-[18px]" /> Call
          </a>
          <a href={site.messengerUrl} className={btnLine}>
            <Icon name="message" className="size-[18px]" /> Message
          </a>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-2 py-3">
          {site.nav.map((item) => {
            if (item.menu === "solutions") {
              return (
                <div key={item.href}>
                  <button
                    type="button"
                    aria-expanded={solOpen}
                    onClick={() => setSolOpen((v) => !v)}
                    className={cn(rowClass, "w-full text-left")}
                  >
                    {item.label}
                    <ChevronDown className={cn("size-5 transition-transform", solOpen && "rotate-180")} aria-hidden />
                  </button>
                  {solOpen ? (
                    <ul className="flex flex-col gap-1 px-2 pb-2">
                      {solutions.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={`/solutions/${s.slug}`}
                            onClick={close}
                            className="flex min-h-16 items-center gap-3 rounded-2xl bg-white/70 p-2 pr-4 transition-colors hover:bg-white"
                          >
                            <Image src={s.image.src} alt="" width={48} height={48} className="size-12 shrink-0 rounded-xl object-cover" />
                            <span className="flex min-w-0 flex-col">
                              <b className="font-display text-base font-semibold leading-tight">{s.title}</b>
                              <span className="truncate font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                                {s.tag} · {s.typicalSize}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            }
            return (
              <Link key={item.href} href={item.href} onClick={close} className={rowClass}>
                {item.label}
                {item.menu === "services" ? (
                  <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{services.length}</span>
                ) : item.href === "/calculator" ? (
                  <Hud light dot="amber" className="px-2.5 py-1.5">
                    New
                  </Hud>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2.5 border-t border-navy-900/10 bg-white/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          <Link
            href={site.quoteCta.href}
            onClick={close}
            className="inline-flex min-h-14 items-center justify-center rounded-[14px] bg-sun font-label text-xs uppercase tracking-[0.12em] text-navy-900 shadow-[0_8px_20px_-8px_rgb(255_90_31/0.7)]"
          >
            Get a free quote
          </Link>
          <Hud light className="self-center">
            {site.hours}
          </Hud>
        </div>
      </SheetContent>
    </Sheet>
  );
}
