import { MessageCircle } from "lucide-react";

import { Eyebrow, RichText, h2Class } from "@/components/fx";
import { buttonVariants } from "@/components/ui/button";
import type { Faq, HomeContent } from "@/lib/content/types";
import { cn } from "@/lib/utils";

import { FaqList } from "./faq-list";

export function FaqSection({ content, faqs, messengerUrl }: { content: HomeContent["faq"]; faqs: Faq[]; messengerUrl: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return (
    <section aria-labelledby="faq-h" className="relative bg-day-100 py-[clamp(64px,9vw,112px)]">
      <div className="container-site grid items-start gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
        <div className="flex flex-col gap-4 lg:sticky lg:top-28">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 id="faq-h" className={h2Class}>
            <RichText text={content.heading} />
          </h2>
          <p className="m-0 max-w-[420px] leading-relaxed text-ink-muted">{content.lead}</p>
          <a
            href={messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "line", size: "xl" }), "self-start")}
          >
            <MessageCircle aria-hidden className="size-[18px]" strokeWidth={1.75} />
            Message us
          </a>
        </div>
        <FaqList faqs={faqs} openFirst={content.openFirst} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </section>
  );
}
