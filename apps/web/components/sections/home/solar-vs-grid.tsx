import { Eyebrow, Hud, RichText, Section, h2Class } from "@/components/fx";
import type { CalculatorConfig, HomeContent, UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";

const X0 = 40;
const X1 = 550;
const Y_TOP = 32;
const Y_START = 150;
const Y_BASE = 205;
const YEARS = 25;

export function SolarVsGrid({ content, config, ui }: { content: HomeContent["solarVsGrid"]; config: CalculatorConfig; ui: UiLabels }) {
  const rate = (yr: number) => config.electricityRate * Math.pow(1 + config.rateEscalation, yr - 1);
  const start = rate(1);
  const end = rate(YEARS);
  const endLabel = `₱${end.toFixed(2)}*`;
  const yFor = (v: number) => Y_START - ((v - start) / Math.max(end - start, 0.01)) * (Y_START - Y_TOP);
  const pts = Array.from({ length: YEARS }, (_, i) => {
    const x = X0 + (i / (YEARS - 1)) * (X1 - X0);
    return `${x.toFixed(1)} ${yFor(rate(i + 1)).toFixed(1)}`;
  });
  const line = "M" + pts.join(" L");
  const area = `${line} L${X1} ${Y_BASE} L${X0} ${Y_BASE} Z`;
  const alt = t(ui, "chartAlt", { start: start.toFixed(2), end: end.toFixed(2), solar: content.solarValue });

  return (
    <Section tone="white" labelledBy="svg-h">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div className="fx-screen min-w-0 rounded-3xl p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Hud dot="amber">{content.chartLabel}</Hud>
            <span className="flex flex-wrap gap-4 font-label text-[11px] uppercase tracking-[0.12em] text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <i className="block h-[3px] w-3.5 rounded-sm bg-sun-600" />
                {content.gridLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i className="block h-[3px] w-3.5 rounded-sm bg-glow-leaf" />
                {content.solarLabel}
              </span>
            </span>
          </div>
          <svg viewBox="0 0 560 260" role="img" aria-label={alt} className="block h-auto w-full">
            <defs>
              <linearGradient id="svg-gridfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-sun-600)" stopOpacity=".45" />
                <stop offset="1" stopColor="var(--color-sun-600)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g stroke="rgb(255 255 255 / 0.09)">
              <line x1={X0} y1="20" x2={X0} y2="230" />
              <line x1={X0} y1="230" x2={X1} y2="230" />
              <line x1={X0} y1="160" x2={X1} y2="160" />
              <line x1={X0} y1="90" x2={X1} y2="90" />
            </g>
            <path d={area} fill="url(#svg-gridfill)" />
            <path d={line} stroke="var(--color-sun-600)" strokeWidth="3.5" fill="none" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgb(255 122 61 / 0.9))" }} />
            <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke="var(--color-glow-leaf)" strokeWidth="3.5" style={{ filter: "drop-shadow(0 0 6px rgb(91 217 122 / 0.9))" }} />
            <line
              x1={X0}
              y1={Y_BASE}
              x2={X1}
              y2={Y_BASE}
              stroke="white"
              strokeWidth="2"
              strokeDasharray="2 22"
              strokeLinecap="round"
              className="motion-safe:animate-[fx-flow_1.4s_linear_infinite]"
              style={{ opacity: 0.8 }}
            />
            <circle cx={X1} cy={yFor(end)} r="6" fill="var(--color-sun-600)" style={{ filter: "drop-shadow(0 0 8px var(--color-sun-600))" }} />
            <circle cx={X1} cy={Y_BASE} r="6" fill="var(--color-glow-leaf)" style={{ filter: "drop-shadow(0 0 8px var(--color-glow-leaf))" }} />
            <g fontSize="12" fill="var(--color-ink-soft)" className="font-label">
              <text x={X0} y="252">{t(ui, "yearStart")}</text>
              <text x="295" y="252" textAnchor="middle">{t(ui, "chartYearMid")}</text>
              <text x={X1} y="252" textAnchor="end">{t(ui, "yearEnd")}</text>
            </g>
            <g fontSize="12" fontWeight="500" className="font-label">
              <text x={X1} y="20" textAnchor="end" fill="var(--color-sun-300)">{endLabel}</text>
              <text x={X1} y="192" textAnchor="end" fill="var(--color-glow-leaf)">{content.solarValue}</text>
            </g>
          </svg>
        </div>

        <div className="flex min-w-0 flex-col gap-[18px]">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 id="svg-h" className={h2Class}>
            <RichText text={content.heading} />
          </h2>
          <p className="text-[17px] leading-relaxed text-ink-muted">{content.lead}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex min-w-0 flex-col gap-1.5 rounded-[14px] border border-navy-900/8 bg-day-50 p-3.5">
              <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{content.gridLabel}</span>
              <span className="font-display text-[36px] font-bold leading-tight tracking-[-0.02em] text-sun-700">{content.gridValue}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5 rounded-[14px] border border-navy-900/8 bg-day-50 p-3.5">
              <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{content.solarLabel}</span>
              <span className="font-display text-[36px] font-bold leading-tight tracking-[-0.02em] text-leaf-600">{content.solarValue}</span>
            </div>
          </div>
          <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{content.note}</span>
        </div>
      </div>
    </Section>
  );
}
