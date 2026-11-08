---
name: solar-calculator
description: Formulas, default assumptions and UX for the SunRyse solar savings calculator (system size, cost, payback, 25-year savings, CO2). Load before touching calculator logic, UI or its tests.
---

# Solar savings calculator

Pure function in `apps/web/lib/solar-calc.ts` (no React), unit-tested with Vitest. Defaults come from Strapi
`calculator-config`; the values below are **placeholders until SunRyse confirms them**.

## Inputs
monthlyBill (₱), segment (residential | commercial | industrial), systemType (grid-tie | hybrid),
daytimeUsageShare (0.3–0.9, default 0.6 res / 0.75 com), backupHours (hybrid only), optional roofAreaM2.

## Defaults
rate ₱12.50/kWh · peakSunHours 4.5 · performanceRatio 0.80 · panel 620 W, 2.6 m² ·
grid-tie ₱60,000/kWp · hybrid ₱75,000/kWp · battery ₱28,000/kWh · export credit ₱6.00/kWh ·
rate escalation 3%/yr · degradation 0.5%/yr · grid factor 0.71 kg CO₂/kWh · 21 kg CO₂/tree/yr.

## Formulas
```
monthlyKwh   = monthlyBill / rate
dailyKwh     = monthlyKwh / 30
kWp          = (dailyKwh * daytimeUsageShare) / (peakSunHours * performanceRatio)   // round up to 0.5
panels       = ceil(kWp * 1000 / panelWatt);  roofArea = panels * panelAreaM2
annualGen    = kWp * peakSunHours * 365 * performanceRatio
selfUsed     = min(annualGen, monthlyKwh*12*daytimeUsageShare*1.15); exported = annualGen - selfUsed
year1Savings = selfUsed*rate + exported*exportCredit
batteryKwh   = hybrid ? ceil(dailyKwh*(1-daytimeUsageShare)*backupHoursFactor) : 0
systemCost   = kWp*costPerKwp(systemType) + batteryKwh*batteryCost
payback      = first year where cumulative savings ≥ systemCost (with escalation & degradation)
savings25    = Σ_{y=1..25} year1Savings * (1+esc)^(y-1) * (1-deg)^(y-1)
co2Tons/yr   = annualGen * gridFactor / 1000;  trees = co2Kg / kgPerTree
billReduction% = year1Savings / (monthlyBill*12)
```
If roofArea is given and smaller than required, cap kWp to roof and flag "roof-limited".

## UX
Step 1 bill slider (₱2k–₱500k, log scale) + segment tabs → live results (system size, panels, monthly savings,
payback, 25-yr savings, CO₂/trees) with CountUp. Chart: cumulative savings vs cost (break-even marker).
CTA "Get my exact quote" pre-fills the lead form with the calc snapshot. Always show the disclaimer.
