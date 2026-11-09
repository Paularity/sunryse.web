"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import type { UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";
import { leadSchema } from "@/lib/lead-schema";

const makeSchema = (billError: string) =>
  leadSchema.pick({ name: true, phone: true, segment: true, address: true }).extend({
    monthlyBill: z.string().trim().regex(/^[\d,\s]*$/, billError),
  });
type FormValues = z.infer<ReturnType<typeof makeSchema>>;

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

export function QuoteForm({ ui, label, submitLabel, replyNote, phone }: { ui: UiLabels; label: string; submitLabel: string; replyNote: string; phone: string }) {
  const formSchema = useMemo(() => makeSchema(t(ui, "errBillNumbers")), [ui]);
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
      toast.success(t(ui, "toastSuccess"));
    } catch {
      setStatus("error");
      toast.error(t(ui, "toastError"));
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="glass flex min-h-[320px] flex-col items-start justify-center gap-3 rounded-3xl p-6 sm:p-8">
        <CheckCircle2 aria-hidden className="size-10 text-leaf-600" strokeWidth={1.75} />
        <h3 className="m-0 font-display text-2xl font-bold tracking-[-0.03em]">{t(ui, "formSuccessTitle")}</h3>
        <p className="m-0 text-ink-muted">{replyNote}</p>
        <Button type="button" variant="line" size="xl" onClick={() => setStatus("idle")}>
          {t(ui, "formSendAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label={label} className="glass grid gap-3 rounded-3xl p-5 sm:grid-cols-2 sm:p-6">
      <span className="col-span-full font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{label}</span>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="q-name" className={labelCls}>{t(ui, "formName")}</label>
        <input id="q-name" autoComplete="name" className={fieldCls} aria-invalid={!!errors.name} aria-describedby="q-name-e" {...register("name")} />
        <FieldError id="q-name-e" message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="q-phone" className={labelCls}>{t(ui, "formMobile")}</label>
        <input id="q-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={t(ui, "formMobileHint")} className={fieldCls} aria-invalid={!!errors.phone} aria-describedby="q-phone-e" {...register("phone")} />
        <FieldError id="q-phone-e" message={errors.phone?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="q-seg" className={labelCls}>{t(ui, "formProperty")}</label>
        <select id="q-seg" className={fieldCls} {...register("segment")}>
          <option value="residential">{t(ui, "segmentResidential")}</option>
          <option value="commercial">{t(ui, "segmentCommercial")}</option>
          <option value="industrial">{t(ui, "segmentIndustrial")}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="q-bill" className={labelCls}>{t(ui, "formBill")}</label>
        <input id="q-bill" inputMode="numeric" className={fieldCls} aria-invalid={!!errors.monthlyBill} aria-describedby="q-bill-e" {...register("monthlyBill")} />
        <FieldError id="q-bill-e" message={errors.monthlyBill?.message} />
      </div>

      <div className="col-span-full flex flex-col gap-1.5">
        <label htmlFor="q-addr" className={labelCls}>{t(ui, "formCity")}</label>
        <input id="q-addr" autoComplete="address-level2" className={fieldCls} {...register("address")} />
      </div>

      {status === "error" ? (
        <p role="alert" className="col-span-full m-0 flex items-start gap-2 rounded-xl bg-white/80 p-3 text-sm font-semibold text-sun-700">
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {t(ui, "quoteError", { phone })}
        </p>
      ) : null}

      <Button type="submit" variant="navy" size="xl" disabled={isSubmitting} className="col-span-full min-h-14 text-[13px]">
        {isSubmitting ? <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" /> : null}
        {isSubmitting ? t(ui, "formSending") : submitLabel}
        {isSubmitting ? null : <ArrowRight aria-hidden className="size-4" strokeWidth={2} />}
      </Button>

      <span className="col-span-full flex items-center gap-2 text-[13px] text-ink-muted">
        <Clock aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
        {replyNote}
      </span>
    </form>
  );
}
