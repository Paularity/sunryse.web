"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";

import { scrollToTarget } from "@/components/motion/smooth-scroll";
import { formatHour } from "@/components/sections/home/configurator/model";
import { ENERGY, RooftopWorld, Scene } from "@/components/three-d/models";
import { buttonVariants } from "@/components/ui/button";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import type { CalcConfig } from "@/lib/solar-calc";
import { cn } from "@/lib/utils";

import type { Anchor, StoryPin } from "./story-scene";
import { chapterProgress, chapterVisible, shotAt, STATIONS } from "./stations";

const StoryScene = dynamic(() => import("./story-scene"), { ssr: false });

export type StoryCopy = {
  loading: { brand: string; title: string; note: string };
  hud: { scroll: string; chapter: string; jump: string };
  chapters: {
    id: string;
    label: string;
    eyebrow: string;
    title: string;
    body: string;
    ctas?: { label: string; href: string; variant: string }[];
    pins?: { anchor: string; text: string }[];
  }[];
};

const mono = "font-label text-[11px] uppercase tracking-[0.14em]";
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

type Mode = "pending" | "webgl" | "static";

/** Can this device run the 3D story? (WebGL2, not on data-saver.) Phones get a lighter scene. */
function useMode() {
  const [mode, setMode] = useState<{ mode: Mode; lite: boolean; reduced: boolean }>({
    mode: "pending",
    lite: false,
    reduced: false,
  });
  useEffect(() => {
    const id = window.setTimeout(() => {
      let gl = false;
      try {
        gl = !!document.createElement("canvas").getContext("webgl2");
      } catch {}
      const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
      const lowPower = (nav.deviceMemory ?? 8) < 4;
      setMode({
        mode: gl && !nav.connection?.saveData && (nav.deviceMemory ?? 8) >= 2 ? "webgl" : "static",
        lite: lowPower || window.matchMedia("(max-width: 767px), (pointer: coarse)").matches,
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, []);
  return mode;
}

/**
 * Scrollytelling "A day on solar": a pinned full-screen 3D island, scrubbed by scroll, with chapter text
 * that appears while the camera holds on each shot. Falls back to stacked chapters over a static scene.
 */
export function StoryExperience({ story, config }: { story: StoryCopy; config: CalcConfig }) {
  const { mode, lite, reduced } = useMode();
  const count = STATIONS.length;
  const section = useRef<HTMLElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const visibleRef = useRef(0);
  const [visible, setVisible] = useState(0);
  const [index, setIndex] = useState(0);
  /** Night sky behind the HUD → light HUD text. */
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);

  // Labels pinned to 3D anchors (positioned by the scene every frame).
  const pinList = story.chapters.flatMap((c, chapter) => (c.pins ?? []).map((p) => ({ ...p, chapter })));
  const pins = useRef<StoryPin[]>(pinList.map((p) => ({ el: null, anchor: p.anchor as Anchor, chapter: p.chapter })));

  // Scroll → progress (0–1 across the whole story) → visible chapter, HUD.
  useGSAP(
    () => {
      const el = section.current;
      if (!el || mode !== "webgl") return;
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (s) => {
          progress.current = s.progress;
          const v = chapterVisible(s.progress, count);
          if (v !== visibleRef.current) {
            visibleRef.current = v;
            setVisible(v);
          }
          const shot = shotAt(s.progress, reduced);
          setIndex(shot.index);
          setDark(shot.hour >= 18.8 || shot.hour < 5.8);
          if (bar.current) bar.current.style.transform = `scaleX(${s.progress})`;
          if (pct.current) pct.current.textContent = `${Math.round(s.progress * 100)}%`;
          if (clock.current) clock.current.textContent = formatHour(shot.hour);
        },
      });
    },
    { scope: section, dependencies: [mode, count, reduced], revertOnUpdate: true },
  );

  // Pause the 3D scene while the story is off screen.
  useEffect(() => {
    const el = section.current;
    if (!el || mode !== "webgl") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  // Chapter text arrives in rhythm: eyebrow scrambles, title lines rise out of a mask, then body and buttons.
  useGSAP(
    () => {
      if (mode !== "webgl" || reduced || visible < 0) return;
      const art = section.current?.querySelector<HTMLElement>(`[data-chapter="${visible}"]`);
      if (!art) return;
      const title = art.querySelector<HTMLElement>("[data-split]");
      const eyebrow = art.querySelector<HTMLElement>("[data-eyebrow]");
      const tl = gsap.timeline({ delay: 0.1 });
      if (eyebrow?.textContent)
        tl.to(eyebrow, { duration: 0.8, scrambleText: { text: eyebrow.textContent, chars: "01░▒▓_", speed: 0.6 } }, 0);
      if (title) {
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        tl.from(split.lines, { yPercent: 110, duration: 0.9, ease: "power4.out", stagger: 0.08 }, 0);
      }
      tl.from(
        art.querySelectorAll("[data-rise]"),
        { y: 18, autoAlpha: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 },
        0.3,
      );
    },
    { scope: section, dependencies: [visible, reduced, mode], revertOnUpdate: true },
  );

  // Pointer parallax (mouse only).
  useEffect(() => {
    if (mode !== "webgl" || reduced) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 };
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [mode, reduced]);

  // Safety net: hide the loader even if the scene never reports its first frame.
  useEffect(() => {
    if (mode !== "webgl" || ready) return;
    const t = window.setTimeout(() => setReady(true), 6000);
    return () => window.clearTimeout(t);
  }, [mode, ready]);

  const jump = (i: number) => {
    const el = section.current;
    if (!el) return;
    scrollToTarget(el.offsetTop + chapterProgress(i, count) * (el.offsetHeight - window.innerHeight));
  };
  /** In-page links (e.g. "#configurator") scroll through Lenis too. */
  const onAnchor = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
    history.replaceState(null, "", href);
  };

  if (mode === "static") return <StaticStory story={story} />;

  return (
    <section
      ref={section}
      aria-label={story.loading.title}
      className="relative bg-navy-950"
      style={{ height: `${count * 190}svh` } as CSSProperties}
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* sky (painted by the scene for the hour) */}
        <div
          ref={sky}
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, #7fb6ff 0%, #ffd8a8 78%)" }}
        />
        {mode === "webgl" ? (
          <div className="absolute inset-0">
            <StoryScene
              config={config}
              progress={progress}
              pointer={pointer}
              sky={sky}
              pins={pins}
              visible={visibleRef}
              reduced={reduced}
              lite={lite}
              active={inView}
              onReady={() => setReady(true)}
            />
          </div>
        ) : null}

        {/* cinematic edge falloff, plus a light scrim behind the big headlines on phones */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_50%_45%,transparent_55%,rgb(11_31_77/0.22)_100%)]"
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_top,rgb(255_243_220/0.9)_10%,rgb(255_243_220/0)_60%)] transition-opacity duration-700 lg:hidden",
            visible === 0 || visible === count - 1 ? "opacity-100" : "opacity-0",
          )}
        />

        {/* 3D-anchored labels */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]">
          {pinList.map((p, k) => (
            <div
              key={k}
              ref={(el) => {
                pins.current[k].el = el;
              }}
              data-on="false"
              className="absolute top-0 left-0 opacity-0 transition-opacity duration-500 will-change-transform data-[on=true]:opacity-100"
            >
              <div className="-translate-x-1/2 -translate-y-[calc(100%+12px)]">
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-label text-[11px] tracking-[0.12em] whitespace-nowrap text-navy-900 uppercase glass">
                  <span className="size-2 rounded-full" style={{ background: ENERGY.sun }} />
                  {p.text}
                </span>
                <span className="mx-auto mt-1 block h-3 w-px bg-white/90" />
              </div>
            </div>
          ))}
        </div>

        {/* chapter text */}
        <div className="pointer-events-none absolute inset-0 z-[3] mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-14">
          {story.chapters.map((c, i) => {
            const on = visible === i;
            const side = STATIONS[i]?.side ?? "left";
            const hero = i === 0 || i === count - 1;
            const Heading = i === 0 ? "h1" : "h2";
            return (
              <article
                key={c.id}
                data-chapter={i}
                data-on={on}
                aria-hidden={!on}
                inert={!on}
                className={cn(
                  "absolute inset-x-4 bottom-[calc(8.75rem+env(safe-area-inset-bottom))] flex flex-col gap-3 transition-[opacity,translate] duration-700 ease-out sm:inset-x-8 lg:top-1/2 lg:bottom-auto lg:w-[min(480px,38vw)] lg:-translate-y-1/2",
                  side === "left" ? "lg:right-auto lg:left-14" : "lg:right-14 lg:left-auto",
                  on
                    ? "pointer-events-auto translate-y-0 opacity-100 lg:-translate-y-1/2"
                    : "translate-y-6 opacity-0 lg:-translate-y-[calc(50%-24px)]",
                  reduced && "transition-none",
                  !hero && "rounded-3xl p-5 glass sm:p-7",
                  hero && "lg:w-[min(560px,42vw)]",
                )}
              >
                <span className={cn(mono, "flex items-center gap-3", hero ? "text-navy-900/70" : "text-sun-700")}>
                  <span className="tabular-nums">
                    {String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                  </span>
                  <span aria-hidden className="h-px w-6 bg-current opacity-40" />
                  <span data-eyebrow>{c.eyebrow}</span>
                </span>
                <Heading
                  data-split
                  className={cn(
                    "m-0 font-display font-bold tracking-[-0.035em] text-balance text-navy-900",
                    hero
                      ? "text-[clamp(32px,5.4vw,76px)] leading-[0.98] [text-shadow:0_2px_30px_rgb(255_255_255/0.55)]"
                      : "text-[clamp(24px,2.6vw,36px)] leading-[1.08]",
                  )}
                >
                  {c.title}
                </Heading>
                <p
                  data-rise
                  className={cn(
                    "m-0 max-w-[52ch] leading-[1.55]",
                    hero
                      ? "text-[15px] font-medium text-navy-900/85 sm:text-[17px]"
                      : "text-[15px] text-ink-muted sm:text-base",
                  )}
                >
                  {c.body}
                </p>
                {c.ctas?.length ? (
                  <div data-rise className="mt-2 flex flex-wrap gap-3">
                    {c.ctas.map((a) => (
                      <Link
                        key={a.href}
                        href={a.href}
                        onClick={(e) => onAnchor(e, a.href)}
                        className={buttonVariants({ variant: a.variant === "sun" ? "sun" : "line", size: "xl" })}
                      >
                        {a.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {/* HUD: progress, clock, chapter dots */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] max-lg:bottom-[calc(4.5rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-[1440px] items-end justify-between gap-4 px-4 pb-4 sm:px-8 lg:px-14 lg:pb-7">
            <div
              className={cn(
                "flex items-center gap-3 font-label text-[11px] tracking-[0.14em] uppercase transition-colors duration-500",
                dark ? "text-white" : "text-navy-900",
              )}
            >
              <span ref={pct} className="w-10 tabular-nums">
                0%
              </span>
              <span
                className={cn("hidden h-px w-24 overflow-hidden sm:block", dark ? "bg-white/25" : "bg-navy-900/15")}
              >
                <span ref={bar} className="block h-full origin-left scale-x-0 bg-sun-500" />
              </span>
              <span className="hidden sm:inline">{story.chapters[index]?.label}</span>
              <span
                ref={clock}
                className={cn(
                  "rounded-full px-2 py-0.5 tabular-nums backdrop-blur",
                  dark ? "bg-white/15" : "bg-white/70",
                )}
              >
                {formatHour(STATIONS[0].hour)}
              </span>
            </div>
          </div>
        </div>

        {/* chapter dots */}
        <nav
          aria-label={story.loading.title}
          className="pointer-events-auto absolute top-1/2 right-1 z-[4] -translate-y-1/2 sm:right-3 lg:right-5"
        >
          <ol className="m-0 flex list-none flex-col items-center gap-0.5 p-0">
            {story.chapters.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => jump(i)}
                  aria-label={fill(story.hud.jump, { n: i + 1, title: c.label })}
                  aria-current={index === i ? "step" : undefined}
                  className="group grid size-8 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-sky-600"
                >
                  <span
                    className={cn(
                      "block size-2 rounded-full transition-all duration-300",
                      dark ? "bg-white/40 group-hover:bg-white/80" : "bg-navy-900/25 group-hover:bg-navy-900/60",
                      index === i && "h-5 bg-sun-500 group-hover:bg-sun-500",
                    )}
                  />
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* scroll hint on the opening shot */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-[calc(var(--site-top,124px)+16px)] right-4 z-[4] flex items-center gap-2 transition-opacity duration-500 sm:right-8 lg:right-14",
            mono,
            "text-navy-900/70",
            index === 0 && ready ? "opacity-100" : "opacity-0",
          )}
        >
          {story.hud.scroll}
          <span className="relative block h-8 w-px overflow-hidden bg-navy-900/20">
            <span className="story-scroll-cue absolute inset-x-0 top-0 h-3 bg-sun-500 motion-reduce:hidden" />
          </span>
        </div>

        {/* loader */}
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "absolute inset-0 z-[5] grid place-items-center bg-[linear-gradient(180deg,#0b1f4d,#1a3478_60%,#ff9e5e)] text-white transition-opacity duration-700",
            ready ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <span className="story-loader relative block size-16 rounded-full border-2 border-white/20 motion-reduce:animate-none">
              <span className="absolute inset-3 rounded-full bg-sun-300 shadow-[0_0_40px_10px_rgb(255_201_60/0.6)]" />
            </span>
            <span className={cn(mono, "text-white/70")}>{story.loading.brand}</span>
            <span className="font-display text-3xl font-bold tracking-[-0.03em]">{story.loading.title}</span>
            <span className="text-sm text-white/70">{ready ? "" : story.loading.note}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** No WebGL / data saver: the same story as plain stacked chapters over a static CSS scene. */
function StaticStory({ story }: { story: StoryCopy }) {
  return (
    <section
      aria-label={story.loading.title}
      className="bg-[linear-gradient(180deg,#9fd0ff,#fff3dc_40%,#ffffff)] pt-[var(--site-top,124px)]"
    >
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-4 pb-20 sm:px-8">
        <div className="relative mx-auto aspect-[16/10] w-full max-w-[720px]">
          <Scene scale={0.9} label={story.loading.title}>
            <RooftopWorld />
          </Scene>
        </div>
        <ol className="m-0 grid list-none gap-5 p-0 md:grid-cols-2">
          {story.chapters.map((c, i) => {
            const Heading = i === 0 ? "h1" : "h2";
            return (
              <li
                key={c.id}
                className={cn("flex flex-col gap-3 rounded-3xl p-6 glass-card", i === 0 && "md:col-span-2")}
              >
                <span className={cn(mono, "text-sun-700")}>{c.eyebrow}</span>
                <Heading className="m-0 font-display text-[clamp(24px,3vw,40px)] leading-[1.08] font-bold tracking-[-0.03em] text-navy-900">
                  {c.title}
                </Heading>
                <p className="m-0 text-ink-muted">{c.body}</p>
                {c.ctas?.length ? (
                  <div className="mt-1 flex flex-wrap gap-3">
                    {c.ctas.map((a) => (
                      <Link
                        key={a.href}
                        href={a.href}
                        className={buttonVariants({ variant: a.variant === "sun" ? "sun" : "line", size: "xl" })}
                      >
                        {a.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
