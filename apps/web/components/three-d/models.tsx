import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * SunRyse "daylight 3D" models — pure CSS 3D, rendered on the server (no JS).
 * Everything sits inside a `.d3-world`: floor = XY plane, +Z = up. Units are px.
 * Styles live in app/three-d.css; the approved look is docs/designs/fx-3d.css.
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;
const px = (n: number) => `${n}px`;
const deg = (n: number) => (n * Math.PI) / 180;

export const ENERGY = { sun: "#FFC93C", home: "#5BD97A", grid: "#FF8A00" } as const;

/* ---------- primitives ---------- */

type Faces = Partial<Record<"top" | "front" | "right" | "left" | "back", string>>;

function Box({
  w,
  d,
  h,
  x = 0,
  y = 0,
  faces = {},
  front,
  children,
}: {
  w: number;
  d: number;
  h: number;
  x?: number;
  y?: number;
  faces?: Faces;
  front?: ReactNode;
  children?: ReactNode;
}) {
  const f = (name: keyof Faces, def: string) => (
    <i className={cn("f", name, faces[name] ?? def)}>{name === "front" ? front : null}</i>
  );
  return (
    <div className="d3-box" style={{ "--w": px(w), "--d": px(d), "--h": px(h), left: x, top: y } as Vars}>
      {f("top", "m-wall")}
      {f("front", "m-wall")}
      {f("right", "m-wall-shade")}
      {f("left", "m-wall-shade")}
      {f("back", "m-wall-shade")}
      {children}
    </div>
  );
}

/** Solar panel grid (cols × rows) sized w × h. */
export function Panels({
  cols,
  rows,
  w,
  h,
  lit = true,
  className,
  count,
}: {
  cols: number;
  rows: number;
  w: number;
  h: number;
  lit?: boolean;
  className?: string;
  count?: number;
}) {
  return (
    <div
      className={cn("d3-panels", lit && "lit", className)}
      style={{
        width: w,
        height: h,
        gridTemplateColumns: `repeat(${cols},1fr)`,
        gridTemplateRows: `repeat(${rows},1fr)`,
      }}
    >
      {Array.from({ length: Math.min(count ?? cols * rows, cols * rows) }, (_, i) => (
        <i key={i} style={{ "--i": i } as Vars} />
      ))}
    </div>
  );
}

/** Dashed energy line on the ground from (x1,y1) to (x2,y2). */
export function Flow({
  from,
  to,
  color = ENERGY.sun,
}: {
  from: [number, number];
  to: [number, number];
  color?: string;
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const len = Math.round(Math.hypot(x2 - x1, y2 - y1));
  const ang = Math.round((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI);
  return (
    <span
      className="d3-flow"
      style={
        {
          "--c": color,
          left: x1,
          top: y1,
          width: len,
          transformOrigin: "left center",
          transform: `translateZ(2px) rotate(${ang}deg)`,
        } as Vars
      }
    />
  );
}

export function GridPole({ x, y }: { x: number; y: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translateZ(1px)" }}>
      <span className="d3-grid-pole" />
    </div>
  );
}

/* ---------- models ---------- */

/** House with a mono-pitch solar roof rising toward the back. Visible walls from the camera: front and left. */
export function House({
  x = -110,
  y = -80,
  w = 220,
  d = 160,
  h = 96,
  alpha = 24,
  cols = 4,
  rows = 3,
}: {
  x?: number;
  y?: number;
  w?: number;
  d?: number;
  h?: number;
  alpha?: number;
  cols?: number;
  rows?: number;
}) {
  const rad = deg(alpha);
  const rise = Math.round(d * Math.tan(rad));
  const L = Math.round(d / Math.cos(rad));
  const H2 = h + rise;
  const R = Math.round((rise / H2) * 1000) / 10;
  const o = 10;
  return (
    <div className="d3-model" style={{ position: "absolute", left: x, top: y }}>
      <div className="d3-shadow" style={{ left: -40, top: -10, width: w + 100, height: d + 70 }} />
      <div className="d3-box" style={{ "--w": px(w), "--d": px(d), "--h": px(h) } as Vars}>
        <i className="f front m-wall">
          <span className="d3-door" />
          <span className="d3-window" style={{ left: 24 }} />
          <span className="d3-window" style={{ right: 24 }} />
        </i>
        <i className="f back m-wall-shade" style={{ "--h": px(H2) } as Vars} />
        <i
          className="f left m-wall-shade"
          style={{ "--h": px(H2), clipPath: `polygon(0 0,100% ${R}%,100% 100%,0 100%)` } as Vars}
        >
          <span className="d3-window" style={{ left: Math.round(d / 2 - 19), top: Math.round(rise + 26) }} />
        </i>
        <i
          className="f right m-wall-shade"
          style={{ "--h": px(H2), clipPath: `polygon(0 ${R}%,100% 0,100% 100%,0 100%)` } as Vars}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: -o,
          top: -Math.round(o * Math.cos(rad)),
          width: w + 2 * o,
          height: L + 2 * o,
          transformOrigin: "0 0",
          transform: `translateZ(${H2 + Math.round(o * Math.sin(rad))}px) rotateX(-${alpha}deg)`,
        }}
      >
        <div className="m-roof" style={{ position: "absolute", inset: 0, borderRadius: 6 }} />
        <div style={{ position: "absolute", left: 18, top: 16, transform: "translateZ(3px)" }}>
          <Panels cols={cols} rows={rows} w={w - 16} h={L - 12} />
        </div>
      </div>
    </div>
  );
}

/** Battery cabinet with charge bars. */
export function Battery({
  x = -196,
  y = 4,
  w = 46,
  d = 34,
  h = 88,
}: {
  x?: number;
  y?: number;
  w?: number;
  d?: number;
  h?: number;
}) {
  return (
    <div className="d3-model" style={{ position: "absolute", left: x, top: y }}>
      <div className="d3-shadow" style={{ left: -14, top: -10, width: w + 36, height: d + 30 }} />
      <Box w={w} d={d} h={h} faces={{ front: "m-wall d3-bat-face" }} />
    </div>
  );
}

/** Hybrid inverter with a small live screen. */
export function Inverter({
  x,
  y,
  w = 74,
  d = 22,
  h = 108,
  reading = "4.2kW",
}: {
  x: number;
  y: number;
  w?: number;
  d?: number;
  h?: number;
  reading?: string;
}) {
  return (
    <div className="d3-model" style={{ position: "absolute", left: x, top: y }}>
      <Box
        w={w}
        d={d}
        h={h}
        faces={{ front: "m-wall grid place-items-center" }}
        front={
          <span className="grid h-7 w-12 place-items-center rounded-md bg-navy-900 font-label text-[11px] font-semibold text-glow-leaf shadow-[inset_0_0_0_2px_var(--color-sky-500)]">
            {reading}
          </span>
        }
      />
    </div>
  );
}

/** Commercial building: tall block, flat roof covered in panels. */
export function Building({
  x = -90,
  y = -90,
  w = 180,
  d = 180,
  h = 150,
}: {
  x?: number;
  y?: number;
  w?: number;
  d?: number;
  h?: number;
}) {
  return (
    <div className="d3-model" style={{ position: "absolute", left: x, top: y }}>
      <div className="d3-shadow" style={{ left: -30, top: -30, width: w + 80, height: d + 80 }} />
      <Box w={w} d={d} h={h} faces={{ front: "m-wall d3-glazing", left: "m-wall-shade d3-glazing" }} />
      <div style={{ position: "absolute", left: 12, top: 12, transform: `translateZ(${h + 2}px)` }}>
        <Panels cols={5} rows={5} w={w - 24} h={d - 24} />
      </div>
    </div>
  );
}

/** Factory: long low hall with a sawtooth panel roof and glass gables. */
export function Factory({
  x = -150,
  y = -80,
  w = 300,
  d = 160,
  h = 70,
  teeth = 4,
  pitch = 26,
}: {
  x?: number;
  y?: number;
  w?: number;
  d?: number;
  h?: number;
  teeth?: number;
  pitch?: number;
}) {
  const tw = Math.round(w / teeth);
  const rad = deg(pitch);
  const rise = Math.round(tw * Math.tan(rad));
  const slope = Math.round(tw / Math.cos(rad));
  return (
    <div className="d3-model" style={{ position: "absolute", left: x, top: y }}>
      <div className="d3-shadow" style={{ left: -30, top: -14, width: w + 90, height: d + 70 }} />
      <Box w={w} d={d} h={h} faces={{ front: "m-wall d3-bay", top: "m-wall-shade" }} />
      {Array.from({ length: teeth }, (_, i) => (
        <div key={i}>
          <div
            style={{
              position: "absolute",
              left: i * tw,
              top: 0,
              width: slope,
              height: d,
              transformOrigin: "0 0",
              transform: `translateZ(${h}px) rotateY(-${pitch}deg)`,
            }}
          >
            <Panels cols={3} rows={4} w={slope} h={d} />
          </div>
          <i
            className="d3-up m-glass"
            style={
              {
                left: i * tw,
                top: d,
                width: tw,
                height: rise,
                "--h": px(h + rise),
                clipPath: "polygon(100% 0,100% 100%,0 100%)",
              } as Vars
            }
          />
        </div>
      ))}
    </div>
  );
}

/* ---------- stage ---------- */

/** Perspective stage + camera rig + world. `camRef` lets client code move the camera on scroll. */
export function Scene({
  children,
  scale,
  sun,
  className,
  style,
  worldClassName,
  label,
  ground = true,
}: {
  children: ReactNode;
  scale?: number;
  sun?: ReactNode;
  className?: string;
  style?: CSSProperties;
  worldClassName?: string;
  label?: string;
  ground?: boolean;
}) {
  return (
    <div
      className={cn("d3-stage", className)}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {sun}
      <div className="d3-cam" data-d3-cam>
        <div className={cn("d3-world", worldClassName)} style={scale === undefined ? undefined : { scale }}>
          {ground ? <div className="d3-ground" /> : null}
          {children}
        </div>
      </div>
    </div>
  );
}

/** The home/solution rooftop: house, battery, energy to the home and to the grid. */
export function RooftopWorld({ houseX = -110, houseY = -80 }: { houseX?: number; houseY?: number }) {
  return (
    <>
      <House x={houseX} y={houseY} />
      <Battery x={houseX - 86} y={houseY + 84} />
      <Flow from={[houseX - 2, houseY + 102]} to={[houseX - 38, houseY + 102]} color={ENERGY.home} />
      <Flow from={[houseX + 80, houseY + 164]} to={[houseX + 14, houseY + 276]} color={ENERGY.sun} />
      <GridPole x={houseX + 8} y={houseY + 272} />
    </>
  );
}

/** Flat label pinned to a world point (x, y, z), turned back to face the camera. */
export function Pin({
  x,
  y,
  z,
  children,
  className,
}: {
  x: number;
  y: number;
  z: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateZ(${z}px)` }}>
      <div className="d3-billboard">
        <span className="d3-pin-dot" />
        <div className={cn("absolute bottom-2.5 left-0 w-max -translate-x-1/2", className)}>{children}</div>
      </div>
    </div>
  );
}
