// SunRyse 3D kit — HTML generators for CSS-3D models (used by the design boards).
// All models are placed inside a `.d3-world` (floor = XY plane, +Z = up).

const box = ({ x = 0, y = 0, w, d, h, faces = {}, cls = "", z = 0, extra = "" }) => {
  const f = (name, def) => `<i class="f ${name} ${faces[name] ?? def}"></i>`;
  return `<div class="d3-box ${cls}" style="--w:${w}px;--d:${d}px;--h:${h}px;left:${x}px;top:${y}px;transform:translateZ(${z}px)">${f("top", "m-wall")}${f("front", "m-wall")}${f("right", "m-wall-shade")}${f("left", "m-wall-shade")}${f("back", "m-wall-shade")}${extra}</div>`;
};

/** Panel grid (cols × rows) sized w×h. */
export const panels = (cols, rows, w, h, lit = true) =>
  `<div class="d3-panels${lit ? " lit" : ""}" style="width:${w}px;height:${h}px;grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr)">${Array.from({ length: cols * rows }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>`;

/**
 * House with a mono-pitch solar roof rising toward the back.
 * Origin = footprint top-left. Visible walls from the hero camera: front (+y) and left (-x).
 */
export function house({ x = -110, y = -80, w = 220, d = 160, h = 96, alpha = 24, cols = 4, rows = 3 } = {}) {
  const rad = (alpha * Math.PI) / 180;
  const rise = Math.round(d * Math.tan(rad));
  const L = Math.round(d / Math.cos(rad));
  const H2 = h + rise, R = Math.round((rise / H2) * 1000) / 10, o = 10;
  return `<div class="d3-model house" style="position:absolute;left:${x}px;top:${y}px">
  <div class="d3-shadow" style="left:-40px;top:-10px;width:${w + 100}px;height:${d + 70}px"></div>
  <div class="d3-box" style="--w:${w}px;--d:${d}px;--h:${h}px">
    <i class="f front m-wall"><span class="d3-door"></span><span class="d3-window" style="left:24px"></span><span class="d3-window" style="right:24px"></span></i>
    <i class="f back m-wall-shade" style="--h:${H2}px"></i>
    <i class="f left m-wall-shade" style="--h:${H2}px;clip-path:polygon(0 0,100% ${R}%,100% 100%,0 100%)"><span class="d3-window" style="left:${Math.round(d / 2 - 19)}px;top:${Math.round(rise + 26)}px"></span></i>
    <i class="f right m-wall-shade" style="--h:${H2}px;clip-path:polygon(0 ${R}%,100% 0,100% 100%,0 100%)"></i>
  </div>
  <div class="d3-roof" style="position:absolute;left:-${o}px;top:${-Math.round(o * Math.cos(rad))}px;width:${w + 2 * o}px;height:${L + 2 * o}px;transform-origin:0 0;transform:translateZ(${H2 + Math.round(o * Math.sin(rad))}px) rotateX(-${alpha}deg)">
    <div class="m-roof" style="position:absolute;inset:0;border-radius:6px"></div>
    <div style="position:absolute;left:18px;top:16px;transform:translateZ(3px)">${panels(cols, rows, w - 16, L - 12)}</div>
  </div>
</div>`;
}

/** Battery cabinet with LED bars. */
export function battery({ x = 150, y = -10, w = 46, d = 34, h = 88 } = {}) {
  return `<div class="d3-model battery" style="position:absolute;left:${x}px;top:${y}px">
  <div class="d3-shadow" style="left:-14px;top:-10px;width:${w + 36}px;height:${d + 30}px"></div>
  ${box({
    w, d, h,
    faces: { top: "m-wall", front: "m-wall d3-bat-face", right: "m-wall-shade", left: "m-wall-shade", back: "m-wall-shade" },
  })}
</div>`;
}

/** Commercial building: tall block, flat roof full of panels. */
export function building({ x = -90, y = -90, w = 180, d = 180, h = 170 } = {}) {
  return `<div class="d3-model building" style="position:absolute;left:${x}px;top:${y}px">
  <div class="d3-shadow" style="left:-30px;top:-30px;width:${w + 80}px;height:${d + 80}px"></div>
  ${box({ w, d, h, faces: { front: "m-wall d3-glazing", left: "m-wall-shade d3-glazing" } })}
  <div style="position:absolute;left:12px;top:12px;transform:translateZ(${h + 2}px)">${panels(5, 5, w - 24, d - 24)}</div>
</div>`;
}

/** Factory: long low hall with a sawtooth panel roof (panels face the sun side, glass gables at the front). */
export function factory({ x = -150, y = -80, w = 300, d = 160, h = 70, teeth = 4, pitch = 26 } = {}) {
  const tw = Math.round(w / teeth), rad = (pitch * Math.PI) / 180;
  const rise = Math.round(tw * Math.tan(rad)), slope = Math.round(tw / Math.cos(rad));
  const teethHtml = Array.from({ length: teeth }, (_, i) => `
    <div style="position:absolute;left:${i * tw}px;top:0;width:${slope}px;height:${d}px;transform-origin:0 0;transform:translateZ(${h}px) rotateY(-${pitch}deg)">${panels(3, 4, slope, d, true)}</div>
    <i class="d3-up m-glass" style="left:${i * tw}px;top:${d}px;width:${tw}px;height:${rise}px;--h:${h + rise}px;clip-path:polygon(100% 0,100% 100%,0 100%)"></i>
    <i class="d3-up m-wall-shade" style="left:${(i + 1) * tw}px;top:0;width:${d}px;height:${rise}px;--h:${h + rise}px;transform:translate3d(0,0,${h + rise}px) rotateZ(90deg) rotateX(-90deg);background:linear-gradient(180deg,#BFE0FF,#8FB8EE)"></i>`).join("");
  return `<div class="d3-model factory" style="position:absolute;left:${x}px;top:${y}px">
  <div class="d3-shadow" style="left:-30px;top:-14px;width:${w + 90}px;height:${d + 70}px"></div>
  ${box({ w, d, h, faces: { front: "m-wall d3-bay", left: "m-wall-shade", top: "m-wall-shade" } })}
  ${teethHtml}
</div>`;
}

/** Energy flow line on the ground from (x1,y1) to (x2,y2). */
export function flow(x1, y1, x2, y2, color = "#FFC93C") {
  const len = Math.round(Math.hypot(x2 - x1, y2 - y1));
  const ang = Math.round((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI);
  return `<span class="d3-flow" style="--c:${color};left:${x1}px;top:${y1}px;width:${len}px;transform-origin:left center;transform:translateZ(2px) rotate(${ang}deg)"></span>`;
}

/** Full rooftop hero scene: ground, house, battery, flows (+ optional extra HTML in the world). */
export function rooftopScene({ scale = 1, extra = "" } = {}) {
  return `<div class="d3-stage d3-scene-rooftop" style="width:100%;height:100%">
  <div class="d3-sun"></div>
  <div class="d3-world" style="scale:${scale}">
    <div class="d3-ground"></div>
    ${house()}
    ${battery({ x: -196, y: 4 })}
    ${flow(-112, 22, -148, 22, "#5BD97A")}
    ${flow(-30, 84, -96, 196, "#FFC93C")}
    <div style="position:absolute;left:-102px;top:192px;transform:translateZ(1px)"><span class="d3-grid-pole"></span></div>
    ${extra}
  </div>
</div>`;
}
