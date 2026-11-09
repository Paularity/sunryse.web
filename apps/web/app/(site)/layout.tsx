import { LocalBusinessJsonLd } from "@/components/site/json-ld";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { StickyActions } from "@/components/site/sticky-actions";
import { getServices, getSite, getSolutions } from "@/lib/content";
import { t } from "@/lib/content/ui";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [site, services, solutions] = await Promise.all([getSite(), getServices(), getSolutions()]);
  return (
    <>
      <a href="#main" className="sr-only z-[60] rounded-xl bg-navy-900 px-4 py-3 font-label text-xs tracking-[0.12em] text-white uppercase focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        {t(site.ui, "skipToContent")}
      </a>
      <SiteHeader site={site} services={services} solutions={solutions} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter site={site} />
      <StickyActions site={site} />
      <LocalBusinessJsonLd site={site} services={services} />
    </>
  );
}
