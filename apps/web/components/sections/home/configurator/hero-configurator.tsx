"use client";

import { ArrowRight, Pause, Play, Zap, ZapOff } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { Hud, RichText } from "@/components/fx";
import {
  Battery as BatteryModel,
  Building,
  ENERGY,
  Factory,
  Flow,
  GridPole,
  House,
  Pin,
  Scene,
} from "@/components/three-d/models";
import { buttonVariants } from "@/components/ui/button";
import type { CalculatorConfig, HomeContent, UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";
import { formatPeso, type Segment } from "@/lib/solar-calc";
import { cn } from "@/lib/utils";

import { HeroStatus } from "./hero-status";
import {
  backupHours,
  createStore,
  energyAt,
  formatHour,
  HOUR_MAX,
  HOUR_MIN,
  size,
  skyAt,
  type HeroState,
  type Store,
} from "./model";

const SceneWebgl = dynamic(() => import("./scene-webgl"), { ssr: false });

const mono = "font-label text-[11px] uppercase tracking-[0.12em]";
const MAX_BILL = 1_000_000;
const PROPS: { value: Segment; key: string; noun: string }[] = [
  { value: "residential", key: "cfgHome", noun: "cfgPropHome" },
  { value: "commercial", key: "cfgBusiness", noun: "cfgPropBusiness" },
  { value: "industrial", key: "cfgFactory", noun: "cfgPropFactory" },
];
const kw = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

/** Subscribe to a derived value of the store (re-renders only when it changes). */
function useStore<T extends string | number | boolean>(store: Store, pick: (s: HeroState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => pick(store.get()),
    () => pick(store.get()),
  );
}

/** Smoothly counts a number toward its new value (instant with reduced motion). */
function useCount(value: number) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now();
    const a = from.current;
    let id = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 450);
      const v = a + (value - a) * (1 - (1 - k) ** 3);
      from.current = v;
      setShown(v);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value]);
  return shown;
}

/* ---------- live text (status line + model labels) ---------- */

function useLive(store: Store, config: CalculatorConfig, ui: UiLabels) {
  // Round the hour so text updates a few times per simulated hour, not every frame.
  const key = useStore(store, (s) => `${s.bill}|${s.segment}|${s.battery}|${s.brownout}|${Math.round(s.hour * 4) / 4}`);
  return useMemo(() => {
    const s = store.get();
    const sized = size(s, config);
    const e = energyAt({ ...s, hour: Math.round(s.hour * 4) / 4 }, sized, config);
    const noun = t(ui, PROPS.find((p) => p.value === s.segment)!.noun);
    let flow: string;
    if (s.brownout) flow = e.dark ? t(ui, "stOutageOff") : t(ui, "stOutageOn");
    else if (e.exportKw > 0.05) flow = t(ui, "stExport", { kw: kw(e.exportKw) });
    else if (e.chargeKw > 0.05) flow = t(ui, "stCharge");
    else if (e.dischargeKw > 0.05) flow = t(ui, "stDischarge", { property: noun });
    else if (e.importKw > 0.05) flow = t(ui, "stImport", { kw: kw(e.importKw) });
    else flow = t(ui, "stSelf");
    const sun = e.solarKw > 0.05 ? t(ui, "stSolar", { kw: kw(e.solarKw) }) : t(ui, "stNight");
    const grid = s.brownout
      ? t(ui, "pinGridDown")
      : e.exportKw > 0.05
        ? t(ui, "pinGridExport", { kw: kw(e.exportKw) })
        : e.importKw > 0.05
          ? t(ui, "pinGridImport", { kw: kw(e.importKw) })
          : t(ui, "pinGridIdle");
    return {
      time: formatHour(s.hour),
      line: `${sun} · ${flow}`,
      dark: e.dark,
      night: e.daylight < 0.12,
      panels: t(ui, "pinPanelsN", { n: sized.panels, w: config.panelWatt }),
      battery: t(ui, "pinBatteryPct", { pct: Math.round(e.soc * 100) }),
      batteryArrow: e.chargeKw > 0.05 ? "▲" : e.dischargeKw > 0.05 ? "▼" : "",
      grid,
      gridDown: s.brownout,
      noun,
      sized,
      e,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, config, ui]);
}

function PanelsLabel({ store, config, ui }: { store: Store; config: CalculatorConfig; ui: UiLabels }) {
  const live = useLive(store, config, ui);
  return <Hud>{live.panels}</Hud>;
}
function BatteryLabel({ store, config, ui }: { store: Store; config: CalculatorConfig; ui: UiLabels }) {
  const live = useLive(store, config, ui);
  return (
    <Hud light>
      {live.battery}{" "}
      {live.batteryArrow ? (
        <span aria-hidden className="text-leaf-600">
          {live.batteryArrow}
        </span>
      ) : null}
    </Hud>
  );
}
function GridLabel({ store, config, ui }: { store: Store; config: CalculatorConfig; ui: UiLabels }) {
  const live = useLive(store, config, ui);
  return (
    <Hud light dot={live.gridDown ? "none" : "amber"} className={live.gridDown ? "text-sun-700" : undefined}>
      {live.grid}
    </Hud>
  );
}

/* ---------- CSS-3D fallback scene (phones, no WebGL, first paint) ---------- */

function CssScene({
  store,
  config,
  ui,
  label,
}: {
  store: Store;
  config: CalculatorConfig;
  ui: UiLabels;
  label: string;
}) {
  const live = useLive(store, config, ui);
  const s = store.get();
  const hour = useStore(store, (st) => Math.round(st.hour * 4) / 4);
  const n = Math.min(24, Math.max(1, live.sized.panels));
  const cols = Math.min(6, Math.max(2, Math.ceil(Math.sqrt(n * 1.5))));
  const rows = Math.min(4, Math.ceil(n / cols));
  const sunAt = Math.min(1, Math.max(0, (hour - 6) / 12));
  const { e } = live;
  return (
    <Scene
      label={label}
      className={cn(
        "absolute inset-0 transition-[filter] duration-700",
        live.night && "d3-night brightness-[.72] saturate-[.85]",
        live.dark && "d3-dark",
      )}
      worldClassName="[--d3-s:0.58] max-sm:top-[56%] sm:[--d3-s:0.8] lg:[--d3-s:0.78] xl:[--d3-s:0.9]"
      sun={
        <div
          className={cn("d3-sun size-20 transition-opacity duration-700 sm:size-[120px]", live.night && "opacity-0")}
          style={{ animation: "none", offsetDistance: `${8 + sunAt * 84}%` }}
        />
      }
    >
      {s.segment === "residential" ? (
        <House cols={cols} rows={rows} />
      ) : s.segment === "commercial" ? (
        <Building />
      ) : (
        <Factory />
      )}
      {s.battery ? <BatteryModel x={-196} y={4} /> : null}
      <GridPole x={-102} y={196} />
      {e.toHomeKw > 0.05 ? <Flow from={[40, 40]} to={[-20, 90]} color={ENERGY.sun} /> : null}
      {e.exportKw > 0.05 ? <Flow from={[-30, 84]} to={[-96, 196]} color={ENERGY.grid} /> : null}
      {e.importKw > 0.05 ? <Flow from={[-96, 196]} to={[-30, 84]} color="#6fb0ff" /> : null}
      {s.battery && (e.chargeKw > 0.05 || e.dischargeKw > 0.05) ? (
        <Flow
          from={e.chargeKw > 0.05 ? [-112, 22] : [-148, 22]}
          to={e.chargeKw > 0.05 ? [-148, 22] : [-112, 22]}
          color={ENERGY.home}
        />
      ) : null}
      <Pin x={-40} y={-90} z={s.segment === "commercial" ? 190 : 200} className="max-sm:-translate-x-[30%]">
        <PanelsLabel store={store} config={config} ui={ui} />
      </Pin>
      {s.battery ? (
        <Pin x={-173} y={20} z={110} className="max-sm:hidden">
          <BatteryLabel store={store} config={config} ui={ui} />
        </Pin>
      ) : null}
    </Scene>
  );
}

/* ---------- WebGL upgrade (desktop) ---------- */

function useWebglCapable() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const check = () => {
      let gl = false;
      try {
        gl = !!document.createElement("canvas").getContext("webgl2");
      } catch {}
      setOk(mq.matches && gl && !nav.connection?.saveData && (nav.deviceMemory ?? 8) >= 4);
    };
    const id = window.setTimeout(check, 300);
    mq.addEventListener("change", check);
    return () => {
      window.clearTimeout(id);
      mq.removeEventListener("change", check);
    };
  }, []);
  return ok;
}

/* ---------- the section ---------- */

/** Home hero: a live solar configurator (bill, property, battery, time of day, brownout) around a 3D scene. */
export function HeroConfigurator({
  hero,
  config,
  ui,
}: {
  hero: HomeContent["hero"];
  config: CalculatorConfig;
  ui: UiLabels;
}) {
  const uid = useId();
  const [store] = useState(() =>
    createStore({
      bill: hero.billDefault,
      segment: "residential",
      battery: false,
      hour: 12,
      brownout: false,
      playing: false,
    }),
  );
  const bill = useStore(store, (s) => s.bill);
  const segment = useStore(store, (s) => s.segment);
  const battery = useStore(store, (s) => s.battery);
  const brownout = useStore(store, (s) => s.brownout);
  const playing = useStore(store, (s) => s.playing);
  const hourQ = useStore(store, (s) => Math.round(s.hour * 4) / 4);
  const live = useLive(store, config, ui);
  const webgl = useWebglCapable();
  const frameRef = useRef<HTMLDivElement>(null);
  const [glReady, setGlReady] = useState(false);

  const sized = live.sized;
  const savings = useCount(sized.monthlySavings);
  const hours = backupHours(sized, bill, config);
  const type = battery ? "hybrid" : "grid-tie";
  const query = `bill=${bill || ""}&segment=${segment}&type=${type}`;

  // Autoplay the day (starts after a moment; never with reduced motion). Any time-slider use pauses it.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => store.set({ playing: true }), 1500);
    return () => window.clearTimeout(id);
  }, [store]);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let id = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      let h = store.get().hour + dt * 0.75; // ≈ 23 s for a full day
      if (h > HOUR_MAX) h = HOUR_MIN;
      store.set({ hour: h });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, store]);

  // Sky behind the scene follows the hour (set directly on the element, no re-render).
  useEffect(() => {
    const paint = () => {
      const el = frameRef.current;
      if (!el) return;
      const [top, bottom] = skyAt(store.get().hour);
      el.style.setProperty("--sky-top", top);
      el.style.setProperty("--sky-bottom", bottom);
    };
    paint();
    return store.subscribe(paint);
  }, [store]);

  const sceneLabel = t(ui, "cfgSceneAria", { property: live.noun, n: sized.panels, time: live.time });
  const labels: ReactNode[] = [
    <PanelsLabel key="p" store={store} config={config} ui={ui} />,
    <BatteryLabel key="b" store={store} config={config} ui={ui} />,
    <GridLabel key="g" store={store} config={config} ui={ui} />,
  ];

  const setBill = (n: number) => store.set({ bill: Number.isFinite(n) ? Math.min(Math.max(n, 0), MAX_BILL) : 0 });
  const presets = config.presets.slice(0, 4);

  return (
    <section
      aria-label={t(ui, "heroAria")}
      className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-sky-200)_0%,var(--color-dawn-50)_70%,var(--color-dawn-100))] pt-[calc(var(--site-top)+28px)] pb-16 lg:pb-20"
    >
      <div aria-hidden className="absolute inset-0 fx-grid opacity-70" />
      <div className="relative z-[2] container-site grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:grid-rows-[auto_auto] lg:gap-x-10 lg:gap-y-4">
        {/* pitch (phones: headline → scene → configurator; desktop: left column) */}
        <div className="flex min-w-0 flex-col gap-4 lg:self-end">
          <div className="flex flex-wrap items-center gap-2.5">
            <Hud light dot="amber">
              <HeroStatus status={hero.status} />
            </Hud>
            <span className={cn(mono, "text-navy-900")}>{hero.tagline}</span>
          </div>
          <h1 className="font-display text-[40px] leading-[1.02] font-bold tracking-[-0.045em] text-navy-900 sm:text-[clamp(44px,3.9vw,56px)]">
            <RichText text={hero.heading} />
          </h1>
          <p className="max-w-[520px] text-[17px] leading-[1.55] text-navy-900/85">{hero.subheading}</p>
        </div>

        <div
          role="group"
          aria-label={t(ui, "cfgAria")}
          className="order-3 flex min-w-0 flex-col gap-3 self-start rounded-3xl p-4 glass sm:p-5 lg:order-none lg:col-start-1 lg:row-start-2"
        >
          {/* bill */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={`${uid}-bill`} className={cn(mono, "text-ink-muted")}>
                {t(ui, "cfgBill")}
              </label>
              <span className="flex min-h-12 items-center gap-1.5 rounded-xl border-2 border-navy-900 bg-white px-3 focus-within:ring-2 focus-within:ring-sky-600 focus-within:ring-offset-2">
                <span aria-hidden className="font-display text-lg font-bold text-ink-muted">
                  ₱
                </span>
                <input
                  id={`${uid}-bill`}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label={t(ui, "cfgBillAria")}
                  value={bill ? bill.toLocaleString("en-PH") : ""}
                  onChange={(ev) => setBill(Number(ev.target.value.replace(/[^\d]/g, "")))}
                  className="min-h-11 w-[110px] border-0 bg-transparent font-display text-xl font-bold text-navy-900 outline-none"
                />
              </span>
            </div>
            <input
              type="range"
              min={2000}
              max={200000}
              step={500}
              value={Math.min(bill, 200000)}
              onChange={(ev) => setBill(Number(ev.target.value))}
              aria-label={t(ui, "cfgBillAria")}
              aria-valuetext={formatPeso(bill)}
              className="h-11 w-full cursor-pointer accent-sun-500"
            />
            <div
              className="flex flex-wrap gap-1.5 lg:hidden"
              role="group"
              aria-label={t(ui, "quickBillAmounts")}
            >
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={bill === p}
                  onClick={() => setBill(p)}
                  className={cn(
                    mono,
                    "min-h-11 rounded-full border px-3.5 text-xs text-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
                    bill === p ? "border-sun-500 bg-dawn-50" : "border-navy-900/15 bg-white hover:border-navy-900/35",
                  )}
                >
                  {p >= 1000 ? `₱${p / 1000}k` : `₱${p}`}
                </button>
              ))}
            </div>
          </div>

          {/* property + battery */}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
              <legend className={cn(mono, "mb-2 text-ink-muted")}>{t(ui, "cfgProperty")}</legend>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-day-100 p-1">
                {PROPS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    aria-pressed={segment === p.value}
                    onClick={() => store.set({ segment: p.value })}
                    className={cn(
                      "min-h-11 rounded-lg font-display text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
                      segment === p.value
                        ? "bg-navy-900 text-white shadow-[0_8px_18px_-8px_rgb(11_31_77/0.6)]"
                        : "text-navy-900 hover:bg-white/70",
                    )}
                  >
                    {t(ui, p.key)}
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              type="button"
              role="switch"
              aria-checked={battery}
              onClick={() => store.set({ battery: !battery })}
              className={cn(
                "flex min-h-14 items-center gap-3 self-end rounded-xl border-2 px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
                battery
                  ? "border-leaf-500 bg-[color-mix(in_srgb,var(--color-leaf-500)_10%,white)]"
                  : "border-navy-900/12 bg-white hover:border-navy-900/30",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "relative h-6 w-10 flex-none rounded-full transition-colors",
                  battery ? "bg-leaf-500" : "bg-navy-900/20",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                    battery && "translate-x-4",
                  )}
                />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-sm font-bold text-navy-900">{t(ui, "cfgBattery")}</span>
                <span className="block text-xs leading-snug text-ink-muted">{t(ui, "cfgBatteryHint")}</span>
              </span>
            </button>
          </div>

          {/* results */}
          <dl
            className={cn(
              "grid gap-2 border-t border-navy-900/10 pt-3",
              battery ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4",
            )}
          >
            {[
              { k: t(ui, "cfgSystem"), v: `${sized.systemKwp} kWp`, c: "" },
              { k: t(ui, "cfgPanels"), v: String(sized.panels), c: "" },
              {
                k: t(ui, "cfgSavings"),
                v: `${formatPeso(Math.round(savings))}`,
                c: "text-leaf-600",
                unit: t(ui, "perMonth"),
              },
              {
                k: t(ui, "cfgPayback"),
                v: sized.paybackYears == null ? "—" : `${sized.paybackYears.toFixed(1)} ${t(ui, "years")}`,
                c: "text-sun-700",
              },
              ...(battery
                ? [{ k: t(ui, "cfgBackup"), v: t(ui, "cfgBackupHours", { n: hours }), c: "text-sky-600" }]
                : []),
            ].map((r) => (
              <div key={r.k} className="min-w-0">
                <dt className={cn(mono, "text-ink-muted")}>{r.k}</dt>
                <dd
                  className={cn(
                    "font-display text-lg leading-tight font-bold tracking-[-0.02em] tabular-nums sm:text-xl",
                    r.c,
                  )}
                >
                  {r.v}
                  {r.unit ? <span className="text-xs">{r.unit}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
          <p className="sr-only" role="status">
            {t(ui, "cfgSummary", { kwp: sized.systemKwp, n: sized.panels, savings: formatPeso(sized.monthlySavings) })}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/contact?${query}`}
              className={cn(buttonVariants({ variant: "sun", size: "xl" }), "flex-1 sm:flex-none")}
            >
              {t(ui, "cfgQuote")} <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href={`/calculator?${query}`}
              className={cn(buttonVariants({ variant: "line", size: "xl" }), "flex-1 sm:flex-none")}
            >
              {t(ui, "cfgBreakdown")}
            </Link>
          </div>
          <span className="text-xs text-ink-muted">{t(ui, "cfgIllustrative")}</span>
        </div>

        {/* right: the live 3D scene */}
        <div
          ref={frameRef}
          className="relative order-2 -mx-4 min-w-0 self-center p-0 corners sm:mx-0 sm:p-2.5 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1"
          style={{ ["--sky-top" as string]: "#9fd0ff", ["--sky-bottom" as string]: "#fff3dc" }}
        >
          <div
            data-webgl={glReady ? "ready" : undefined}
            className="relative h-[460px] overflow-hidden bg-[linear-gradient(180deg,var(--sky-top),var(--sky-bottom))] transition-[background] sm:h-[480px] sm:rounded-[22px] lg:h-[min(640px,calc(100svh-var(--site-top)-60px))] lg:min-h-[520px]"
          >
            <CssScene store={store} config={config} ui={ui} label={sceneLabel} />
            {webgl ? (
              <div className="d3-webgl absolute inset-0">
                <SceneWebgl store={store} config={config} labels={labels} onReady={() => setGlReady(true)} />
              </div>
            ) : null}

            {/* status line */}
            <div className="pointer-events-none absolute inset-x-3 top-3 z-[3] flex flex-wrap items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
              <Hud
                className={cn("max-w-full whitespace-normal!", live.dark && "border-sun-600/60")}
                dot={brownout ? "amber" : "green"}
              >
                <span className="whitespace-nowrap tabular-nums">{live.time}</span> · {live.line}
              </Hud>
              {glReady ? (
                <Hud light dot="none" className="max-lg:hidden">
                  {t(ui, "cfgDrag")}
                </Hud>
              ) : null}
            </div>

            {/* time + brownout bar */}
            <div className="absolute inset-x-3 bottom-3 z-[3] flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl p-2 glass sm:inset-x-4 sm:bottom-4 sm:flex-nowrap sm:p-2.5">
              <button
                type="button"
                onClick={() => store.set({ playing: !playing })}
                aria-label={playing ? t(ui, "cfgPause") : t(ui, "cfgPlay")}
                className="grid size-11 flex-none place-items-center rounded-xl bg-navy-900 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              </button>
              <label className="flex min-w-0 flex-1 items-center gap-3">
                <span className={cn(mono, "w-[68px] flex-none text-navy-900 tabular-nums")}>{formatHour(hourQ)}</span>
                <input
                  type="range"
                  min={HOUR_MIN}
                  max={HOUR_MAX}
                  step={0.25}
                  value={hourQ}
                  onChange={(ev) => store.set({ hour: Number(ev.target.value), playing: false })}
                  aria-label={t(ui, "cfgTime")}
                  aria-valuetext={formatHour(hourQ)}
                  className="h-11 min-w-0 flex-1 cursor-pointer accent-sun-500"
                />
              </label>
              <button
                type="button"
                aria-pressed={brownout}
                onClick={() => store.set({ brownout: !brownout })}
                className={cn(
                  mono,
                  "inline-flex min-h-11 flex-none items-center gap-2 rounded-xl border px-3 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 max-sm:w-full max-sm:justify-center",
                  brownout
                    ? "border-sun-600 bg-sun-600 text-white"
                    : "border-navy-900/15 bg-white text-navy-900 hover:border-navy-900/35",
                )}
              >
                {brownout ? <Zap className="size-4" aria-hidden /> : <ZapOff className="size-4" aria-hidden />}
                {brownout ? t(ui, "cfgBrownoutEnd") : t(ui, "cfgBrownout")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
