"use client";

import { useMemo, useState, type ReactNode } from "react";

import { RoofArray } from "@/components/three-d/roof-array";
import type { CalculatorConfig, UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";
import { calculateSolar } from "@/lib/solar-calc";

import { CalculatorConsole, teaserDefaultBill } from "./calculator-teaser-console";

/** Teaser body: the console's bill also drives the 3D roof in the intro column. */
export function CalculatorTeaserLive({
  intro,
  chips,
  config,
  ctaLabel,
  ui,
}: {
  intro: ReactNode;
  chips: ReactNode;
  config: CalculatorConfig;
  ctaLabel: string;
  ui: UiLabels;
}) {
  const [bill, setBill] = useState(() => teaserDefaultBill(config));
  const panels = useMemo(
    () =>
      bill > 0
        ? calculateSolar({ monthlyBill: bill, segment: "residential", systemType: "grid-tie" }, config).panels
        : 0,
    [bill, config],
  );

  return (
    <div className="relative grid items-center gap-14 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-[18px]">
        {intro}
        <RoofArray
          count={panels}
          label={t(ui, "roofPreview", { n: panels })}
          ariaLabel={t(ui, "roofPreviewAria", { n: panels })}
          className="sr h-[170px] rounded-[22px] border border-white/80 bg-[linear-gradient(180deg,rgb(255_255_255/0.65),rgb(255_255_255/0.2))] sm:h-[210px]"
        />
        {chips}
      </div>
      <div className="sr min-w-0 p-2.5 corners">
        <CalculatorConsole ui={ui} config={config} ctaLabel={ctaLabel} bill={bill} setBill={setBill} />
      </div>
    </div>
  );
}
