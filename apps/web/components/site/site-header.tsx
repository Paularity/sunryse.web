import Link from "next/link";

import { Icon } from "@/components/icons";
import { Logo } from "@/components/site/logo";
import type { Service, Site, Solution } from "@/lib/content/types";
import { t } from "@/lib/content/ui";

import { HeaderNav } from "./header/header-nav";
import { HeaderShell } from "./header/header-shell";
import { MobileMenu } from "./header/mobile-menu";

/** Fixed header stack: announcement bar (40) + glass bar (16 + 68) = var(--site-top) 124px. */
export function SiteHeader({ site, services, solutions }: { site: Site; services: Service[]; solutions: Solution[] }) {
  const tel = `tel:${site.phone.replace(/[^\d+]/g, "")}`;
  const { announcement, ui } = site;

  return (
    <HeaderShell
      announcement={
        <div className="flex h-10 items-center justify-center gap-3 bg-navy-900 px-4 font-label text-xs text-white">
          <span className="fx-dot fx-dot-amber" aria-hidden />
          <span className="truncate">
            {announcement.text}
            <span className="hidden sm:inline"> · {announcement.longText}</span>
          </span>
          <Link
            href={announcement.link.href}
            className="-my-2 inline-flex min-h-11 shrink-0 items-center text-sun-300 underline-offset-4 hover:underline focus-visible:underline"
          >
            {announcement.link.label}
          </Link>
        </div>
      }
    >
      <div className="container-site pt-4">
        <div className="glass relative flex h-[62px] items-center transition-[background-color] duration-300 group-data-[scrolled=true]/hdr:bg-white/92! justify-between gap-4 rounded-[20px] pr-2 pl-3 sm:h-[68px] sm:pr-2.5 sm:pl-4">
          <Logo />
          <HeaderNav site={site} services={services} solutions={solutions} />
          <div className="flex items-center gap-2">
            <a
              href={tel}
              aria-label={t(ui, "callAria", { name: site.name })}
              className="hidden min-h-11 items-center gap-2 rounded-lg border border-navy-900/20 bg-white px-4 font-label text-xs uppercase tracking-[0.12em] text-navy-900 hover:border-navy-900/40 xl:inline-flex"
            >
              <Icon name="phone" className="size-[18px]" /> {t(ui, "call")}
            </a>
            <Link
              href={site.quoteCta.href}
              className="hidden min-h-11 items-center rounded-lg bg-sun px-4 font-label text-xs uppercase tracking-[0.12em] text-navy-900 shadow-[0_8px_20px_-8px_rgb(255_90_31/0.7)] hover:brightness-105 sm:inline-flex"
            >
              {site.quoteCta.label}
            </Link>
            <MobileMenu site={site} services={services} solutions={solutions} />
          </div>
        </div>
      </div>
    </HeaderShell>
  );
}
