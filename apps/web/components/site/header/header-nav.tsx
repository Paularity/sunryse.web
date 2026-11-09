"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { GoArrow } from "@/components/fx";
import { Icon } from "@/components/icons";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { Service, ServiceCategory, Site, Solution, UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";
import { cn } from "@/lib/utils";

import { isActive } from "./is-active";

const itemClass =
  "relative inline-flex min-h-11 h-auto items-center rounded-[10px] px-2 py-0 xl:px-3 font-label text-xs uppercase tracking-[0.12em] text-navy-900 transition-colors hover:bg-sky-500/10 focus:bg-sky-500/10 aria-[current]:bg-sun-500/10 aria-[current]:text-sun-700 aria-[current]:after:absolute aria-[current]:after:inset-x-2 xl:aria-[current]:after:inset-x-3 aria-[current]:after:bottom-1.5 aria-[current]:after:h-0.5 aria-[current]:after:rounded-sm aria-[current]:after:bg-[linear-gradient(90deg,var(--color-sun-300),var(--color-sun-600))] aria-[current]:after:shadow-[0_0_10px_rgb(255_138_0/0.8)] aria-[current]:after:content-['']";

const CATEGORIES: { key: ServiceCategory; labelKey: string; color: string }[] = [
  { key: "systems", labelKey: "categorySystems", color: "var(--color-sky-600)" },
  { key: "installation", labelKey: "categoryInstallation", color: "var(--color-sun-700)" },
  { key: "specialty", labelKey: "categorySpecialty", color: "var(--color-leaf-600)" },
];

/** Panels span the header bar width (container 1320px − 40px gutters), 10px below it, like the design. */
const contentClass =
  "p-0 group-data-[viewport=false]/navigation-menu:mt-2.5 group-data-[viewport=false]/navigation-menu:overflow-visible group-data-[viewport=false]/navigation-menu:rounded-[24px] group-data-[viewport=false]/navigation-menu:bg-transparent group-data-[viewport=false]/navigation-menu:shadow-none group-data-[viewport=false]/navigation-menu:ring-0 md:fixed md:left-1/2 md:top-[calc(var(--site-top)+10px)]! md:mt-0! md:w-[min(1240px,calc(100vw-80px))] md:-translate-x-1/2";

const panelShadow = "shadow-[inset_0_1px_0_white,0_30px_70px_-24px_rgb(11_31_77/0.5)]";

export function HeaderNav({ site, services, solutions }: { site: Site; services: Service[]; solutions: Solution[] }) {
  const pathname = usePathname();
  const [value, setValue] = useState("");
  const close = () => setValue("");
  const servicesHref = site.nav.find((n) => n.menu === "services")?.href ?? "/";

  return (
    <NavigationMenu
      viewport={false}
      value={value}
      onValueChange={setValue}
      aria-label={t(site.ui, "mainNavigation")}
      className="static hidden max-w-none flex-none lg:flex"
    >
      <NavigationMenuList className="gap-1">
        {site.nav.map((item) => {
          const active = isActive(pathname, item.href);
          if (!item.menu) {
            return (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild className={itemClass}>
                  <Link href={item.href} aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }
          return (
            <NavigationMenuItem key={item.href} value={item.menu} className="static">
              <NavigationMenuTrigger className={cn(itemClass, "gap-0")} aria-current={active ? "page" : undefined}>
                {item.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent className={contentClass}>
                {item.menu === "services" ? (
                  <ServicesPanel ui={site.ui} services={services} allHref={servicesHref} onNavigate={close} />
                ) : (
                  <SolutionsPanel solutions={solutions} onNavigate={close} />
                )}
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ServicesPanel({
  ui,
  services,
  allHref,
  onNavigate,
}: {
  ui: UiLabels;
  services: Service[];
  allHref: string;
  onNavigate: () => void;
}) {
  return (
    <div className={cn("grid grid-cols-[1fr_1fr_1fr_340px] gap-2 rounded-[24px] border border-white bg-white/95 p-[22px] backdrop-blur-xl", panelShadow)}>
      {CATEGORIES.map((cat) => {
        const items = services.filter((s) => s.category === cat.key).sort((a, b) => a.order - b.order);
        return (
          <div key={cat.key} className="flex min-w-0 flex-col gap-0.5 p-1.5">
            <span
              className="flex items-center gap-2 px-3 pb-2.5 pt-1.5 font-label text-[11px] uppercase tracking-[0.12em]"
              style={{ color: cat.color }}
            >
              <i className="block size-2 rounded-full" style={{ background: cat.color, boxShadow: `0 0 10px ${cat.color}` }} />
              {t(ui, cat.labelKey)} · {items.length}
            </span>
            {items.map((s) => (
              <NavigationMenuLink
                key={s.slug}
                asChild
                className="flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 hover:bg-sky-500/10 focus:bg-sky-500/10"
              >
                <Link href={`/services/${s.slug}`} onClick={onNavigate}>
                  <b className="font-display text-[15px] font-semibold leading-tight">{s.title}</b>
                  <span className="line-clamp-1 text-[13px] leading-snug text-ink-muted">{s.summary}</span>
                </Link>
              </NavigationMenuLink>
            ))}
          </div>
        );
      })}
      <div className="flex flex-col gap-2.5">
        <Link
          href="/calculator"
          onClick={onNavigate}
          className="glass-card fx-lift flex flex-col gap-2.5 rounded-[18px] bg-[linear-gradient(150deg,var(--color-dawn-50),var(--color-dawn-100))] p-5"
        >
          <span className="fx-eb font-label text-[11px] uppercase tracking-[0.12em] text-sun-700">{t(ui, "megaCalcLabel")}</span>
          <b className="font-display text-xl leading-tight">{t(ui, "megaCalcHeading")}</b>
          <span className="inline-flex items-center gap-1.5 font-label text-[11px] uppercase tracking-[0.12em] text-sky-600">
            {t(ui, "megaCalcLink")} <Icon name="zap" className="size-3.5" />
          </span>
        </Link>
        <Link href="/contact" onClick={onNavigate} className="fx-screen flex flex-col gap-2.5 rounded-[18px] p-5">
          <span className="font-label text-[11px] uppercase tracking-[0.12em] text-sun-300">{t(ui, "megaAdvisorLabel")}</span>
          <b className="font-display text-lg leading-tight text-white">{t(ui, "megaAdvisorHeading")}</b>
          <span className="flex items-center gap-2 text-sm text-white/85">
            <Icon name="message" className="size-4" /> {t(ui, "megaAdvisorChannels")}
          </span>
        </Link>
        <Link
          href={allHref}
          onClick={onNavigate}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-navy-900/20 bg-white px-4 font-label text-xs uppercase tracking-[0.12em] hover:border-navy-900/40"
        >
          {t(ui, "viewAllServices", { count: services.length })}
        </Link>
      </div>
    </div>
  );
}

function SolutionsPanel({ solutions, onNavigate }: { solutions: Solution[]; onNavigate: () => void }) {
  return (
    <div className={cn("grid grid-cols-3 gap-3.5 rounded-[24px] border border-white bg-white/95 p-[22px] backdrop-blur-xl", panelShadow)}>
      {solutions.map((s) => (
        <NavigationMenuLink key={s.slug} asChild className="group relative block min-h-[220px] overflow-hidden rounded-[18px] p-0">
          <Link href={`/solutions/${s.slug}`} onClick={onNavigate}>
            <Image
              src={s.image.src}
              alt={s.image.alt}
              fill
              sizes="300px"
              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
            />
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,rgb(7_20_51/0.88))]" />
            <span className="relative flex h-full min-h-[220px] flex-col justify-end gap-1 p-5 text-white">
              <span className="font-label text-[11px] uppercase tracking-[0.12em] text-sun-300">{s.tag}</span>
              <b className="font-display text-xl leading-tight">{s.title}</b>
              <span className="flex items-center justify-between font-label text-[11px] uppercase tracking-[0.12em] text-white/85">
                {s.typicalSize}
                <GoArrow dark />
              </span>
            </span>
          </Link>
        </NavigationMenuLink>
      ))}
    </div>
  );
}
