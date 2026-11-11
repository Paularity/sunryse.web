"use client";

/* eslint-disable react-hooks/immutability --
   React Three Fiber render loop: three.js objects (camera, materials, lights, point buffers) and the
   per-frame stores are mutated inside useFrame on purpose, so scrolling never re-renders React. */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import {
  Battery,
  Building,
  C,
  Factory,
  Flow,
  GridPole,
  House,
  Neighbour,
  glowTexture,
  panelTexture,
  useFrameState,
  type FrameRef,
} from "@/components/sections/home/configurator/scene-webgl";
import { createStore, skyAt, solarFactor, type Store } from "@/components/sections/home/configurator/model";
import type { CalcConfig } from "@/lib/solar-calc";

import { shotAt, STATIONS } from "./stations";

/**
 * "A day on solar" — a floating low-poly island scrubbed by scroll.
 * Everything is built in code (no downloaded models or textures). The home, office and factory reuse the
 * homepage configurator's parts, so panel counts and energy flows follow the same calculator numbers.
 */

export type Anchor = "roof" | "inverter" | "battery" | "pole" | "street" | "office" | "factory";
export type StoryPin = { el: HTMLElement | null; anchor: Anchor; chapter: number };
type R<T> = { current: T };

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* ---------- layout (world units; island top at y = 0) ---------- */

const HOME_BATTERY: [number, number, number] = [-1.73, 0, 0.21];
const HOME_POLE: [number, number, number] = [2.25, 0, 1.25];
const POLE_2: [number, number, number] = [4.3, 0, 1.75];
const OFFICE: [number, number, number] = [-2.25, 0, -3.45];
const FACTORY: [number, number, number] = [2.3, 0, -3.85];
const NEIGHBOURS: { p: [number, number, number]; r: number }[] = [
  { p: [4.7, 0, -0.5], r: -0.55 },
  { p: [-4.5, 0, 1.6], r: 0.45 },
  { p: [5.3, 0, 3.4], r: -0.9 },
];

const ANCHORS: Record<Anchor, THREE.Vector3> = {
  roof: V(0, 1.5, 0.35),
  inverter: V(-1.2, 1.25, 0.45),
  battery: V(HOME_BATTERY[0], 0.95, HOME_BATTERY[2]),
  pole: V(HOME_POLE[0], 1.6, HOME_POLE[2]),
  street: V(NEIGHBOURS[0].p[0], 1.15, NEIGHBOURS[0].p[2]),
  office: V(OFFICE[0], 2.05, OFFICE[2]),
  factory: V(FACTORY[0], 1.2, FACTORY[2]),
};

const TREES: [number, number, number, number][] = [
  [-5.6, 0, -2.6, 1.1],
  [-5.0, 0, -4.3, 0.9],
  [-0.4, 0, -5.7, 1.2],
  [4.9, 0, -2.3, 1],
  [6.0, 0, 0.9, 0.85],
  [-2.9, 0, 4.7, 1],
  [-5.9, 0, 3.4, 0.9],
  [0.25, 0, -2.25, 0.75],
  [-1.2, 0, -6.2, 0.8],
];
const PALMS: [number, number, number, number][] = [
  [-4.3, 0, 4.5, 0],
  [3.4, 0, 4.6, 2],
  [1.7, 0, 5.8, 4],
  [-1.7, 0, 6.0, 1],
  [6.3, 0, -1.8, 3],
];
const ROCKS: [number, number, number, number][] = [
  [-6.3, 0, 0.6, 0.34],
  [2.9, 0, 6.2, 0.28],
  [-4.0, 0, -5.4, 0.4],
  [5.6, 0, -3.9, 0.32],
  [-6.0, 0, -1.2, 0.22],
];

/* ---------- small helpers ---------- */

/** Deterministic pseudo-random numbers (same island every load). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wobbly coastline: radius factor for an angle. */
const coast = (a: number) => 1 + 0.06 * Math.sin(3 * a + 0.4) + 0.04 * Math.sin(5 * a + 1.3) + 0.02 * Math.sin(9 * a);

function shapeIsland(geo: THREE.BufferGeometry, crag: number, seed: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const rand = rng(seed);
  const memo = new Map<string, [number, number, number]>();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    // Same point (seams, shared rings) → same offset, so the mesh stays closed.
    const key = `${x.toFixed(3)}|${y.toFixed(3)}|${z.toFixed(3)}`;
    let o = memo.get(key);
    if (!o) {
      const k = coast(Math.atan2(z, x));
      const j = crag ? 1 + (rand() - 0.5) * crag : 1;
      o = [x * k * j, y + (crag ? (rand() - 0.5) * crag * 1.2 : 0), z * k * j];
      memo.set(key, o);
    }
    pos.setXYZ(i, o[0], o[1], o[2]);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ---------- island, nature, props ---------- */

function Island() {
  const geo = useMemo(() => {
    const top = shapeIsland(new THREE.CylinderGeometry(7, 7, 0.32, 18, 1), 0, 1);
    const soil = shapeIsland(new THREE.CylinderGeometry(6.98, 6.55, 0.7, 18, 1), 0, 2);
    const rock = new THREE.ConeGeometry(6.55, 5.8, 18, 5);
    rock.rotateX(Math.PI);
    // Keep the top ring flush with the soil; crag everything below it.
    const pos = rock.attributes.position as THREE.BufferAttribute;
    const rand = rng(7);
    const memo = new Map<string, [number, number, number]>();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      const key = `${x.toFixed(3)}|${y.toFixed(3)}|${z.toFixed(3)}`;
      let o = memo.get(key);
      if (!o) {
        const k = coast(Math.atan2(z, x));
        const topRing = y > 2.8;
        const j = topRing ? 1 : 1 + (rand() - 0.5) * 0.28;
        o = [x * k * j, y + (topRing ? 0 : (rand() - 0.5) * 0.5), z * k * j];
        memo.set(key, o);
      }
      pos.setXYZ(i, o[0], o[1], o[2]);
    }
    rock.computeVertexNormals();
    return { top, soil, rock };
  }, []);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);
  return (
    <group>
      <mesh geometry={geo.top} position={[0, -0.16, 0]} receiveShadow>
        <meshStandardMaterial color="#a3dc84" roughness={1} flatShading />
      </mesh>
      <mesh geometry={geo.soil} position={[0, -0.67, 0]}>
        <meshStandardMaterial color="#e6bf8f" roughness={1} flatShading />
      </mesh>
      <mesh geometry={geo.rock} position={[0, -1.02 - 2.9, 0]}>
        <meshStandardMaterial color="#c9a37e" roughness={1} flatShading />
      </mesh>
      {/* footpath from the door to the edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 3.95]} receiveShadow>
        <planeGeometry args={[0.62, 6.1]} />
        <meshStandardMaterial color="#f4ead8" roughness={1} />
      </mesh>
      {/* driveway */}
      <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[1.25, 0.007, 2.25]} receiveShadow>
        <planeGeometry args={[1.0, 1.6]} />
        <meshStandardMaterial color="#e3e8f2" roughness={1} />
      </mesh>
    </group>
  );
}

function Trees() {
  const m = useMemo(
    () => ({
      trunk: new THREE.MeshStandardMaterial({ color: "#a47a55", roughness: 1, flatShading: true }),
      leaf: new THREE.MeshStandardMaterial({ color: "#5fbf6a", roughness: 1, flatShading: true }),
      leaf2: new THREE.MeshStandardMaterial({ color: "#7fd27a", roughness: 1, flatShading: true }),
      palm: new THREE.MeshStandardMaterial({
        color: "#4cae64",
        roughness: 1,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
      rock: new THREE.MeshStandardMaterial({ color: "#b9c2d6", roughness: 1, flatShading: true }),
    }),
    [],
  );
  const palmTrunk = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(V(0, 0, 0), V(0.05, 0.55, 0), V(0.28, 1.05, 0));
    return new THREE.TubeGeometry(curve, 8, 0.045, 6, false);
  }, []);
  useEffect(
    () => () => {
      Object.values(m).forEach((x) => x.dispose());
      palmTrunk.dispose();
    },
    [m, palmTrunk],
  );
  return (
    <group>
      {TREES.map(([x, y, z, s], i) => (
        <group key={`t${i}`} position={[x, y, z]} scale={s} rotation={[0, i * 1.7, 0]}>
          <mesh castShadow position={[0, 0.22, 0]} material={m.trunk}>
            <cylinderGeometry args={[0.05, 0.08, 0.44, 6]} />
          </mesh>
          <mesh castShadow position={[0, 0.72, 0]} material={i % 2 ? m.leaf : m.leaf2}>
            <icosahedronGeometry args={[0.4, 0]} />
          </mesh>
          <mesh castShadow position={[0.16, 0.98, 0.06]} material={i % 2 ? m.leaf2 : m.leaf}>
            <icosahedronGeometry args={[0.26, 0]} />
          </mesh>
        </group>
      ))}
      {PALMS.map(([x, y, z, rot], i) => (
        <group key={`p${i}`} position={[x, y, z]} rotation={[0, rot, 0]}>
          <mesh castShadow geometry={palmTrunk} material={m.trunk} />
          <group position={[0.28, 1.06, 0]}>
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <mesh
                key={k}
                castShadow
                material={m.palm}
                rotation={[0, (k / 6) * Math.PI * 2, 1.15 + (k % 2) * 0.25]}
                position={[0, 0, 0]}
              >
                <coneGeometry args={[0.1, 0.8, 3, 1, true]} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      {ROCKS.map(([x, y, z, s], i) => (
        <mesh
          key={`r${i}`}
          castShadow
          receiveShadow
          position={[x, y + s * 0.4, z]}
          scale={[s, s * 0.75, s]}
          rotation={[i, i * 2, 0]}
          material={m.rock}
        >
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </group>
  );
}

/** EV + home charger in the driveway: charges from the panels while the sun is up. */
function Car({ frame }: { frame: FrameRef }) {
  const screen = useMemo(() => new THREE.MeshBasicMaterial({ color: C.home, toneMapped: false }), []);
  useFrame(({ clock }) => {
    const on = frame.current.e.toHomeKw > 0.05;
    screen.color.set(on ? (Math.sin(clock.elapsedTime * 3) > -0.3 ? C.home : "#2f8f4c") : "#7f8aa8");
  });
  return (
    <group>
      <group position={[1.32, 0, 2.3]} rotation={[0, 0.3 + Math.PI / 2, 0]}>
        <mesh castShadow position={[0, 0.19, 0]}>
          <boxGeometry args={[0.95, 0.2, 0.44]} />
          <meshStandardMaterial color="#1a3478" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh castShadow position={[-0.05, 0.36, 0]}>
          <boxGeometry args={[0.52, 0.16, 0.4]} />
          <meshStandardMaterial color="#9cc8f7" roughness={0.2} metalness={0.4} />
        </mesh>
        {[-0.3, 0.3].flatMap((x) =>
          [-0.22, 0.22].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.09, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.06, 12]} />
              <meshStandardMaterial color="#0b1f4d" roughness={0.8} />
            </mesh>
          )),
        )}
      </group>
      {/* wall charger post */}
      <group position={[0.95, 0, 1.2]}>
        <mesh castShadow position={[0, 0.24, 0]}>
          <boxGeometry args={[0.1, 0.48, 0.08]} />
          <meshStandardMaterial color="#f4f8ff" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.36, 0.041]} material={screen}>
          <planeGeometry args={[0.05, 0.05]} />
        </mesh>
      </group>
      <Flow
        frame={frame}
        from={V(0.95, 0.36, 1.25)}
        to={V(1.15, 0.3, 2.05)}
        color={C.home}
        power={(e) => (e.toHomeKw > 0.05 ? 0.6 : 0)}
        lift={0.12}
      />
    </group>
  );
}

/** Grid street lamps: warm at night, dark in a brownout. */
function StreetLamps({ frame, glow }: { frame: FrameRef; glow: THREE.Texture }) {
  const bulb = useMemo(() => new THREE.MeshBasicMaterial({ color: C.warm, toneMapped: false }), []);
  const halo = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: glow,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
        fog: false,
      }),
    [glow],
  );
  useFrame(() => {
    const { night, s } = frame.current;
    const on = s.brownout ? 0 : night;
    bulb.color.set(on > 0.3 ? C.warm : "#5d6787");
    halo.opacity = on * 0.9;
  });
  const lamps: [number, number][] = [
    [0.58, 3.0],
    [-0.58, 4.9],
    [3.3, 1.5],
  ];
  return (
    <group>
      {lamps.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh castShadow position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.018, 0.024, 0.84, 6]} />
            <meshStandardMaterial color="#8e9cc2" />
          </mesh>
          <mesh position={[0, 0.86, 0]} material={bulb}>
            <sphereGeometry args={[0.045, 10, 10]} />
          </mesh>
          <sprite position={[0, 0.86, 0]} scale={[0.7, 0.7, 1]} material={halo} />
        </group>
      ))}
    </group>
  );
}

/** Overhead wires: house → pole → pole → neighbours. */
function Wires() {
  const line = useMemo(() => {
    const sag = (a: THREE.Vector3, b: THREE.Vector3, drop = 0.12) =>
      Array.from({ length: 13 }, (_, i) => {
        const t = i / 12;
        return a
          .clone()
          .lerp(b, t)
          .add(V(0, -Math.sin(t * Math.PI) * drop, 0));
      });
    const p1 = V(HOME_POLE[0], 1.32, HOME_POLE[2]);
    const p2 = V(POLE_2[0], 1.32, POLE_2[2]);
    const spans = [
      sag(V(1.12, 0.9, 0.55), p1, 0.08),
      sag(p1, p2),
      sag(p2, V(NEIGHBOURS[0].p[0] - 0.2, 0.62, NEIGHBOURS[0].p[2] + 0.3)),
      sag(p2, V(NEIGHBOURS[2].p[0] - 0.2, 0.62, NEIGHBOURS[2].p[2] - 0.2)),
    ];
    const g = new THREE.BufferGeometry().setFromPoints(
      spans.flatMap((pts) => pts.slice(0, -1).flatMap((p, i) => [p, pts[i + 1]])),
    );
    return new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({ color: "#5a6a99", transparent: true, opacity: 0.8 }),
    );
  }, []);
  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );
  return <primitive object={line} />;
}

/* ---------- sky dressing: clouds, stars, motes / fireflies ---------- */

function Clouds({ reduced, tint }: { reduced: boolean; tint: R<THREE.Color> }) {
  const g = useRef<THREE.Group>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 1,
        flatShading: true,
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.15,
      }),
    [],
  );
  const clouds = useMemo(() => {
    const rand = rng(42);
    return Array.from({ length: 13 }, (_, i) => {
      const a = (i / 13) * Math.PI * 2 + rand() * 0.4;
      const r = 10.5 + rand() * 8;
      return {
        pos: [Math.cos(a) * r, -5.5 + rand() * 12, Math.sin(a) * r] as [number, number, number],
        s: 0.7 + rand() * 0.9,
        puffs: Array.from({ length: 4 + Math.floor(rand() * 3) }, (_, k) => ({
          p: [(k - 2) * 0.55 + rand() * 0.2, rand() * 0.3, (rand() - 0.5) * 0.5] as [number, number, number],
          r: 0.45 + rand() * 0.35,
        })),
      };
    });
  }, []);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((_, dt) => {
    if (g.current && !reduced) g.current.rotation.y += dt * 0.012;
    mat.color.copy(tint.current);
    mat.emissive.copy(tint.current);
  });
  return (
    <group ref={g}>
      {clouds.map((c, i) => (
        <group key={i} position={c.pos} scale={c.s} rotation={[0, -Math.atan2(c.pos[2], c.pos[0]), 0]}>
          {c.puffs.map((p, k) => (
            <mesh key={k} position={p.p} material={mat} scale={[1, 0.72, 1]}>
              <icosahedronGeometry args={[p.r, 1]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Stars({ night }: { night: R<number> }) {
  const pts = useMemo(() => {
    const rand = rng(9);
    const arr = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i++) {
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(rand() * 0.9);
      arr.set([Math.cos(th) * Math.sin(ph) * 70, Math.cos(ph) * 70 - 6, Math.sin(th) * Math.sin(ph) * 70], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    return new THREE.Points(geo, mat);
  }, []);
  useEffect(
    () => () => {
      pts.geometry.dispose();
      (pts.material as THREE.Material).dispose();
    },
    [pts],
  );
  useFrame(() => {
    (pts.material as THREE.PointsMaterial).opacity = Math.max(0, night.current - 0.25) * 1.2;
    pts.visible = night.current > 0.25;
  });
  return <primitive object={pts} />;
}

/** Floating light motes by day, fireflies by night. */
function Motes({
  count,
  glow,
  night,
  reduced,
}: {
  count: number;
  glow: THREE.Texture;
  night: R<number>;
  reduced: boolean;
}) {
  const data = useMemo(() => {
    const rand = rng(3);
    const base = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 8.5;
      base.set([Math.cos(a) * r, 0.15 + rand() * 3.6, Math.sin(a) * r], i * 3);
      phase[i] = rand() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(base.slice(), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const mat = new THREE.PointsMaterial({
      size: 0.11,
      map: glow,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      fog: false,
    });
    return { base, phase, points: new THREE.Points(geo, mat) };
  }, [count, glow]);
  useEffect(
    () => () => {
      data.points.geometry.dispose();
      (data.points.material as THREE.Material).dispose();
    },
    [data],
  );
  const day = useMemo(() => new THREE.Color("#fff1c4"), []);
  const fly = useMemo(() => new THREE.Color("#d9ff6b"), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    const t = reduced ? 0 : clock.elapsedTime;
    const n = night.current;
    const geo = data.points.geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;
    tmp.copy(day).lerp(fly, n);
    for (let i = 0; i < count; i++) {
      const ph = data.phase[i];
      const sp = 0.25 + (ph % 1) * 0.3;
      pos.setXYZ(
        i,
        data.base[i * 3] + Math.sin(t * sp + ph) * 0.35,
        data.base[i * 3 + 1] + Math.sin(t * sp * 1.3 + ph * 2) * 0.25 - n * 0.6 * (data.base[i * 3 + 1] / 3.8),
        data.base[i * 3 + 2] + Math.cos(t * sp * 0.8 + ph) * 0.35,
      );
      // Fireflies blink; daytime motes shimmer softly.
      const blink = n > 0.5 ? Math.max(0, Math.sin(t * (1.4 + sp) + ph * 3)) ** 3 : 0.35 + 0.25 * Math.sin(t + ph);
      col.setXYZ(i, tmp.r * blink, tmp.g * blink, tmp.b * blink);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    (data.points.material as THREE.PointsMaterial).size = 0.08 + n * 0.07;
  });
  return <primitive object={data.points} />;
}

/* ---------- director: scroll → camera, time of day, light, sky, labels ---------- */

const EAST = V(0.78, 0, -0.62);
const BACK = V(-0.62, 0, -0.78);
/** Sun (or moon, 12 h later) position for an hour: rises behind the island in the opening shot. */
const skyBody = (h: number, out: THREE.Vector3) => {
  const a = ((h - 6) / 12) * Math.PI;
  return out
    .copy(EAST)
    .multiplyScalar(Math.cos(a) * 34)
    .addScaledVector(BACK, 14)
    .setY(Math.sin(a) * 24 + 1);
};

function Director({
  stores,
  frame,
  progress,
  pointer,
  sky,
  pins,
  visible,
  reduced,
  wide,
  sun,
  glow,
  moon,
  light,
  hemi,
  tint,
  night,
  onReady,
}: {
  stores: Store[];
  frame: FrameRef;
  progress: R<number>;
  pointer: R<{ x: number; y: number }>;
  sky: R<HTMLDivElement | null>;
  pins: R<StoryPin[]>;
  visible: R<number>;
  reduced: boolean;
  wide: boolean;
  sun: R<THREE.Mesh | null>;
  glow: R<THREE.Sprite | null>;
  moon: R<THREE.Mesh | null>;
  light: R<THREE.DirectionalLight | null>;
  hemi: R<THREE.HemisphereLight | null>;
  tint: R<THREE.Color>;
  night: R<number>;
  onReady: () => void;
}) {
  const { camera, size: view, scene } = useThree();
  const v = useMemo(
    () => ({
      sm: { p: progress.current, px: 0, py: 0, side: 0 },
      pos: V(0, 0, 0),
      look: V(0, 0, 0),
      fwd: V(0, 0, 0),
      right: V(0, 0, 0),
      up: V(0, 0, 0),
      tmp: V(0, 0, 0),
      sunP: V(0, 0, 0),
      moonP: V(0, 0, 0),
      top: new THREE.Color(),
      bottom: new THREE.Color(),
      white: new THREE.Color("#ffffff"),
      dayHemi: new THREE.Color("#eef6ff"),
      nightHemi: new THREE.Color("#2b3c78"),
      moonCol: new THREE.Color("#a9bcff"),
      bg: "",
      frames: 0,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    scene.fog = new THREE.Fog("#fff3dc", 24, 72);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  // Runs before the parts read their stores (useFrameState is priority −1).
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const sm = v.sm;
    const ease = reduced ? 1 : 1 - Math.exp(-dt * 3.2);
    sm.p += (progress.current - sm.p) * ease;
    if (Math.abs(progress.current - sm.p) < 1e-5) sm.p = progress.current;
    const shot = shotAt(sm.p, reduced);
    stores.forEach((s) =>
      s.set({ hour: shot.hour, battery: s === stores[0] ? shot.battery : true, brownout: shot.brownout }),
    );

    // Camera: station shot + pointer parallax, framed for the viewport shape and the text side.
    const pk = reduced ? 0 : 1 - Math.exp(-dt * 2.5);
    sm.px += (pointer.current.x - sm.px) * pk;
    sm.py += (pointer.current.y - sm.py) * pk;
    const sideTarget = wide ? (STATIONS[shot.index].side === "left" ? 1 : -1) : 0;
    sm.side += (sideTarget - sm.side) * (reduced ? 1 : 1 - Math.exp(-dt * 2));
    const { pos, look, fwd, right, up, tmp } = v;
    pos.set(...shot.pos);
    look.set(...shot.look);
    const aspect = view.width / Math.max(1, view.height);
    const dist = pos.distanceTo(look);
    if (aspect < 1.1) {
      // Portrait: pull back and lift the subject above the bottom text card.
      tmp.subVectors(pos, look).multiplyScalar((1.1 - aspect) * 0.95);
      pos.add(tmp);
      look.y -= (1.1 - aspect) * dist * 0.26;
    }
    fwd.subVectors(look, pos).normalize();
    right.crossVectors(fwd, camera.up).normalize();
    up.crossVectors(right, fwd).normalize();
    // Text on the left → the subject slides right (look a little to its left), and vice versa.
    look.addScaledVector(right, -sm.side * dist * 0.15);
    pos.addScaledVector(right, sm.px * dist * 0.03).addScaledVector(up, -sm.py * dist * 0.02);
    camera.position.copy(pos);
    camera.lookAt(look);
    camera.updateMatrixWorld();

    // Time of day: sky gradient (DOM), fog, sun/moon, key + fill light, cloud tint.
    const h = shot.hour;
    const hs = h < 5 ? 22 : Math.min(22, h);
    const [skyTop, skyBottom] = skyAt(hs);
    const bg = `linear-gradient(180deg, ${skyTop} 0%, ${skyBottom} 78%)`;
    if (bg !== v.bg && sky.current) {
      sky.current.style.background = bg;
      v.bg = bg;
    }
    v.top.set(skyTop);
    v.bottom.set(skyBottom);
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(v.bottom);
    const n = frame.current.night;
    night.current = n;
    tint.current.copy(v.white).lerp(v.bottom, 0.3 + 0.45 * n);

    const day = solarFactor(h);
    skyBody(h, v.sunP);
    skyBody(h - 12, v.moonP);
    if (sun.current) {
      sun.current.position.copy(v.sunP);
      sun.current.visible = v.sunP.y > -2;
    }
    if (glow.current) {
      glow.current.position.copy(v.sunP);
      (glow.current.material as THREE.SpriteMaterial).opacity = Math.min(1, Math.max(0, (v.sunP.y + 2) / 4));
    }
    if (moon.current) {
      moon.current.position.copy(v.moonP);
      moon.current.visible = n > 0.05 && v.moonP.y > -1;
    }
    if (light.current) {
      const useSun = v.sunP.y > -0.5;
      light.current.position
        .copy(useSun ? v.sunP : v.moonP)
        .normalize()
        .multiplyScalar(22);
      if (useSun) {
        light.current.intensity = 0.35 + 2.7 * Math.min(1, day * 1.6);
        light.current.color.setHSL(0.09, 0.95 - 0.75 * Math.min(1, day * 1.8), 0.72 + 0.18 * day);
      } else {
        light.current.intensity = 0.55;
        light.current.color.copy(v.moonCol);
      }
    }
    if (hemi.current) {
      hemi.current.intensity = 0.55 + 1.45 * Math.min(1, day * 1.6);
      hemi.current.color.copy(v.nightHemi).lerp(v.dayHemi, 1 - n);
    }

    // Labels for the chapter on screen follow their 3D anchors.
    const vis = visible.current;
    pins.current.forEach((pin) => {
      if (!pin.el) return;
      const show = pin.chapter === vis;
      tmp.copy(ANCHORS[pin.anchor]).project(camera);
      const inFront = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
      pin.el.dataset.on = show && inFront ? "true" : "false";
      pin.el.style.transform = `translate3d(${((tmp.x + 1) / 2) * view.width}px, ${((1 - tmp.y) / 2) * view.height}px, 0)`;
    });

    if (v.frames < 3 && ++v.frames === 2) onReady();
  }, -2);
  return null;
}

/* ---------- world ---------- */

function World({
  config,
  progress,
  pointer,
  sky,
  pins,
  visible,
  reduced,
  wide,
  lite,
  onReady,
}: SceneProps & { wide: boolean }) {
  const first = shotAt(progress.current, reduced);
  const [stores] = useState(() => {
    const base = { hour: first.hour, brownout: first.brownout, playing: false };
    return [
      createStore({ ...base, bill: 10000, segment: "residential", battery: first.battery }),
      createStore({ ...base, bill: 180000, segment: "commercial", battery: true }),
      createStore({ ...base, bill: 420000, segment: "industrial", battery: true }),
    ];
  });
  const home = useFrameState(stores[0], config);
  const office = useFrameState(stores[1], config);
  const plant = useFrameState(stores[2], config);
  const tex = useMemo(
    () => ({
      panel: panelTexture(),
      glow: glowTexture("rgba(255,236,170,1)", "rgba(255,170,40,.5)"),
      mote: glowTexture("rgba(255,255,255,1)", "rgba(255,255,255,.35)"),
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
  useEffect(
    () => () => {
      Object.values(tex).forEach((t) => t.dispose());
      panelMat.dispose();
    },
    [tex, panelMat],
  );
  useFrame(({ clock }) => {
    const d = home.current.e.daylight;
    panelMat.emissiveIntensity = 0.04 + d * (0.24 + (reduced ? 0 : 0.08 * Math.sin(clock.elapsedTime * 2)));
  });

  const sun = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Sprite>(null);
  const moon = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const tint = useRef(new THREE.Color("#ffffff"));
  const night = useRef(0);

  const roof = V(0, 1.45, 0);
  const heart = V(-0.2, 0.55, 0.6);
  const poleTop = V(HOME_POLE[0], 1.3, HOME_POLE[2]);
  const batt = V(HOME_BATTERY[0], 0.7, HOME_BATTERY[2]);

  return (
    <>
      <Director
        stores={stores}
        frame={home}
        progress={progress}
        pointer={pointer}
        sky={sky}
        pins={pins}
        visible={visible}
        reduced={reduced}
        wide={wide}
        sun={sun}
        glow={glow}
        moon={moon}
        light={light}
        hemi={hemi}
        tint={tint}
        night={night}
        onReady={onReady}
      />
      <hemisphereLight ref={hemi} args={["#eef6ff", "#ffe7c2", 2]} />
      <directionalLight
        ref={light}
        castShadow={!lite}
        intensity={2.8}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-radius={5}
        shadow-bias={-0.0006}
      />
      <mesh ref={sun}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color={C.sun} toneMapped={false} fog={false} />
      </mesh>
      <sprite ref={glow} scale={[11, 11, 1]}>
        <spriteMaterial map={tex.glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <mesh ref={moon}>
        <sphereGeometry args={[0.9, 24, 24]} />
        <meshBasicMaterial color="#f3f6ff" toneMapped={false} fog={false} />
      </mesh>
      <Stars night={night} />
      <Clouds reduced={reduced} tint={tint} />

      <Island />
      <Trees />
      <Wires />
      <StreetLamps frame={home} glow={tex.glow} />
      <Car frame={home} />

      {/* the SunRyse home */}
      <House frame={home} panelMat={panelMat} />
      <Battery frame={home} position={HOME_BATTERY} />
      <GridPole frame={home} position={HOME_POLE} />
      <GridPole frame={home} position={POLE_2} />
      <Flow frame={home} from={roof} to={heart} color={C.gold} power={(e) => e.toHomeKw} lift={0.1} />
      <Flow frame={home} from={heart} to={poleTop} color={C.export} power={(e) => e.exportKw} />
      <Flow frame={home} from={poleTop} to={heart} color={C.import} power={(e) => e.importKw} />
      <Flow frame={home} from={heart} to={batt} color={C.home} power={(e) => e.chargeKw} lift={0.15} />
      <Flow frame={home} from={batt} to={heart} color={C.home} power={(e) => e.dischargeKw} lift={0.15} />
      {NEIGHBOURS.map((n, i) => (
        <Neighbour key={i} frame={home} position={n.p} rot={n.r} />
      ))}

      {/* business district */}
      <group position={OFFICE}>
        <Building frame={office} panelMat={panelMat} />
        <Flow
          frame={office}
          from={V(0, 1.6, 0)}
          to={V(0.2, 0.6, 0.95)}
          color={C.gold}
          power={(e) => e.toHomeKw / 8}
          lift={0.15}
        />
      </group>
      <group position={FACTORY}>
        <Factory frame={plant} panelMat={panelMat} />
        <Flow
          frame={plant}
          from={V(0, 0.8, 0)}
          to={V(-0.6, 0.4, 0.85)}
          color={C.gold}
          power={(e) => e.toHomeKw / 20}
          lift={0.2}
        />
      </group>

      <Motes count={lite ? 110 : 240} glow={tex.mote} night={night} reduced={reduced} />
    </>
  );
}

/* ---------- canvas ---------- */

export type SceneProps = {
  config: CalcConfig;
  /** Scroll progress 0–1 through the story. */
  progress: R<number>;
  /** Pointer position −1…1 (parallax). */
  pointer: R<{ x: number; y: number }>;
  /** Element behind the canvas that gets the sky gradient. */
  sky: R<HTMLDivElement | null>;
  pins: R<StoryPin[]>;
  /** Chapter whose text is on screen (−1 between chapters). */
  visible: R<number>;
  reduced: boolean;
  /** Phones / low-power: no shadows, fewer particles, lower resolution. */
  lite: boolean;
  /** Pause rendering while the story is off screen. */
  active?: boolean;
  onReady: () => void;
};

export default function StoryScene(props: SceneProps) {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    const id = window.setTimeout(on, 0);
    mq.addEventListener("change", on);
    return () => {
      window.clearTimeout(id);
      mq.removeEventListener("change", on);
    };
  }, []);
  return (
    <Canvas
      shadows={props.lite ? false : "soft"}
      dpr={props.lite ? [1, 1.5] : [1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 35, near: 0.1, far: 160, position: STATIONS[0].pos }}
      frameloop={props.active === false ? "never" : "always"}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
      aria-hidden
    >
      <World {...props} wide={wide} />
    </Canvas>
  );
}
