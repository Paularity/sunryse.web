"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/icons";
import type { Site } from "@/lib/content/types";
import { t } from "@/lib/content/ui";

const HIDE_BAR_ON = ["/calculator", "/contact"];

/** Phone/tablet sticky bar (Call · Calculate · Get a quote) + desktop "Message us" pill. */
export function StickyActions({ site }: { site: Site }) {
  const pathname = usePathname();
  const hideBar = HIDE_BAR_ON.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const { ui } = site;
  const tel = `tel:${site.phone.replace(/[^\d+]/g, "")}`;

  return (
    <>
      {hideBar ? null : (
        <div className="glass fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 rounded-t-[20px] px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] lg:hidden">
          <a
            href={tel}
            aria-label={t(ui, "callAria", { name: site.name })}
            className="grid size-12 shrink-0 place-items-center rounded-[14px] border border-navy-900/20 bg-white text-navy-900"
          >
            <Icon name="phone" className="size-5" />
          </a>
          <Link
            href="/calculator"
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[14px] border border-navy-900/20 bg-white font-label text-xs uppercase tracking-[0.12em] text-navy-900"
          >
            <Icon name="calculator" className="size-[18px]" /> {t(ui, "calculate")}
          </Link>
          <Link
            href={site.quoteCta.href}
            className="inline-flex min-h-12 flex-[1.3] items-center justify-center rounded-[14px] bg-sun font-label text-xs uppercase tracking-[0.12em] text-navy-900 shadow-[0_8px_20px_-8px_rgb(255_90_31/0.7)]"
          >
            {site.quoteCta.label}
          </Link>
        </div>
      )}
      <a
        href={site.messengerUrl}
        className="fixed right-6 bottom-6 z-40 hidden min-h-12 items-center gap-2.5 rounded-full bg-navy-900 px-5 font-label text-xs uppercase tracking-[0.12em] text-white shadow-[0_16px_40px_-12px_rgb(11_31_77/0.6)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none lg:inline-flex"
      >
        <Icon name="message" className="size-5 text-sun-300" />
        {t(ui, "messageUs")}
      </a>
    </>
  );
}
