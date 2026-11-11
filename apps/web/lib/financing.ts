/**
 * Financing estimates for payment options (pure, no React). Used by the "Check eligibility" panel on /pricing
 * and, later, the calculator proposal. Estimates only: lenders set the real terms.
 */

/** Standard amortised monthly payment. A rate of 0 (or unknown) is a straight split: principal / months. */
export function monthlyPayment(principal: number, months: number, annualRatePct = 0): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r <= 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export type FinanceEstimate = {
  downPayment: number;
  financed: number;
  monthly: number;
  total: number;
  interest: number;
};

export function financeEstimate({
  price,
  months,
  annualRatePct,
  downPaymentPct,
}: {
  price: number;
  months: number;
  annualRatePct?: number | null;
  downPaymentPct?: number | null;
}): FinanceEstimate {
  const downPayment = Math.round(price * Math.min(Math.max(downPaymentPct ?? 0, 0), 100)) / 100;
  const financed = Math.max(0, price - downPayment);
  const monthly = monthlyPayment(financed, months, annualRatePct ?? 0);
  const total = downPayment + monthly * months;
  return { downPayment, financed, monthly, total, interest: Math.max(0, total - price) };
}

/** Terms a visitor can pick, up to the option's maximum (always including the maximum itself). */
export function termChoices(maxMonths: number | null | undefined): number[] {
  if (!maxMonths || maxMonths <= 0) return [];
  const steps = [6, 12, 18, 24, 36, 48, 60, 84, 120].filter((m) => m < maxMonths);
  return [...steps.slice(-3), maxMonths];
}
