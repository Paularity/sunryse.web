import Image from "next/image";
import Link from "next/link";
import { ScrambleLabel } from "@/components/motion/scramble-label";
import { Button } from "@/components/ui/button";
import { calculateSolar, formatPeso } from "@/lib/solar-calc";

/**
 * Phase 2 starter page: proves tokens, fonts, buttons, motion and the calculator lib.
 * Replaced by the CMS-driven section registry in phase 4.
 */
export default function Home() {
  const example = calculateSolar({ monthlyBill: 10_000, segment: "residential", systemType: "grid-tie" });

  return (
    <main className="bg-dawn relative flex-1 overflow-hidden">
      <div className="grid-lines absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="absolute top-[18rem] right-[-8rem] size-[22rem] rounded-full bg-[radial-gradient(circle_at_45%_40%,#fffbea,#ffe07a_25%,#ffb21a_55%,#ff7a00_85%,#ff5a1f)] shadow-[0_0_120px_40px_rgb(255_178_26/0.5)] md:right-[8%] md:size-[30rem]"
      />

      <div className="container-site relative grid gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <ScrambleLabel
              className="glass rounded-full px-3 py-2 text-[11px] text-sun-700"
              lines={["● Sizing your system_", "● Calculating savings_", "● Lighting up panels_"]}
            />
            <span className="label text-[11px]">Clean energy · Brighter tomorrow</span>
          </div>

          <h1 className="text-[clamp(2.75rem,6.5vw,6.25rem)] leading-[0.98] font-bold">
            Power your home &amp; business with the{" "}
            <span className="inline-block rounded-[22px] border-2 border-sun-500 bg-white/50 px-4 pb-2">
              <span className="text-sun">sun.</span>
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-navy-900/80 md:text-xl">
            Design, installation and after-sales for homes, businesses and industry — grid-tie, hybrid and battery
            systems from brands you can trust.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="sun" size="xl">
              <Link href="#">Get a free quote</Link>
            </Button>
            <Button asChild variant="navy" size="xl">
              <Link href="#">See my savings →</Link>
            </Button>
          </div>
        </div>

        <div className="relative flex flex-col gap-4">
          <div className="glass self-end rounded-2xl p-4">
            <p className="label text-[10px] text-ink-muted">Example · ₱10k bill</p>
            <p className="font-display text-3xl font-bold">
              {example.systemKwp} <span className="text-base text-ink-muted">kWp</span>
            </p>
            <p className="label text-[10px] text-leaf-600">
              {example.panels} panels · payback ≈ {example.paybackYears?.toFixed(1)} yrs ·{" "}
              {formatPeso(example.monthlySavings)}/mo
            </p>
          </div>
          <figure className="corners relative ml-auto aspect-[3/2] w-full max-w-md p-2">
            <Image
              src="/images/projects/residential-top-view.jpg"
              alt="SunRyse residential rooftop installation seen from above"
              fill
              sizes="(min-width: 1024px) 28rem, 100vw"
              className="rounded-xl object-cover p-2"
              priority
            />
          </figure>
        </div>
      </div>

      <p className="label container-site relative pb-10 text-[10px] text-ink-muted">
        Phase 2 scaffold · tokens, fonts, buttons, motion and calculator wired
      </p>
    </main>
  );
}
