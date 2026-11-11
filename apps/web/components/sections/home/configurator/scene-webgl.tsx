"use client";

/* eslint-disable react-hooks/immutability, react-hooks/refs --
   React Three Fiber render loop: three.js objects (materials, instances, lights, the per-frame state)
   are mutated inside useFrame on purpose, so the scene updates 60×/s without re-rendering React. */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type JSX, type ReactNode } from "react";
import * as THREE from "three";

import { ScrollTrigger } from "@/lib/gsap";
import type { CalcConfig, CalcResult, Segment } from "@/lib/solar-calc";

import { energyAt, size, type Energy, type HeroState, type Store } from "./model";

/**
 * Interactive WebGL scene for the hero configurator (desktop, lazy-loaded).
 * Reads the shared store every frame: panel count, property type, battery, time of day and brownout.
 * 1 unit = 100 px of the CSS models; floor = XZ plane, +Y up, the camera looks at the front (+Z) and left (−X) walls.
 */

export const C = {
  wall: "#ffffff",
  roof: "#1b2f63",
  frame: "#e6eef9",
  glass: "#9cc8f7",
  sun: "#ffc94a",
  home: "#5bd97a",
  export: "#ff8a00",
  import: "#6fb0ff",
  gold: "#ffc93c",
  warm: "#ffd58a",
};

/* ---------- textures ---------- */

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export const panelTexture = () =>
  canvasTexture(96, 144, (g) => {
    const grad = g.createLinearGradient(0, 0, 96, 144);
    grad.addColorStop(0, "#3a78f0");
    grad.addColorStop(0.6, "#163e9e");
    grad.addColorStop(1, "#0d2a70");
    g.fillStyle = grad;
    g.fillRect(0, 0, 96, 144);
    g.strokeStyle = "rgba(190,215,255,.5)";
    g.lineWidth = 2;
    for (let x = 0; x <= 96; x += 32) g.strokeRect(x, 0, 0, 144);
    for (let y = 0; y <= 144; y += 36) g.strokeRect(0, y, 96, 0);
    const s = g.createLinearGradient(0, 0, 96, 72);
    s.addColorStop(0, "rgba(255,255,255,.45)");
    s.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = s;
    g.fillRect(0, 0, 96, 144);
  });

const groundTexture = () =>
  canvasTexture(512, 512, (g) => {
    const r = g.createRadialGradient(256, 256, 30, 256, 256, 256);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(0.7, "rgba(234,242,255,.85)");
    r.addColorStop(1, "rgba(234,242,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 512, 512);
    g.globalCompositeOperation = "source-atop";
    g.strokeStyle = "rgba(21,83,199,.12)";
    for (let i = 0; i <= 512; i += 32) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 512);
      g.moveTo(0, i);
      g.lineTo(512, i);
      g.stroke();
    }
  });

export const glowTexture = (inner: string, outer: string) =>
  canvasTexture(256, 256, (g) => {
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, inner);
    r.addColorStop(0.35, outer);
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 256, 256);
  });

/** Curtain-wall glazing: white frame, blue glass. The glow version lights only the glass at night. */
const glazingTexture = (frame = "#ffffff", glass = "#9cc8f7") =>
  canvasTexture(128, 128, (g) => {
    g.fillStyle = frame;
    g.fillRect(0, 0, 128, 128);
    for (let x = 6; x < 128; x += 21) {
      g.fillStyle = glass;
      g.fillRect(x, 0, 12, 128);
    }
    for (let y = 0; y < 128; y += 26) {
      g.fillStyle = frame;
      g.fillRect(0, y, 128, 4);
    }
  });

/* ---------- per-frame state shared by all parts ---------- */

export type Frame = { s: HeroState; sized: CalcResult; e: Energy; t: number; night: number };
export type FrameRef = { current: Frame };

export function useFrameState(store: Store, config: CalcConfig): FrameRef {
  const cache = useRef({ key: "", sized: size(store.get(), config) });
  const ref = useRef<Frame>(null as unknown as Frame);
  if (!ref.current) {
    const s = store.get();
    ref.current = { s, sized: cache.current.sized, e: energyAt(s, cache.current.sized, config), t: 0, night: 0 };
  }
  useFrame(({ clock }, dt) => {
    const s = store.get();
    const key = `${s.bill}|${s.segment}|${s.battery}`;
    if (key !== cache.current.key) cache.current = { key, sized: size(s, config) };
    const e = energyAt(s, cache.current.sized, config);
    const f = ref.current;
    const targetNight = e.daylight < 0.12 ? 1 : 0;
    f.night += (targetNight - f.night) * Math.min(1, dt * 3);
    f.s = s;
    f.sized = cache.current.sized;
    f.e = e;
    f.t = clock.elapsedTime;
  }, -1);
  return ref;
}

/* ---------- roof panels: instanced, drop in when the count grows ---------- */

type RoofSpec = { cols: number; rows: number; cw: number; cd: number; gap: number };

function RoofPanels({ frame, spec, max, mat }: { frame: FrameRef; spec: RoofSpec; max: number; mat: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const spawn = useRef<number[]>([]);
  const shown = useRef(0);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const { sized, t } = frame.current;
    const n = Math.min(max, Math.max(1, sized.panels));
    if (n !== shown.current) {
      for (let i = shown.current; i < n; i++) spawn.current[i] = t + (i - shown.current) * 0.035;
      shown.current = n;
    }
    // Lay the panels out as a centred grid that grows row by row.
    const cols = Math.min(spec.cols, Math.max(2, Math.ceil(Math.sqrt(n * (spec.cols / spec.rows)))));
    const rows = Math.ceil(n / cols);
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const inRow = r === rows - 1 ? n - r * cols : cols;
      const x = (c - (inRow - 1) / 2) * (spec.cw + spec.gap);
      const z = (r - (rows - 1) / 2) * (spec.cd + spec.gap);
      const k = Math.min(1, Math.max(0, (t - (spawn.current[i] ?? 0)) / 0.45));
      const drop = (1 - k) ** 2 * 0.9;
      tmp.position.set(x, 0.015 + drop, z);
      tmp.scale.setScalar(0.6 + 0.4 * k);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, max]} castShadow material={mat}>
      <boxGeometry args={[spec.cw, 0.014, spec.cd]} />
    </instancedMesh>
  );
}

/* ---------- windows that light up at night (and go dark in a brownout) ---------- */

function useLitMaterial(frame: FrameRef, color = C.glass) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: new THREE.Color(C.warm),
        emissiveIntensity: 0,
        roughness: 0.25,
        metalness: 0.3,
      }),
    [color],
  );
  useFrame(() => {
    const { night, e } = frame.current;
    mat.emissiveIntensity = e.dark ? 0 : night * 1.4;
    mat.color.set(e.dark && night > 0.5 ? "#1c2a5c" : color);
  });
  return mat;
}

/* ---------- models ---------- */

export function House({ frame, panelMat }: { frame: FrameRef; panelMat: THREE.Material }) {
  const w = 220,
    d = 160,
    h = 96,
    alpha = 24;
  const rise = d * Math.tan((alpha * Math.PI) / 180);
  const H2 = h + rise;
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(d / 100, 0);
    s.lineTo(d / 100, h / 100);
    s.lineTo(0, H2 / 100);
    s.closePath();
    return s;
  }, [H2]);
  const roofLen = d / Math.cos((alpha * Math.PI) / 180);
  const lit = useLitMaterial(frame);
  return (
    <group>
      <mesh castShadow receiveShadow rotation={[0, -Math.PI / 2, 0]} position={[w / 200, 0, -d / 200]}>
        <extrudeGeometry args={[shape, { depth: w / 100, bevelEnabled: false }]} />
        <meshStandardMaterial color={C.wall} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.26, d / 200 + 0.002]}>
        <planeGeometry args={[0.3, 0.52]} />
        <meshStandardMaterial color="#0b1f4d" />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.67, 0.55, d / 200 + 0.002]} material={lit}>
          <planeGeometry args={[0.38, 0.3]} />
        </mesh>
      ))}
      <mesh position={[-w / 200 - 0.002, 0.95, 0]} rotation={[0, -Math.PI / 2, 0]} material={lit}>
        <planeGeometry args={[0.38, 0.3]} />
      </mesh>
      <group position={[0, (h + rise / 2) / 100 + 0.03, 0]} rotation={[(alpha * Math.PI) / 180, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[(w + 20) / 100, 0.05, (roofLen + 20) / 100]} />
          <meshStandardMaterial color={C.roof} roughness={0.7} />
        </mesh>
        <group position={[0, 0.026, 0]}>
          <RoofPanels
            frame={frame}
            spec={{ cols: 6, rows: 4, cw: 0.31, cd: 0.36, gap: 0.03 }}
            max={24}
            mat={panelMat}
          />
        </group>
      </group>
      {/* inverter on the left wall */}
      <mesh castShadow position={[-w / 200 - 0.06, 0.62, 0.35]}>
        <boxGeometry args={[0.1, 0.36, 0.26]} />
        <meshStandardMaterial color="#f4f8ff" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function Building({ frame, panelMat }: { frame: FrameRef; panelMat: THREE.Material }) {
  const glaze = useMemo(() => ({ map: glazingTexture(), glow: glazingTexture("#000000", "#ffffff") }), []);
  const lit = useLitMaterial(frame, "#ffffff");
  useEffect(() => {
    lit.map = glaze.map;
    lit.emissiveMap = glaze.glow;
    lit.needsUpdate = true;
    return () => {
      glaze.map.dispose();
      glaze.glow.dispose();
    };
  }, [glaze, lit]);
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.75, 0]} material={lit}>
        <boxGeometry args={[1.8, 1.5, 1.8]} />
      </mesh>
      <mesh position={[0, 1.51, 0]}>
        <boxGeometry args={[1.84, 0.03, 1.84]} />
        <meshStandardMaterial color="#e6eef9" />
      </mesh>
      <group position={[0, 1.53, 0]}>
        <RoofPanels frame={frame} spec={{ cols: 7, rows: 7, cw: 0.21, cd: 0.21, gap: 0.025 }} max={49} mat={panelMat} />
      </group>
    </group>
  );
}

export function Factory({ frame, panelMat }: { frame: FrameRef; panelMat: THREE.Material }) {
  const lit = useLitMaterial(frame);
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.36, 0]}>
        <boxGeometry args={[3, 0.72, 1.6]} />
        <meshStandardMaterial color={C.wall} roughness={0.85} />
      </mesh>
      {[-1.05, -0.35, 0.35, 1.05].map((x) => (
        <mesh key={x} position={[x, 0.3, 0.801]} material={lit}>
          <planeGeometry args={[0.46, 0.34]} />
        </mesh>
      ))}
      <group position={[0, 0.735, 0]}>
        <RoofPanels frame={frame} spec={{ cols: 10, rows: 5, cw: 0.26, cd: 0.27, gap: 0.03 }} max={50} mat={panelMat} />
      </group>
    </group>
  );
}

/** Small neighbour house: lights on at night unless the grid is down. */
export function Neighbour({
  frame,
  position,
  rot = 0,
}: {
  frame: FrameRef;
  position: [number, number, number];
  rot?: number;
}) {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: C.glass, emissive: new THREE.Color(C.warm), emissiveIntensity: 0 }),
    [],
  );
  useFrame(() => {
    const { night, s } = frame.current;
    mat.emissiveIntensity = s.brownout ? 0 : night * 1.2;
    mat.color.set(s.brownout && night > 0.5 ? "#1c2a5c" : C.glass);
  });
  const roof = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.62, 0);
    sh.lineTo(0, 0.42);
    sh.lineTo(0.62, 0);
    sh.closePath();
    return sh;
  }, []);
  return (
    <group position={position} rotation={[0, rot, 0]} scale={0.8}>
      <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[1.1, 0.7, 0.9]} />
        <meshStandardMaterial color="#f2f6fd" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.7, -0.5]}>
        <extrudeGeometry args={[roof, { depth: 1.0, bevelEnabled: false }]} />
        <meshStandardMaterial color="#c9d4f2" roughness={0.8} />
      </mesh>
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} position={[x, 0.38, 0.452]} material={mat}>
          <planeGeometry args={[0.24, 0.2]} />
        </mesh>
      ))}
    </group>
  );
}

export function Battery({ frame, position }: { frame: FrameRef; position: [number, number, number] }) {
  const g = useRef<THREE.Group>(null);
  const bars = useMemo(
    () =>
      [0, 1, 2, 3].map(
        () =>
          new THREE.MeshStandardMaterial({ color: C.home, emissive: new THREE.Color(C.home), emissiveIntensity: 0.2 }),
      ),
    [],
  );
  const scale = useRef(0);
  useFrame(({ clock }, dt) => {
    const { s, e } = frame.current;
    scale.current += ((s.battery ? 1 : 0) - scale.current) * Math.min(1, dt * 7);
    if (g.current) {
      g.current.scale.setScalar(Math.max(0.0001, scale.current));
      g.current.visible = scale.current > 0.01;
    }
    const level = Math.ceil(e.soc * 4);
    const pulse = e.chargeKw > 0.05 || e.dischargeKw > 0.05 ? 0.5 + 0.5 * Math.sin(clock.elapsedTime * 5) : 1;
    bars.forEach((m, i) => (m.emissiveIntensity = i < level ? (i === level - 1 ? 0.4 + 0.9 * pulse : 1.2) : 0.05));
  });
  return (
    <group ref={g} position={position}>
      <mesh castShadow receiveShadow position={[0, 0.44, 0]}>
        <boxGeometry args={[0.46, 0.88, 0.34]} />
        <meshStandardMaterial color={C.wall} roughness={0.8} />
      </mesh>
      {bars.map((m, i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.15, 0.171]} material={m}>
          <planeGeometry args={[0.28, 0.07]} />
        </mesh>
      ))}
    </group>
  );
}

export function GridPole({ frame, position }: { frame: FrameRef; position: [number, number, number] }) {
  const lamp = useMemo(() => new THREE.MeshBasicMaterial({ color: C.export, toneMapped: false }), []);
  useFrame(({ clock }) => {
    const { s } = frame.current;
    lamp.color.set(s.brownout ? (Math.sin(clock.elapsedTime * 6) > 0 ? "#ff3b30" : "#5a1410") : C.export);
  });
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 1.4, 10]} />
        <meshStandardMaterial color="#8e9cc2" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.32, 0]}>
        <boxGeometry args={[0.5, 0.04, 0.04]} />
        <meshStandardMaterial color="#8e9cc2" />
      </mesh>
      <mesh position={[0, 1.42, 0]} material={lamp}>
        <sphereGeometry args={[0.05, 12, 12]} />
      </mesh>
    </group>
  );
}

/* ---------- energy flows: glowing beads along an arc ---------- */

export function Flow({
  frame,
  from,
  to,
  color,
  power,
  lift = 0.25,
}: {
  frame: FrameRef;
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  power: (e: Energy) => number;
  lift?: number;
}) {
  const N = 9;
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const level = useRef(0);
  const phase = useRef(0);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const kw = power(frame.current.e);
    const target = kw > 0.03 ? Math.min(1, 0.35 + kw / 4) : 0;
    level.current += (target - level.current) * Math.min(1, dt * 4);
    phase.current += dt * (0.25 + level.current * 0.45);
    for (let i = 0; i < N; i++) {
      const t = (phase.current + i / N) % 1;
      tmp.position.lerpVectors(from, to, t);
      tmp.position.y += Math.sin(t * Math.PI) * lift;
      tmp.scale.setScalar(level.current * (0.35 + 0.65 * Math.sin(t * Math.PI)));
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    m.visible = level.current > 0.01;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <sphereGeometry args={[0.034, 12, 12]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}

/* ---------- property layouts ---------- */

type Layout = {
  battery: [number, number, number];
  pole: [number, number, number];
  roof: THREE.Vector3;
  heart: THREE.Vector3;
};
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const LAYOUT: Record<Segment, Layout> = {
  residential: { battery: [-1.73, 0, 0.21], pole: [2.25, 0, 1.25], roof: V(0, 1.45, 0), heart: V(-0.2, 0.55, 0.6) },
  commercial: { battery: [-1.35, 0, 0.75], pole: [2.0, 0, 1.6], roof: V(0, 1.6, 0), heart: V(-0.3, 0.6, 0.85) },
  industrial: { battery: [-1.95, 0, 0.55], pole: [2.75, 0, 1.45], roof: V(0, 0.8, 0), heart: V(-0.6, 0.4, 0.75) },
};

/** Swaps the model with a quick shrink → grow when the property type changes. */
function PropertySwap({ frame, children }: { frame: FrameRef; children: (seg: Segment) => JSX.Element }) {
  const g = useRef<THREE.Group>(null);
  const [seg, setSeg] = useState<Segment>(frame.current.s.segment);
  const k = useRef(1);
  useFrame((_, dt) => {
    const want = frame.current.s.segment;
    if (want !== seg) {
      k.current -= dt * 6;
      if (k.current <= 0) {
        k.current = 0;
        setSeg(want);
      }
    } else k.current = Math.min(1, k.current + dt * 4);
    const e = k.current;
    const s = e < 1 ? e * (1 + 0.12 * Math.sin(e * Math.PI)) : 1;
    g.current?.scale.set(s || 0.0001, s || 0.0001, s || 0.0001);
  });
  return <group ref={g}>{children(seg)}</group>;
}

/* ---------- camera, sun, light ---------- */

const ELEV = (30 * Math.PI) / 180;
const AZ = (38 * Math.PI) / 180;

function Rig({
  frame,
  scroll,
  drag,
  sun,
  glow,
  moon,
  light,
  hemi,
  pins,
  onFirstFrame,
}: {
  frame: FrameRef;
  scroll: { current: number };
  drag: { current: { az: number; el: number } };
  sun: { current: THREE.Mesh | null };
  glow: { current: THREE.Sprite | null };
  moon: { current: THREE.Mesh | null };
  light: { current: THREE.DirectionalLight | null };
  hemi: { current: THREE.HemisphereLight | null };
  pins: { current: { el: HTMLElement | null; at: () => THREE.Vector3 | null }[] };
  onFirstFrame: () => void;
}) {
  const { camera, size: view } = useThree();
  const v = useMemo(
    () => ({
      target: V(-0.35, 0.5, 0.2),
      fwd: V(0, 0, 0),
      right: V(0, 0, 0),
      up: V(0, 0, 0),
      tmp: V(0, 0, 0),
      sm: { p: 0, az: 0, el: 0, hour: 12 },
    }),
    [],
  );
  const frames = useRef(0);
  const dayHemi = useMemo(() => new THREE.Color("#eef6ff"), []);
  const nightHemi = useMemo(() => new THREE.Color("#33457f"), []);
  useFrame(({ clock }, dt) => {
    const { s, night } = frame.current;
    const sm = v.sm;
    const k = Math.min(1, dt * 6);
    sm.p += (scroll.current - sm.p) * k;
    sm.az += (drag.current.az - sm.az) * k;
    sm.el += (drag.current.el - sm.el) * k;
    sm.hour += (s.hour - sm.hour) * Math.min(1, dt * 8);

    const sway = Math.sin(clock.elapsedTime * 0.4) * 0.05;
    const az = AZ + sway - sm.p * 0.15 + sm.az;
    const el = ELEV + sm.p * 0.2 + sm.el;
    // Frame the model for the canvas shape: narrower canvases pull the camera back.
    const aspectPad = Math.max(0, 1.15 - view.width / view.height) * 9;
    const dist = 19 + aspectPad - sm.p * 1.6 + (s.segment === "industrial" ? 2 : s.segment === "commercial" ? 1.2 : 0);
    const { target, fwd, right, up, tmp } = v;
    camera.position.set(
      target.x - Math.sin(az) * Math.cos(el) * dist,
      target.y + Math.sin(el) * dist,
      target.z + Math.cos(az) * Math.cos(el) * dist,
    );
    camera.lookAt(target);
    camera.updateMatrixWorld();
    camera.getWorldDirection(fwd);
    right.crossVectors(fwd, camera.up).normalize();
    up.crossVectors(right, fwd).normalize();

    // Sun on an arc from 6:00 to 18:00; below the horizon at night. The moon rises after dusk.
    const sp = (sm.hour - 6) / 12;
    const sx = (sp - 0.5) * 6.6;
    const sy = 0.2 + Math.sin(Math.min(1, Math.max(0, sp)) * Math.PI) * 2.6 - (sp < 0 || sp > 1 ? 1.2 : 0);
    tmp.copy(target).addScaledVector(fwd, 4).addScaledVector(right, sx).addScaledVector(up, sy);
    sun.current?.position.copy(tmp);
    glow.current?.position.copy(tmp);
    const sunVis = 1 - night;
    if (sun.current) sun.current.visible = sunVis > 0.05;
    if (glow.current) (glow.current.material as THREE.SpriteMaterial).opacity = sunVis;
    if (moon.current) {
      moon.current.visible = night > 0.05;
      moon.current.position.copy(target).addScaledVector(fwd, 5).addScaledVector(right, 2.4).addScaledVector(up, 2.3);
    }
    // Key light from the camera side, following the sun across; dims at night.
    const daylight = frame.current.e.daylight;
    if (light.current) {
      light.current.position
        .copy(target)
        .addScaledVector(fwd, -6)
        .addScaledVector(up, 7)
        .addScaledVector(right, sx * 0.8 - 1.5);
      light.current.intensity = 0.25 + 2.6 * Math.min(1, daylight * 1.6);
      light.current.color.setHSL(0.09, 0.9 - 0.75 * Math.min(1, daylight * 1.8), 0.75 + 0.15 * daylight);
    }
    if (hemi.current) {
      hemi.current.intensity = 0.7 + 1.5 * Math.min(1, daylight * 1.6);
      hemi.current.color.copy(nightHemi).lerp(dayHemi, 1 - night);
    }
    // Labels follow their anchors.
    pins.current.forEach(({ el, at }) => {
      const p = at();
      if (!el) return;
      if (!p) {
        el.style.opacity = "0";
        return;
      }
      tmp.copy(p).project(camera);
      el.style.opacity = "1";
      el.style.transform = `translate3d(${((tmp.x + 1) / 2) * view.width}px, ${((1 - tmp.y) / 2) * view.height}px, 0)`;
    });
    if (frames.current < 3 && ++frames.current === 2) onFirstFrame();
  });
  return null;
}

/* ---------- world ---------- */

function World({
  store,
  config,
  scroll,
  drag,
  pins,
  onFirstFrame,
}: {
  store: Store;
  config: CalcConfig;
  scroll: { current: number };
  drag: { current: { az: number; el: number } };
  pins: { current: { el: HTMLElement | null; at: () => THREE.Vector3 | null }[] };
  onFirstFrame: () => void;
}) {
  const frame = useFrameState(store, config);
  const tex = useMemo(
    () => ({
      panel: panelTexture(),
      ground: groundTexture(),
      glow: glowTexture("rgba(255,230,150,1)", "rgba(255,178,26,.55)"),
    }),
    [],
  );
  const panelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex.panel,
        roughness: 0.25,
        metalness: 0.55,
        emissive: new THREE.Color("#1e4fd8"),
        emissiveIntensity: 0.15,
      }),
    [tex.panel],
  );
  useEffect(() => () => Object.values(tex).forEach((t) => t.dispose()), [tex]);
  useFrame(({ clock }) => {
    const { e } = frame.current;
    panelMat.emissiveIntensity = 0.05 + e.daylight * (0.22 + 0.08 * Math.sin(clock.elapsedTime * 2));
  });

  const sun = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Sprite>(null);
  const moon = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);

  // Anchor points for the HUD labels (per property type).
  useEffect(() => {
    const L = () => LAYOUT[frame.current.s.segment];
    const list = pins.current;
    if (list[0])
      list[0].at = () =>
        L()
          .roof.clone()
          .add(V(0, 0.55, 0));
    if (list[1]) list[1].at = () => (frame.current.s.battery ? V(L().battery[0], 1.05, L().battery[2]) : null);
    if (list[2]) list[2].at = () => V(L().pole[0], 1.55, L().pole[2]);
  }, [frame, pins]);

  const L = (seg: Segment) => LAYOUT[seg];
  return (
    <>
      <Rig
        frame={frame}
        scroll={scroll}
        drag={drag}
        sun={sun}
        glow={glow}
        moon={moon}
        light={light}
        hemi={hemi}
        pins={pins}
        onFirstFrame={onFirstFrame}
      />
      <hemisphereLight ref={hemi} args={["#eef6ff", "#fff1d6", 2.2]} />
      <directionalLight
        ref={light}
        castShadow
        intensity={2.8}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-radius={6}
        shadow-bias={-0.0006}
      />
      <mesh ref={sun}>
        <sphereGeometry args={[0.72, 48, 48]} />
        <meshBasicMaterial color={C.sun} toneMapped={false} />
      </mesh>
      <sprite ref={glow} scale={[4.4, 4.4, 1]}>
        <spriteMaterial map={tex.glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh ref={moon}>
        <sphereGeometry args={[0.36, 32, 32]} />
        <meshBasicMaterial color="#f3f6ff" toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial map={tex.ground} transparent roughness={1} />
      </mesh>
      <Neighbour frame={frame} position={[2.7, 0, -2.0]} rot={-0.2} />
      <Neighbour frame={frame} position={[-3.1, 0, -2.4]} rot={0.15} />
      <PropertySwap frame={frame}>
        {(seg) => (
          <>
            {seg === "residential" ? (
              <House frame={frame} panelMat={panelMat} />
            ) : seg === "commercial" ? (
              <Building frame={frame} panelMat={panelMat} />
            ) : (
              <Factory frame={frame} panelMat={panelMat} />
            )}
            <Battery frame={frame} position={L(seg).battery} />
            <GridPole frame={frame} position={L(seg).pole} />
            <Flow
              frame={frame}
              from={L(seg).roof}
              to={L(seg).heart}
              color={C.gold}
              power={(e) => e.toHomeKw}
              lift={0.1}
            />
            <Flow
              frame={frame}
              from={L(seg).heart}
              to={V(L(seg).pole[0], 1.3, L(seg).pole[2])}
              color={C.export}
              power={(e) => e.exportKw}
            />
            <Flow
              frame={frame}
              from={V(L(seg).pole[0], 1.3, L(seg).pole[2])}
              to={L(seg).heart}
              color={C.import}
              power={(e) => e.importKw}
            />
            <Flow
              frame={frame}
              from={L(seg).heart}
              to={V(L(seg).battery[0], 0.7, L(seg).battery[2])}
              color={C.home}
              power={(e) => e.chargeKw}
              lift={0.15}
            />
            <Flow
              frame={frame}
              from={V(L(seg).battery[0], 0.7, L(seg).battery[2])}
              to={L(seg).heart}
              color={C.home}
              power={(e) => e.dischargeKw}
              lift={0.15}
            />
          </>
        )}
      </PropertySwap>
    </>
  );
}

/* ---------- canvas + labels + drag ---------- */

export default function SceneWebgl({
  store,
  config,
  labels,
  onReady,
}: {
  store: Store;
  config: CalcConfig;
  labels: ReactNode[];
  onReady: () => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const scroll = useRef(0);
  const drag = useRef({ az: 0, el: 0 });
  const pins = useRef(labels.map(() => ({ el: null as HTMLElement | null, at: () => null as THREE.Vector3 | null })));
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = wrap.current;
    const section = el?.closest("section");
    if (!el || !section) return;
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      onUpdate: (s) => (scroll.current = s.progress),
    });
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => {
      st.kill();
      io.disconnect();
    };
  }, []);

  // Drag to turn the model (pointer devices); double-click resets.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let start: { x: number; y: number; az: number; el: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      start = { x: e.clientX, y: e.clientY, az: drag.current.az, el: drag.current.el };
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = "true";
    };
    const move = (e: PointerEvent) => {
      if (!start) return;
      drag.current = {
        az: Math.max(-0.75, Math.min(0.75, start.az - (e.clientX - start.x) / 260)),
        el: Math.max(-0.12, Math.min(0.3, start.el + (e.clientY - start.y) / 500)),
      };
    };
    const up = () => {
      start = null;
      delete el.dataset.dragging;
    };
    const reset = () => (drag.current = { az: 0, el: 0 });
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("dblclick", reset);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("dblclick", reset);
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0 cursor-grab data-[dragging=true]:cursor-grabbing">
      <Canvas
        shadows="soft"
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 22, near: 0.1, far: 80, position: [-6, 7, 12] }}
        frameloop={inView ? "always" : "never"}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        <World store={store} config={config} scroll={scroll} drag={drag} pins={pins} onFirstFrame={onReady} />
      </Canvas>
      {labels.map((node, k) => (
        <div
          key={k}
          ref={(el) => {
            pins.current[k].el = el;
          }}
          className="pointer-events-none absolute top-0 left-0 z-[2] opacity-0 transition-opacity duration-300 will-change-transform"
        >
          <div className="-translate-x-1/2 -translate-y-[calc(100%+10px)]">{node}</div>
        </div>
      ))}
    </div>
  );
}
