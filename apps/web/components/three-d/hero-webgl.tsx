"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

import { ScrollTrigger } from "@/lib/gsap";

/**
 * WebGL version of the home rooftop scene (desktop only, lazy-loaded by HeroWebglLoader).
 * Same proportions as the CSS-3D models (1 unit = 100 px), lit by a moving sun with soft shadows.
 * Scroll (0 → end of hero) dollies/orbits the camera and moves the sun along its arc, like the CSS version.
 */

const U = 0.01; // px → world units
const COLORS = {
  wall: "#ffffff",
  wallShade: "#dce6f5",
  roof: "#1b2f63",
  frame: "#e6eef9",
  sun: "#ffb21a",
  home: "#5bd97a",
  grid: "#ff8a00",
  gold: "#ffc93c",
};

/* ---------- textures (built once, no network) ---------- */

function panelTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 192;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 128, 192);
  grad.addColorStop(0, "#3a78f0");
  grad.addColorStop(0.6, "#163e9e");
  grad.addColorStop(1, "#0d2a70");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 192);
  g.strokeStyle = "rgba(190,215,255,.45)";
  g.lineWidth = 2;
  for (let x = 0; x <= 128; x += 128 / 3) g.strokeRect(x, 0, 0, 192);
  for (let y = 0; y <= 192; y += 192 / 4) g.strokeRect(0, y, 128, 0);
  const sheen = g.createLinearGradient(0, 0, 128, 96);
  sheen.addColorStop(0, "rgba(255,255,255,.45)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, 128, 192);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function groundTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(256, 256, 30, 256, 256, 256);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.7, "rgba(234,242,255,.85)");
  r.addColorStop(1, "rgba(234,242,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 512, 512);
  g.globalCompositeOperation = "source-atop";
  g.strokeStyle = "rgba(21,83,199,.12)";
  g.lineWidth = 1.5;
  for (let i = 0; i <= 512; i += 32) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 512);
    g.moveTo(0, i);
    g.lineTo(512, i);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, "rgba(255,230,150,1)");
  r.addColorStop(0.35, "rgba(255,178,26,.55)");
  r.addColorStop(1, "rgba(255,138,0,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- models (CSS world x,y,z-up in px → three x, y-up, z) ---------- */

const at = (x: number, y: number, z = 0) => [x * U, z * U, y * U] as const;

function Panels({ cols, rows, w, d, tex }: { cols: number; rows: number; w: number; d: number; tex: THREE.Texture }) {
  const gap = 4 * U;
  const cw = (w * U - gap * (cols + 1)) / cols;
  const cd = (d * U - gap * (rows + 1)) / rows;
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.25,
        metalness: 0.55,
        emissive: new THREE.Color("#1e4fd8"),
        emissiveIntensity: 0.15,
      }),
    [tex],
  );
  const idx = Array.from({ length: rows * cols }, (_, i) => [Math.floor(i / cols), i % cols] as const);
  const cells = idx.map(([r, c]) => (
    <mesh
      key={`${r}-${c}`}
      castShadow
      material={mat}
      position={[(-w * U) / 2 + gap + cw / 2 + c * (cw + gap), 0.012, (-d * U) / 2 + gap + cd / 2 + r * (cd + gap)]}
    >
      <boxGeometry args={[cw, 0.012, cd]} />
    </mesh>
  ));
  return (
    <group>
      <mesh receiveShadow position={[0, 0.003, 0]}>
        <boxGeometry args={[w * U, 0.006, d * U]} />
        <meshStandardMaterial color={COLORS.frame} roughness={0.6} />
      </mesh>
      {cells}
    </group>
  );
}

function House({ tex }: { tex: THREE.Texture }) {
  // footprint 220 × 160, front wall 96, mono-pitch roof rising 24° to the back
  const w = 220,
    d = 160,
    h = 96,
    alpha = 24;
  const rise = d * Math.tan((alpha * Math.PI) / 180);
  const H2 = h + rise;
  const shape = useMemo(() => {
    // side profile in (depth, height): front low, back high
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(d * U, 0);
    s.lineTo(d * U, h * U);
    s.lineTo(0, H2 * U);
    s.closePath();
    return s;
  }, [H2]);
  const roofLen = d / Math.cos((alpha * Math.PI) / 180);
  return (
    // origin = footprint centre
    <group position={at(0, 0)}>
      <mesh castShadow receiveShadow rotation={[0, -Math.PI / 2, 0]} position={[(w * U) / 2, 0, (-d * U) / 2]}>
        <extrudeGeometry args={[shape, { depth: w * U, bevelEnabled: false }]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.85} />
      </mesh>
      {/* door + windows on the front (+z) */}
      <mesh position={[0, 0.26, (d * U) / 2 + 0.002]}>
        <planeGeometry args={[0.3, 0.52]} />
        <meshStandardMaterial color="#0b1f4d" />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.67, 0.55, (d * U) / 2 + 0.002]}>
          <planeGeometry args={[0.38, 0.3]} />
          <meshStandardMaterial
            color="#9cc8f7"
            emissive="#bfe0ff"
            emissiveIntensity={0.25}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>
      ))}
      <mesh position={[(-w * U) / 2 - 0.002, 0.95, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.38, 0.3]} />
        <meshStandardMaterial
          color="#9cc8f7"
          emissive="#bfe0ff"
          emissiveIntensity={0.25}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      {/* roof slab + panels */}
      <group position={[0, (h + rise / 2) * U + 0.03, 0]} rotation={[(alpha * Math.PI) / 180, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[(w + 20) * U, 0.05, (roofLen + 20) * U]} />
          <meshStandardMaterial color={COLORS.roof} roughness={0.7} />
        </mesh>
        <group position={[0, 0.03, 0]}>
          <Panels cols={4} rows={3} w={w - 16} d={roofLen - 12} tex={tex} />
        </group>
      </group>
    </group>
  );
}

function Battery() {
  const w = 46,
    d = 34,
    h = 88;
  return (
    <group position={at(-173, 21)}>
      <mesh castShadow receiveShadow position={[0, (h * U) / 2, 0]}>
        <boxGeometry args={[w * U, h * U, d * U]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.8} />
      </mesh>
      {[0.2, 0.35, 0.5, 0.65].map((y, i) => (
        <mesh key={y} position={[0, h * U * (1 - y), (d * U) / 2 + 0.002]}>
          <planeGeometry args={[w * U * 0.6, h * U * 0.07]} />
          <meshStandardMaterial color={COLORS.home} emissive={COLORS.home} emissiveIntensity={i < 3 ? 1.1 : 0.25} />
        </mesh>
      ))}
    </group>
  );
}

/** Glowing beads travelling along a ground path. */
function Flow({
  from,
  to,
  color,
  count = 6,
  speed = 0.45,
}: {
  from: [number, number];
  to: [number, number];
  color: string;
  count?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const a = useMemo(() => new THREE.Vector3(...at(from[0], from[1], 3)), [from]);
  const b = useMemo(() => new THREE.Vector3(...at(to[0], to[1], 3)), [to]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < count; i++) {
      const t = (clock.elapsedTime * speed + i / count) % 1;
      tmp.position.lerpVectors(a, b, t);
      tmp.scale.setScalar(Math.sin(t * Math.PI) * 0.9 + 0.1);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.028, 12, 12]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}

/* ---------- rig: camera + sun + key light driven by scroll progress ---------- */

const ELEV = (30 * Math.PI) / 180; // CSS rotateX(60deg) → 30° above the ground
const AZ = (38 * Math.PI) / 180; // CSS rotateZ(-38deg)

/** World anchors for the HUD labels (same points as the CSS scene). */
const PIN_POINTS = [at(-70, -100, 205), at(-173, 20, 112), at(-102, 196, 8)].map((p) => new THREE.Vector3(...p));

type Refs = {
  sun: React.RefObject<THREE.Mesh | null>;
  glow: React.RefObject<THREE.Sprite | null>;
  light: React.RefObject<THREE.DirectionalLight | null>;
  labels: { current: (HTMLDivElement | null)[] };
};

function Rig({
  progress,
  refs,
  onFirstFrame,
}: {
  progress: { current: number };
  refs: Refs;
  onFirstFrame: () => void;
}) {
  const { camera, size } = useThree();
  const smooth = useRef(0);
  const frames = useRef(0);
  const v = useMemo(
    () => ({
      target: new THREE.Vector3(-0.25, 0.55, 0.15),
      fwd: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      tmp: new THREE.Vector3(),
    }),
    [],
  );
  useFrame(({ clock }, dt) => {
    smooth.current += (progress.current - smooth.current) * Math.min(1, dt * 6);
    const p = smooth.current;
    const sway = Math.sin(clock.elapsedTime * 0.45) * 0.06; // the CSS idle sway
    const az = AZ + sway - p * 0.17;
    const el = ELEV + p * 0.24;
    const dist = 15.5 - p * 1.8;
    const { target, fwd, right, up, tmp } = v;
    camera.position.set(
      target.x - Math.sin(az) * Math.cos(el) * dist,
      target.y + Math.sin(el) * dist,
      target.z + Math.cos(az) * Math.cos(el) * dist,
    );
    camera.lookAt(target);
    camera.updateMatrixWorld();

    // Sun: an arc in the sky behind the house, always in frame (left → right as you scroll).
    camera.getWorldDirection(fwd);
    right.crossVectors(fwd, camera.up).normalize();
    up.crossVectors(right, fwd).normalize();
    const s = 0.16 + p * 0.62;
    const sx = (s - 0.5) * 6.2;
    const sy = 1.55 + Math.sin(s * Math.PI) * 1.05;
    tmp.copy(target).addScaledVector(fwd, 4).addScaledVector(right, sx).addScaledVector(up, sy);
    refs.sun.current?.position.copy(tmp);
    refs.glow.current?.position.copy(tmp);
    // Key light comes from the camera side so the visible walls stay bright; it follows the sun across.
    refs.light.current?.position
      .copy(target)
      .addScaledVector(fwd, -6)
      .addScaledVector(up, 7)
      .addScaledVector(right, sx * 0.8 - 1.5);

    // HUD labels follow their anchors.
    refs.labels.current?.forEach((el, k) => {
      if (!el) return;
      tmp.copy(PIN_POINTS[k]).project(camera);
      el.style.transform = `translate3d(${((tmp.x + 1) / 2) * size.width}px, ${((1 - tmp.y) / 2) * size.height}px, 0)`;
    });

    if (frames.current < 3 && ++frames.current === 2) onFirstFrame();
  });
  return null;
}

function World({
  progress,
  labels,
  onFirstFrame,
}: {
  progress: { current: number };
  labels: Refs["labels"];
  onFirstFrame: () => void;
}) {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const tex = useMemo(() => ({ panel: panelTexture(), ground: groundTexture(), glow: glowTexture() }), []);
  useEffect(() => () => Object.values(tex).forEach((t) => t.dispose()), [tex]);

  return (
    <>
      <Rig
        progress={progress}
        refs={{ sun: sunRef, glow: glowRef, light: lightRef, labels }}
        onFirstFrame={onFirstFrame}
      />
      <hemisphereLight args={["#eef6ff", "#fff1d6", 2.2]} />
      <directionalLight
        ref={lightRef}
        castShadow
        intensity={2.8}
        color="#fff6e6"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-radius={6}
        shadow-bias={-0.0006}
      />
      <mesh ref={sunRef}>
        <sphereGeometry args={[0.72, 48, 48]} />
        <meshBasicMaterial color="#ffc94a" toneMapped={false} />
      </mesh>
      <sprite ref={glowRef} scale={[4.4, 4.4, 1]}>
        <spriteMaterial map={tex.glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.5, 8.5]} />
        <meshStandardMaterial map={tex.ground} transparent roughness={1} />
      </mesh>
      <House tex={tex.panel} />
      <Battery />
      <Flow from={[-112, 22]} to={[-148, 22]} color={COLORS.home} count={4} />
      <Flow from={[-30, 84]} to={[-96, 196]} color={COLORS.gold} />
      <mesh position={at(-102, 196, 4)}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={COLORS.grid} toneMapped={false} />
      </mesh>
    </>
  );
}

const LABEL_SHIFT = [
  "-translate-x-1/2 -translate-y-[calc(100%+10px)]",
  "-translate-x-1/2 -translate-y-[calc(100%+10px)]",
  "-translate-x-[calc(100%+12px)] -translate-y-1/2",
];

export default function HeroWebgl({
  onReady,
  pins,
}: {
  onReady: () => void;
  pins: { panels: ReactNode; battery: ReactNode; grid: ReactNode };
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [inView, setInView] = useState(true);
  const labels = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = wrap.current;
    const section = el?.closest("section");
    if (!el || !section) return;
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      onUpdate: (s) => (progress.current = s.progress),
    });
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => {
      st.kill();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
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
        <World progress={progress} labels={labels} onFirstFrame={onReady} />
      </Canvas>
      {[pins.panels, pins.battery, pins.grid].map((node, k) => (
        <div
          key={k}
          ref={(el) => {
            labels.current[k] = el;
          }}
          className="pointer-events-none absolute top-0 left-0 z-[2] will-change-transform"
        >
          <div className={LABEL_SHIFT[k]}>{node}</div>
        </div>
      ))}
    </div>
  );
}
