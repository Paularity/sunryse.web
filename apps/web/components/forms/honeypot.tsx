"use client";

import { HONEYPOT_FIELD } from "@/lib/lead-guard";

/**
 * Spam trap: a field people never see or reach (off-screen, out of the tab order, hidden from screen readers).
 * Bots that fill every field give themselves away; /api/leads then answers "ok" without saving anything.
 */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
