import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Battery, ENERGY, Flow, Inverter, RooftopWorld, Scene } from "./models";
import { SolutionModel } from "./solution-model";

/** Two wall-mounted batteries beside a hybrid inverter (battery storage hero). */
export function BatteryWall() {
  return (
    <>
      <div className="d3-shadow" style={{ left: -200, top: -80, width: 400, height: 180 }} />
      <i
        className="d3-up"
        style={{
          left: -190,
          top: -70,
          width: 380,
          height: 220,
          ["--h" as string]: "220px",
          borderRadius: "12px 12px 0 0",
          background: "linear-gradient(180deg,#ffffff,#dce6f5)",
        }}
      />
      <Battery x={-150} y={-60} w={84} d={46} h={176} />
      <Battery x={-50} y={-60} w={84} d={46} h={176} />
      <Inverter x={60} y={-62} />
      <Flow from={[-60, 2]} to={[-90, 2]} color={ENERGY.home} />
      <Flow from={[130, -20]} to={[210, 90]} color={ENERGY.sun} />
    </>
  );
}

/** Which 3D world a service page shows; `null` keeps the photo (specialty products). */
export function serviceWorld(slug: string): ReactNode | null {
  if (slug.includes("battery")) return <BatteryWall />;
  if (slug.startsWith("commercial") || slug.startsWith("industrial") || slug.startsWith("residential"))
    return <SolutionModel slug={slug.split("-")[0]} />;
  if (
    ["solar-lighting-systems", "solar-water-pump-systems", "ev-charger-installation", "solar-cctv-solutions"].includes(
      slug,
    )
  )
    return null;
  return <RooftopWorld />;
}

/**
 * Page-hero frame: corner brackets, a 3D world on a sky backdrop, HUD chips, and an optional
 * floating photo card (the real install photo stays on the page).
 */
export function HeroSceneFrame({
  world,
  label,
  chips,
  photo,
  sun = true,
  className,
  worldClassName = "scale-[0.62] sm:scale-[0.9] lg:scale-[0.95] xl:scale-[1.05]",
  backdrop = "bg-[linear-gradient(180deg,#cfe6ff,#eef5ff_58%,#fff3dc)]",
}: {
  world: ReactNode;
  label: string;
  chips?: ReactNode;
  photo?: { src: string; alt: string; caption?: string };
  sun?: boolean;
  className?: string;
  worldClassName?: string;
  backdrop?: string;
}) {
  return (
    <div className={cn("relative m-0 box-border p-2.5 corners", className)}>
      <Scene
        label={label}
        className={cn("size-full overflow-hidden rounded-[18px]", backdrop)}
        worldClassName={worldClassName}
        sun={
          sun ? (
            <div className="d3-sun size-20 sm:size-[110px]">
              <span className="d3-orbit" />
            </div>
          ) : undefined
        }
      >
        {world}
      </Scene>
      {chips ? (
        <div className="absolute inset-x-6 top-6 z-[2] flex flex-wrap justify-between gap-2">{chips}</div>
      ) : null}
      {photo ? (
        <figure className="d3-float absolute right-6 bottom-6 z-[2] m-0 hidden w-[180px] flex-col gap-1.5 rounded-[14px] p-1.5 glass sm:flex">
          <span className="relative block h-[104px] overflow-hidden rounded-[10px]">
            <Image src={photo.src} alt={photo.alt} fill sizes="180px" className="object-cover" />
          </span>
          {photo.caption ? (
            <figcaption className="px-1 pb-0.5 font-label text-[11px] leading-snug tracking-[0.12em] text-ink-muted uppercase">
              {photo.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
    </div>
  );
}
