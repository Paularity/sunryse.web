import Link from "next/link";

import { Hud } from "@/components/fx";
import { SocialIcon } from "@/components/icons";
import { Logo } from "@/components/site/logo";
import type { Site } from "@/lib/content/types";
import { t } from "@/lib/content/ui";

const flink = "flex min-h-11 items-center text-[15px] text-ink-light hover:text-sun-300 focus-visible:text-sun-300";
const head = "font-label text-[11px] uppercase tracking-[0.12em] text-ink-dim";

export function SiteFooter({ site }: { site: Site }) {
  const tel = `tel:${site.phone.replace(/[^\d+]/g, "")}`;
  const { footer, ui } = site;

  return (
    <footer className="relative isolate overflow-hidden bg-navy-950 pt-12 pb-[110px] text-white sm:pt-16 lg:pb-7">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-sun-500)_30%,var(--color-sky-400)_70%,transparent)] shadow-[0_0_18px_rgb(255_138_0/0.7)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_100%_0%,rgb(255_138_0/0.14),transparent_70%),radial-gradient(40%_70%_at_0%_100%,rgb(30_111_232/0.18),transparent_70%)]"
      />
      <div className="relative container-site">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-8 lg:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
          <div className="col-span-2 flex flex-col items-start gap-4 sm:col-span-1">
            <Logo dark />
            <p className="hidden max-w-[320px] text-[15px] leading-[1.6] text-ink-pale sm:block">{footer.blurb}</p>
            <Hud>{site.hours}</Hud>
            <span className="font-label text-[11px] tracking-[0.12em] text-ink-dim uppercase">{site.license}</span>
          </div>

          {footer.columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex min-w-0 flex-col">
              <span className={`${head} pb-2`}>{col.title}</span>
              {col.links.map((l) => (
                <Link key={l.label} href={l.href} className={flink}>
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}

          <div className="col-span-2 flex flex-row flex-wrap items-center gap-x-[18px] gap-y-1 sm:col-span-1 sm:flex-col sm:items-start sm:gap-y-1">
            <span className={`${head} basis-full pb-1 sm:basis-auto sm:pb-2`}>{t(ui, "contact")}</span>
            <a href={tel} className={flink}>
              {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className={flink}>
              {site.email}
            </a>
            <span className="py-1.5 text-[15px] text-ink-light">{site.address}</span>
            <ul className="mt-1 flex basis-full flex-wrap gap-2 sm:basis-auto">
              {site.socials.map((s) => (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    aria-label={s.label}
                    className="grid size-11 place-items-center rounded-xl border border-white/12 bg-white/8 text-white transition-[background,box-shadow,color] duration-300 hover:bg-[linear-gradient(135deg,var(--color-sun-300),var(--color-sun-500)_50%,var(--color-sun-600))] hover:text-navy-900 hover:shadow-[0_8px_24px_-8px_rgb(255_138_0/0.9)] focus-visible:bg-[linear-gradient(135deg,var(--color-sun-300),var(--color-sun-500)_50%,var(--color-sun-600))] focus-visible:text-navy-900"
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* lg: keep clear of the floating "Message us" button (fixed bottom-right) */}
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 font-label text-[11px] tracking-[0.12em] text-ink-soft uppercase sm:flex-row sm:items-center sm:justify-between lg:pr-56">
          <span>{footer.copyright}</span>
          <ul className="flex gap-4">
            {footer.legal.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="-my-3.5 inline-flex min-h-11 items-center hover:text-sun-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
