"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = { label: string; defaultValue: number; ctaLabel: string; href: string };

/** Hero quick-estimate form: monthly bill → calculator with ?bill=. */
export function HeroBillForm({ label, defaultValue, ctaLabel, href }: Props) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(defaultValue.toLocaleString("en-PH"));

  const digits = value.replace(/\D/g, "");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const sep = href.includes("?") ? "&" : "?";
    router.push(digits ? `${href}${sep}bill=${digits}` : href);
  }

  return (
    <form onSubmit={onSubmit} aria-label="Quick savings estimate" className="glass flex max-w-[560px] flex-wrap gap-2 rounded-[20px] p-2">
      <label htmlFor={id} className="flex min-w-0 flex-[1_1_220px] items-center gap-2.5 px-3">
        <span className="font-label text-[11px] uppercase tracking-[0.12em] whitespace-nowrap text-ink-muted">{label}</span>
        <input
          id={id}
          value={value}
          inputMode="numeric"
          autoComplete="off"
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(0, 7);
            setValue(d ? Number(d).toLocaleString("en-PH") : "");
          }}
          className="min-h-[52px] w-full min-w-0 rounded-md bg-transparent font-display text-2xl font-semibold text-navy-900 outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
        />
      </label>
      <button type="submit" className={cn(buttonVariants({ variant: "navy", size: "xl" }), "min-h-[52px] flex-[1_1_auto]")}>
        {ctaLabel}
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </form>
  );
}
