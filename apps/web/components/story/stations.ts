/**
 * Scrollytelling camera "stations": one per chapter. Scroll progress glides the camera from station to station,
 * then nearly holds while the chapter's text is read (the "move, then read" rhythm).
 * To retune a shot, edit its numbers here — the scene, text and HUD all follow the same progress value.
 * World units: 1 = 1 m-ish (100 px of the CSS models); +Y up; the island top is y = 0, centre at the origin.
 */
export type Vec3 = [number, number, number];

export type Station = {
  /** Camera position. */
  pos: Vec3;
  /** Point the camera looks at. */
  look: Vec3;
  /** Hour of the day (5–22) — drives sun, sky, light and energy flows. */
  hour: number;
  /** Panel text side on wide screens. */
  side: "left" | "right";
  battery: boolean;
  brownout: boolean;
};

export const STATIONS: Station[] = [
  { pos: [-15.5, 10.5, 21], look: [0.4, -0.6, -0.4], hour: 6.6, side: "left", battery: false, brownout: false }, // sunrise · whole island
  { pos: [-4.4, 5.4, 6.0], look: [0.3, 1.2, 0], hour: 8.5, side: "right", battery: false, brownout: false }, // panels
  { pos: [-6.2, 2.5, 4.6], look: [-1.3, 0.7, 0.2], hour: 10.5, side: "right", battery: true, brownout: false }, // inverter + battery wall
  { pos: [6.2, 3.0, 6.4], look: [2.2, 1.1, 1.4], hour: 12.6, side: "left", battery: true, brownout: false }, // grid pole · export
  { pos: [-6.8, 4.4, 7.6], look: [-0.2, 0.6, -0.3], hour: 19.6, side: "right", battery: true, brownout: true }, // brownout at night
  { pos: [0.6, 9, 4.2], look: [0.2, 0.2, -3.6], hour: 11, side: "left", battery: true, brownout: false }, // business & industry
  { pos: [15, 10.5, 18.5], look: [0, -0.5, -0.4], hour: 17.2, side: "right", battery: true, brownout: false }, // finale · golden hour
];

/** Share of each chapter's scroll used to travel to it; the rest is the "hold" while its text is shown. */
export const TRAVEL = 0.42;

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Where the story is for a scroll progress 0–1:
 * index = current chapter, travel = 0–1 while moving into it (1 = arrived), hold = 0–1 through the hold.
 */
export function storyAt(progress: number, count = STATIONS.length) {
  const p = Math.min(0.99999, Math.max(0, progress)) * count;
  const index = Math.floor(p);
  const local = p - index;
  const travel = index === 0 ? 1 : Math.min(1, local / TRAVEL);
  const hold = index === 0 ? local : Math.max(0, (local - TRAVEL) / (1 - TRAVEL));
  return { index, local, travel: smooth(travel), hold };
}

/** Is a chapter's text on screen? (fades in on arrival, out just before the camera leaves) */
export function chapterVisible(progress: number, count = STATIONS.length) {
  const { index, local } = storyAt(progress, count);
  const start = index === 0 ? 0 : TRAVEL * 0.75;
  return local >= start && local <= 0.97 ? index : -1;
}

/** Scroll position (0–1) at the middle of a chapter's hold — for chapter jump links. */
export const chapterProgress = (index: number, count = STATIONS.length) =>
  (index + (index === 0 ? 0.02 : TRAVEL + (1 - TRAVEL) * 0.35)) / count;

/** Hours that pass while a chapter's text is on screen (time drifts gently during the hold). */
const HOLD_HOURS = 0.4;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export type Shot = ReturnType<typeof shotAt>;

/**
 * Full camera + world state for a scroll progress 0–1 (shared by the 3D scene and the HUD).
 * `snap` (reduced motion) cuts straight to each chapter's shot instead of gliding.
 */
export function shotAt(progress: number, snap = false) {
  const st = storyAt(progress);
  const travel = snap ? 1 : st.travel;
  const hold = snap ? 0.35 : st.hold;
  const a = STATIONS[Math.max(0, st.index - 1)];
  const b = STATIONS[st.index];
  const from = st.index === 0 ? a.hour : a.hour + HOLD_HOURS;

  // Glide on a gentle arc (rises mid-move), then orbit a touch while the text is read.
  const pos = lerp3(a.pos, b.pos, travel);
  const look = lerp3(a.look, b.look, travel);
  const dist = Math.hypot(b.pos[0] - a.pos[0], b.pos[1] - a.pos[1], b.pos[2] - a.pos[2]);
  pos[1] += Math.sin(travel * Math.PI) * dist * 0.14;
  const yaw = (hold - 0.35) * 0.1;
  const dx = pos[0] - look[0];
  const dz = pos[2] - look[2];
  pos[0] = look[0] + dx * Math.cos(yaw) - dz * Math.sin(yaw);
  pos[2] = look[2] + dx * Math.sin(yaw) + dz * Math.cos(yaw);

  // Time only runs forward: going from night (19:30) to the workday (11:00) passes through the next morning.
  let to = b.hour;
  if (to < from) to += 24;
  const hour = (lerp(from, to, travel) + hold * HOLD_HOURS) % 24;

  return {
    index: st.index,
    travel,
    hold,
    pos,
    look,
    hour,
    battery: travel > 0.5 ? b.battery : a.battery,
    brownout: (b.brownout && travel > 0.6) || (a.brownout && travel < 0.25),
  };
}
