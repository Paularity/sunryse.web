"use client";

import { AlertCircle, Check, Lock, MessageCircle } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IconName } from "@/lib/content/types";
import { leadSchema } from "@/lib/lead-schema";
import { cn } from "@/lib/utils";

type Segment = "residential" | "commercial" | "industrial";
type Roof = "metal" | "tile" | "concrete" | "unsure";

export type ContactFormContent = {
  properties: { value: Segment; label: string; description: string; icon: IconName }[];
  roofs: { value: string; label: string }[];
  interests: string[];
  stepNames: string[];
  nextSteps: string[];
  privacyNote: string;
  consentLabel: string;
  successBody: string;
};

export type ContactFormProps = {
  content: ContactFormContent;
  messengerUrl: string;
  initialBill?: number;
  initialSegment?: Segment;
  /** "grid-tie" | "hybrid" when arriving from the calculator. */
  initialSystem?: string;
};

type Field = "name" | "phone" | "email" | "consent";
type Errors = Partial<Record<Field, string>>;

const fieldCls =
  "h-12 rounded-[14px] border-navy-900/20 bg-white px-3.5 text-base text-navy-900 md:text-base placeholder:text-ink-muted/70";
const lblCls = "font-label text-[11px] tracking-[0.12em] text-ink-muted uppercase";
const focusRing = "outline-none focus-visible:ring-3 focus-visible:ring-sky-600/40";

const INTEREST_FOR_SYSTEM: Record<string, string> = { "grid-tie": "Grid-tie", hybrid: "Hybrid + battery" };

export function ContactForm({ content, messengerUrl, initialBill, initialSegment, initialSystem }: ContactFormProps) {
  const uid = useId();
  const fromCalc = initialBill !== undefined || initialSegment !== undefined || initialSystem !== undefined;

  const [step, setStep] = useState(1);
  const [segment, setSegment] = useState<Segment>(initialSegment ?? "residential");
  const [roof, setRoof] = useState<Roof>("metal");
  const [bill, setBill] = useState(initialBill ? String(initialBill) : "");
  const [interest, setInterest] = useState(
    (initialSystem && INTEREST_FOR_SYSTEM[initialSystem] && content.interests.includes(INTEREST_FOR_SYSTEM[initialSystem]))
      ? INTEREST_FOR_SYSTEM[initialSystem]
      : content.interests[0],
  );
  const [city, setCity] = useState("");
  const [surveyDate, setSurveyDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    // Move focus to the new step heading (skip first render).
    if (mounted.current) headingRef.current?.focus();
    mounted.current = true;
  }, [step]);

  const billNumber = Number(bill.replace(/\D/g, "")) || undefined;
  const payload = {
    name,
    phone,
    email: email.trim(),
    segment,
    monthlyBill: billNumber,
    roofType: roof,
    address: city.trim() || undefined,
    message:
      [interest !== content.interests[0] && `Interested in: ${interest}`, surveyDate && `Preferred survey date: ${surveyDate}`, notes.trim()]
        .filter(Boolean)
        .join("\n") || undefined,
    consent,
    calcSnapshot: fromCalc ? { monthlyBill: initialBill, segment: initialSegment, systemType: initialSystem } : undefined,
    source: fromCalc ? "calculator" : "contact-form",
  };

  const parsed = leadSchema.safeParse(payload);
  const errors: Errors = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as Field;
      if ((key === "name" || key === "phone" || key === "email" || key === "consent") && !errors[key]) errors[key] = issue.message;
    }
  }
  const show = (f: Field) => (tried ? errors[f] : undefined);

  const last = step === 3;
  const firstName = name.trim().split(/\s+/)[0] || "there";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (!last) {
      setStep((s) => s + 1);
      return;
    }
    setTried(true);
    setServerError(null);
    if (!parsed.success || Object.keys(errors).length) {
      const first = (["name", "phone", "email", "consent"] as Field[]).find((f) => errors[f]);
      if (first) document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("failed");
      setStep(4);
    } catch {
      setServerError("We could not send your request. Please try again or call us.");
    } finally {
      setSending(false);
    }
  }

  function restart() {
    setStep(1);
    setTried(false);
    setServerError(null);
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setConsent(false);
  }

  const done = step === 4;
  const stepName = content.stepNames[step - 1] ?? "Done";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Quote request"
      className="glass-card flex min-w-0 flex-col gap-6 rounded-[28px] p-5 sm:p-8"
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between font-label text-[11px] tracking-[0.12em] text-ink-muted uppercase">
          <span>{done ? "Complete" : `Step ${step} of 3`}</span>
          <span>{done ? "Done" : stepName}</span>
        </div>
        <div
          className="h-2 rounded-full bg-day-100"
          role="progressbar"
          aria-label="Quote form progress"
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={Math.min(3, step)}
        >
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-sun-300),var(--color-sun-500),var(--color-sun-600))] transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${Math.min(100, Math.round((step / 3) * 100))}%` }}
          />
        </div>
      </div>

      {step === 1 ? (
        <div className="flex flex-col gap-5">
          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-3 p-0">
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-[22px] font-bold outline-none">
                What type of property?
              </h2>
            </legend>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {content.properties.map((p) => {
                const on = segment === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSegment(p.value)}
                    className={cn(
                      "flex min-h-[88px] items-start gap-3 rounded-2xl border-2 p-4 text-left text-navy-900 sm:min-h-[110px] sm:flex-col sm:gap-2",
                      focusRing,
                      on ? "border-sun-500 bg-dawn-50" : "border-navy-900/10 bg-white hover:border-navy-900/30",
                    )}
                  >
                    <Icon name={p.icon} className={cn("size-[26px]", on ? "text-sun-700" : "text-sky-600")} />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-display text-base font-bold">{p.label}</span>
                      <span className="text-[13px] text-ink-muted">{p.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-bill`} className={lblCls}>
                Average monthly bill ₱
              </Label>
              <Input
                id={`${uid}-bill`}
                inputMode="numeric"
                autoComplete="off"
                placeholder="10,000"
                value={billNumber ? billNumber.toLocaleString("en-PH") : ""}
                onChange={(e) => setBill(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className={fieldCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-interest`} className={lblCls}>
                Interested in
              </Label>
              <select
                id={`${uid}-interest`}
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className={cn(fieldCls, "w-full border px-3 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50")}
              >
                {content.interests.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-5">
          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-3 p-0">
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-[22px] font-bold outline-none">
                Tell us about your roof
              </h2>
            </legend>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {content.roofs.map((r) => {
                const on = roof === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setRoof(r.value as Roof)}
                    className={cn(
                      "min-h-[52px] rounded-[14px] border-2 p-3 font-display text-sm font-bold text-navy-900",
                      focusRing,
                      on ? "border-sky-600 bg-day-100" : "border-navy-900/10 bg-white hover:border-navy-900/30",
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-city`} className={lblCls}>
              City / barangay
            </Label>
            <Input
              id={`${uid}-city`}
              autoComplete="address-level2"
              placeholder="e.g. Quezon City, Metro Manila"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={240}
              className={fieldCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-date`} className={lblCls}>
              Preferred survey date (optional)
            </Label>
            <Input id={`${uid}-date`} type="date" value={surveyDate} onChange={(e) => setSurveyDate(e.target.value)} className={fieldCls} />
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-4">
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-[22px] font-bold outline-none">
            How can we reach you?
          </h2>
          <TextField id={`${uid}-name`} label="Full name" error={show("name")}>
            <Input
              id={`${uid}-name`}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!show("name")}
              aria-describedby={show("name") ? `${uid}-name-err` : undefined}
              maxLength={120}
              className={fieldCls}
            />
          </TextField>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id={`${uid}-phone`} label="Mobile" error={show("phone")} hint="e.g. 0917 123 4567">
              <Input
                id={`${uid}-phone`}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0917 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={!!show("phone")}
                aria-describedby={show("phone") ? `${uid}-phone-err` : undefined}
                className={fieldCls}
              />
            </TextField>
            <TextField id={`${uid}-email`} label="Email (optional)" error={show("email")}>
              <Input
                id={`${uid}-email`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!show("email")}
                aria-describedby={show("email") ? `${uid}-email-err` : undefined}
                className={fieldCls}
              />
            </TextField>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-notes`} className={lblCls}>
              Anything else?
            </Label>
            <Textarea
              id={`${uid}-notes`}
              rows={3}
              placeholder="e.g. We have frequent brownouts in the evening"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1500}
              className="min-h-24 rounded-[14px] border-navy-900/20 bg-white px-3.5 py-3 text-base text-navy-900 md:text-base"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-consent`} className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink-muted">
              <Checkbox
                id={`${uid}-consent`}
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                aria-invalid={!!show("consent")}
                aria-describedby={show("consent") ? `${uid}-consent-err` : undefined}
                className="mt-0.5 size-6 rounded-md border-navy-900/40 bg-white"
              />
              <span>{content.consentLabel}</span>
            </label>
            {show("consent") ? <FieldError id={`${uid}-consent-err`}>{show("consent")}</FieldError> : null}
          </div>
          {serverError ? <FieldError id={`${uid}-server-err`}>{serverError}</FieldError> : null}
        </div>
      ) : null}

      {done ? (
        <div role="status" className="flex flex-col items-center gap-3.5 py-6 text-center">
          <span className="grid size-[84px] place-items-center rounded-full bg-[radial-gradient(circle_at_45%_40%,var(--color-dawn-50),var(--color-sun-300)_45%,var(--color-sun-500))] text-navy-900 shadow-[0_0_50px_10px_rgb(255_178_26/0.45)]">
            <Check className="size-9" strokeWidth={2.5} aria-hidden />
          </span>
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-[30px] font-bold tracking-[-0.03em] outline-none">
            Thanks, {firstName}!
          </h2>
          <p className="m-0 max-w-[420px] leading-relaxed text-ink-muted">{content.successBody.replace("{phone}", phone.trim())}</p>
          <ol className="m-0 mt-2 flex list-none flex-col gap-2.5 p-0 text-left">
            {content.nextSteps.map((t, i) => (
              <li key={t} className="flex items-center gap-3 text-[15px]">
                <span className="grid size-[34px] flex-none place-items-center rounded-full border-2 border-sun-500 font-label text-[11px] text-sun-700">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t}
              </li>
            ))}
          </ol>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button asChild variant="navy" size="xl">
              <a href={messengerUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden /> Message us now
              </a>
            </Button>
            <Button type="button" variant="line" size="xl" onClick={restart}>
              Start over
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between gap-2.5 border-t border-navy-900/10 pt-[18px]">
          <Button type="button" variant="line" size="xl" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))} className="min-h-12 px-5">
            ← Back
          </Button>
          <Button type="submit" variant={last ? "sun" : "navy"} size="xl" disabled={sending} className="max-w-[280px] min-h-12 flex-1 px-5">
            {last ? (sending ? "Sending…" : "Send my request »") : "Continue →"}
          </Button>
        </div>
      )}

      {!done ? (
        <p className="m-0 flex items-center gap-2 text-[13px] text-ink-muted">
          <Lock className="size-4" aria-hidden /> {content.privacyNote}
        </p>
      ) : null}
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span id={id} role="alert" className="flex items-start gap-1.5 text-[13px] font-medium text-destructive">
      <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

function TextField({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className={lblCls}>
        {label}
      </Label>
      {children}
      {error ? <FieldError id={`${id}-err`}>{error}</FieldError> : hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
    </div>
  );
}
