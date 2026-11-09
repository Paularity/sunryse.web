"use client";

import { Minus, Plus } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import type { Faq } from "@/lib/content/types";

export function FaqList({ faqs, openFirst }: { faqs: Faq[]; openFirst: boolean }) {
  return (
    <Accordion type="single" collapsible defaultValue={openFirst ? "faq-0" : undefined} className="gap-2.5">
      {faqs.map((f, i) => (
        <AccordionItem
          key={f.question}
          value={`faq-${i}`}
          className="glass-card relative overflow-hidden rounded-[18px] border-b-0 transition-shadow data-[state=open]:shadow-[inset_4px_0_0_var(--color-sun-500),0_18px_40px_-22px_rgb(11_31_77/0.3)]"
        >
          <AccordionPrimitive.Header className="m-0 flex">
            <AccordionPrimitive.Trigger className="group flex min-h-14 w-full items-center justify-between gap-4 rounded-[18px] px-5 py-4 text-left font-display text-[17px] font-semibold text-navy-900 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-6">
              <span className="min-w-0">{f.question}</span>
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full border border-navy-900/15 bg-white text-navy-900 transition-colors group-data-[state=open]:border-transparent group-data-[state=open]:bg-sun"
              >
                <Plus className="size-4 group-data-[state=open]:hidden" strokeWidth={2} />
                <Minus className="hidden size-4 group-data-[state=open]:block" strokeWidth={2} />
              </span>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionContent className="px-5 pb-5 text-base leading-relaxed text-ink-muted sm:px-6">{f.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
