import { Icon } from "@/components/icons";
import type { IconName, Site, UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** Phone/tablet only: Call + Messenger before the long form. */
export function QuickContact({ ui, phone, messengerUrl, divider }: { ui: UiLabels; phone: string; messengerUrl: string; divider: string }) {
  const base =
    "flex min-h-14 items-center justify-center gap-2.5 rounded-2xl font-bold outline-none focus-visible:ring-3 focus-visible:ring-sky-600/40";
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:hidden">
      <a href={telHref(phone)} className={`${base} bg-navy-900 text-white`}>
        <Icon name="phone" /> {t(ui, "callNow")}
      </a>
      <a href={messengerUrl} target="_blank" rel="noopener noreferrer" className={`${base} border border-navy-900/15 bg-white text-navy-900`}>
        <Icon name="message" /> {t(ui, "messenger")}
      </a>
      <p className="col-span-2 m-0 text-center font-label text-[11px] tracking-[0.12em] text-ink-muted uppercase">{divider}</p>
    </div>
  );
}

function Row({ icon, label, value, href, external }: { icon: IconName; label: string; value: string; href: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex min-h-[52px] items-center gap-3.5 rounded-xl text-white outline-none focus-visible:ring-3 focus-visible:ring-sky-200/60"
    >
      <span className="grid size-11 flex-none place-items-center rounded-xl bg-white/10">
        <Icon name={icon} />
      </span>
      <span className="min-w-0">
        <span className="block font-label text-[11px] tracking-[0.12em] text-ink-glow uppercase">{label}</span>
        <b className="block font-display break-words">{value}</b>
      </span>
    </a>
  );
}

/** Desktop side column: contact details, hours and what happens next. */
export function SideContact({ site, nextSteps }: { site: Site; nextSteps: string[] }) {
  const { ui } = site;
  return (
    <aside aria-label={t(ui, "contactDetails")} className="hidden flex-col gap-3.5 lg:flex lg:sticky lg:top-[calc(var(--site-top)+16px)]">
      <div className="fx-dark flex flex-col gap-3.5 rounded-3xl p-6">
        <span className="font-label text-[11px] tracking-[0.12em] text-sun-300 uppercase">{t(ui, "preferToTalk")}</span>
        <Row icon="phone" label={t(ui, "callOrViber")} value={site.phone} href={telHref(site.phone)} />
        <Row icon="message" label={t(ui, "messenger")} value={t(ui, "messageOurPage")} href={site.messengerUrl} external />
        <Row icon="mail" label={t(ui, "email")} value={site.email} href={`mailto:${site.email}`} />
        <p className="m-0 flex items-center gap-2 text-[13px] text-ink-glow">
          <Icon name="clock" className="size-4" /> {site.hours}
        </p>
        {site.serviceArea ? (
          <p className="m-0 flex items-center gap-2 text-[13px] text-ink-glow">
            <Icon name="map-pin" className="size-4" /> {site.serviceArea}
          </p>
        ) : null}
      </div>
      <div className="glass-card flex flex-col gap-3 rounded-3xl p-[22px]">
        <span className="font-label text-[11px] tracking-[0.12em] text-ink-muted uppercase">{t(ui, "whatHappensNext")}</span>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {nextSteps.map((ns, i) => (
            <li key={ns} className="flex items-center gap-3 text-[15px]">
              <span className="grid size-[34px] flex-none place-items-center rounded-full border-2 border-sun-500 font-label text-[11px] text-sun-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              {ns}
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
