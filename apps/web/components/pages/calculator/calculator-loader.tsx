"use client";

import { useSearchParams } from "next/navigation";

import type { Segment, SystemType } from "@/lib/solar-calc";
import { CalculatorWizard, type WizardProps } from "./calculator-wizard";

const SEGMENTS: Record<string, Segment> = {
  residential: "residential",
  home: "residential",
  commercial: "commercial",
  business: "commercial",
  industrial: "industrial",
};
const SYSTEMS: Record<string, SystemType> = { "grid-tie": "grid-tie", grid: "grid-tie", hybrid: "hybrid" };

/** Reads ?bill=&segment=&type= on the client (so the page itself stays prerendered) and seeds the wizard. */
export function CalculatorFromQuery(props: Omit<WizardProps, "initialBill" | "initialSegment" | "initialSystem">) {
  const sp = useSearchParams();
  const bill = Number(sp.get("bill"));
  const key = sp.toString();
  return (
    <CalculatorWizard
      key={key}
      {...props}
      initialBill={Number.isFinite(bill) && bill > 0 ? Math.min(Math.round(bill), 10_000_000) : undefined}
      initialSegment={SEGMENTS[sp.get("segment") ?? ""]}
      initialSystem={SYSTEMS[sp.get("type") ?? ""]}
    />
  );
}
