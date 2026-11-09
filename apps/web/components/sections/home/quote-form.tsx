"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { leadSchema } from "@/lib/lead-schema";

const formSchema = leadSchema.pick({ name: true, phone: true, segment: true, address: true }).extend({
  monthlyBill: z.string().trim().regex(/^[\d,\s]*$/, "Use numbers only, e.g. 10,000"),
});
type FormValues = z.infer<typeof formSchema>;

const labelCls = "font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted";
const fieldCls =
  "min-h-[52px] w-full rounded-xl border border-navy-900/20 bg-white/90 px-3.5 py-3.5 text-base text-navy-900 transition-[border-color,box-shadow] outline-none placeholder:text-ink-muted/70 focus-visible:border-sky-600 focus-visible:ring-4 focus-visible:ring-sky-600/20 aria-invalid:border-sun-700 aria-invalid:ring-4 aria-invalid:ring-sun-700/15";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} role="alert" className="flex items-center gap-1.5 text-[13px] font-semibold text-sun-700">
      <AlertCircle aria-hidden className="size-4 shrink-0" strokeWidth={2} />
      {message}
    </span>
  );
}

export function QuoteForm({ label, submitLabel, replyNote, phone }: { label: string; submitLabel: string; replyNote: string; phone: string }) {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", phone: "", segment: "residential", monthlyBill: "10,000", address: "" },
  });

  async function onSubmit(v: FormValues) {
    setStatus("idle");
    const bill = Number(v.monthlyBill.replace(/[^\d]/g, ""));
    const payload = {
      name: v.name,
      phone: v.phone,
      segment: v.segment,
      monthlyBill: v.monthlyBill.trim() && Number.isFinite(bill) ? bill : undefined,
      address: v.address || undefined,
      consent: true,
      source: "home-quote-cta",
    };
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
      reset();
      toast.success("Request sent. We will contact you shortly.");
    } catch {
      setStatus("error");
      toast.error("Could not send your request.");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="glass flex min-h-[320px] flex-col items-start justify-center gap-3 rounded-3xl p-6 sm:p-8">
        <CheckCircle2 aria-hidden className="size-10 text-leaf-600" strokeWidth={1.75} />
        <h3 className="m-0 font-display text-2xl font-bold tracking-[-0.03em]">Thank you, we got your request.</h3>
        <p className="m-0 text-ink-muted">{replyNote}</p>
        <Button type="button" variant="line" size="xl" onClick={() => setStatus("idle")}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label={label} className="glass grid gap-4 rounded-3xl p-5 sm:grid-cols-2 sm:p-6">
      <span className="col-span-full font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{label}</span>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="q-name" className={labelCls}>Name</label>
        <input id="q-name" autoComplete="name" className={fieldCls} aria-invalid={!!errors.name} aria-describedby="q-name-e" {...register("name")} />
        <FieldError id="q-name-e" message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="q-phone" className={labelCls}>Mobile</label>
        <input id="q-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxxx" className={fieldCls} aria-invalid={!!errors.phone} aria-describedby="q-phone-e" {...register("phone")} />
        <FieldError id="q-phone-e" message={errors.phone?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="q-seg" className={labelCls}>Property type</label>
        <select id="q-seg" className={fieldCls} {...register("segment")}>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="industrial">Industrial</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="q-bill" className={labelCls}>Monthly bill ₱</label>
        <input id="q-bill" inputMode="numeric" className={fieldCls} aria-invalid={!!errors.monthlyBill} aria-describedby="q-bill-e" {...register("monthlyBill")} />
        <FieldError id="q-bill-e" message={errors.monthlyBill?.message} />
      </div>

      <div className="col-span-full flex flex-col gap-1.5">
        <label htmlFor="q-addr" className={labelCls}>City / barangay</label>
        <input id="q-addr" autoComplete="address-level2" className={fieldCls} {...register("address")} />
      </div>

      {status === "error" ? (
        <p role="alert" className="col-span-full m-0 flex items-start gap-2 rounded-xl bg-white/80 p-3 text-sm font-semibold text-sun-700">
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          We could not send your request. Please try again or call us at {phone}.
        </p>
      ) : null}

      <Button type="submit" variant="navy" size="xl" disabled={isSubmitting} className="col-span-full min-h-14">
        {isSubmitting ? <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" /> : null}
        {isSubmitting ? "Sending..." : submitLabel}
        {isSubmitting ? null : <ArrowRight aria-hidden className="size-4" strokeWidth={2} />}
      </Button>

      <span className="col-span-full flex items-center gap-2 text-[13px] text-ink-muted">
        <Clock aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
        {replyNote}
      </span>
    </form>
  );
}
