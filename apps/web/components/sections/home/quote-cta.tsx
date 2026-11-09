import { Mail, MapPin, Phone } from "lucide-react";

import { Hud } from "@/components/fx";
import type { HomeContent, Site } from "@/lib/content/types";

import { QuoteForm } from "./quote-form";

const contactLink =
  "inline-flex min-h-11 items-center gap-2.5 font-semibold text-navy-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900";

export function QuoteCta({ content, site }: { content: HomeContent["cta"]; site: Site }) {
  return (
    <section id="quote" aria-labelledby="quote-h" className="relative overflow-hidden bg-sun">
      {/* navy perspective grid floor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-20%] bottom-0 h-[70%] origin-bottom bg-[linear-gradient(rgb(11_31_77/0.13)_1px,transparent_1px),linear-gradient(90deg,rgb(11_31_77/0.13)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_top,black,transparent_85%)] [transform:perspective(700px)_rotateX(60deg)]"
      />
      <div aria-hidden className="pointer-events-none absolute -top-44 -right-36 size-[560px] rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.6),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -top-48 -right-32 size-[600px] rounded-full border border-white/60 shadow-[inset_0_0_0_40px_rgb(255_255_255/0.07),inset_0_0_0_41px_rgb(255_255_255/0.35)]" />

      <div className="container-site relative grid items-center gap-10 py-[clamp(64px,9vw,112px)] lg:grid-cols-[1fr_1.05fr] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-4 text-navy-900">
          <Hud light className="self-start">
            {content.chip}
          </Hud>
          <h2 id="quote-h" className="m-0 font-display text-[clamp(36px,4.8vw,68px)] leading-[0.98] font-bold tracking-[-0.04em] text-balance">
            {content.heading}
          </h2>
          <p className="m-0 max-w-[420px] text-[17px] leading-relaxed">{content.lead}</p>
          <div className="mt-1.5 flex flex-col gap-1.5">
            <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className={contactLink}>
              <Phone aria-hidden className="size-5" strokeWidth={1.75} />
              {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className={contactLink}>
              <Mail aria-hidden className="size-5" strokeWidth={1.75} />
              {site.email}
            </a>
            <span className="inline-flex min-h-11 items-center gap-2.5 font-semibold">
              <MapPin aria-hidden className="size-5" strokeWidth={1.75} />
              {site.serviceArea}
            </span>
          </div>
        </div>
        <QuoteForm ui={site.ui} label={content.formLabel} submitLabel={content.submitLabel} replyNote={content.replyNote} phone={site.phone} />
      </div>
    </section>
  );
}
