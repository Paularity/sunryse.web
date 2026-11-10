import { Mail, Phone } from "lucide-react";

import { Hud } from "@/components/fx";
import type { Site } from "@/lib/content/types";
import legal from "@/content/pages/legal.json";

type Doc = (typeof legal)["privacy"];

/** Privacy notice / terms of use: simple readable document with the company's contact details. */
export function LegalPage({ doc, site }: { doc: Doc; site: Site }) {
  const tel = `tel:${site.phone.replace(/[^\d+]/g, "")}`;
  return (
    <div className="bg-[linear-gradient(180deg,var(--color-sky-200),var(--color-day-50)_28%)] pt-[calc(var(--site-top)+24px)] pb-24">
      <article className="container-site max-w-[820px]">
        <header className="flex flex-col gap-4 border-b border-navy-900/10 pb-8">
          <div className="flex flex-wrap items-center gap-2.5">
            {doc.draft ? (
              <Hud light dot="amber">
                {legal.draftLabel}
              </Hud>
            ) : null}
            <span className="font-label text-[11px] tracking-[0.12em] text-ink-muted uppercase">
              {legal.updatedLabel.replace("{date}", doc.updated)}
            </span>
          </div>
          <h1 className="m-0 font-display text-[clamp(36px,5vw,60px)] leading-[1.02] font-bold tracking-[-0.04em]">
            {doc.heading}
          </h1>
          <p className="m-0 text-[18px] leading-relaxed text-ink-muted">{doc.intro}</p>
        </header>
        {doc.sections.map((s) => (
          <section key={s.heading} className="border-b border-navy-900/10 py-7">
            <h2 className="m-0 mb-3 font-display text-2xl font-bold tracking-[-0.02em]">{s.heading}</h2>
            {s.body.length > 1 ? (
              <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[16px] leading-relaxed text-navy-900/85">
                {s.body.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[16px] leading-relaxed text-navy-900/85">{s.body[0]}</p>
            )}
          </section>
        ))}
        <section className="mt-8 flex flex-col gap-3 rounded-2xl p-6 glass-card">
          <h2 className="m-0 font-display text-xl font-bold">{site.name}</h2>
          <a
            href={`mailto:${site.email}`}
            className="inline-flex min-h-11 items-center gap-2.5 font-semibold text-sky-600 hover:underline"
          >
            <Mail className="size-5" strokeWidth={1.75} aria-hidden /> {site.email}
          </a>
          <a
            href={tel}
            className="inline-flex min-h-11 items-center gap-2.5 font-semibold text-sky-600 hover:underline"
          >
            <Phone className="size-5" strokeWidth={1.75} aria-hidden /> {site.phone}
          </a>
          <span className="text-sm text-ink-muted">{site.address}</span>
        </section>
      </article>
    </div>
  );
}
