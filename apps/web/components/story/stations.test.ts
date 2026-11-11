import { describe, expect, it } from "vitest";

import { chapterProgress, chapterVisible, shotAt, STATIONS, storyAt } from "./stations";

const N = STATIONS.length;

describe("story stations", () => {
  it("maps scroll progress to chapters, travel and hold", () => {
    expect(storyAt(0).index).toBe(0);
    expect(storyAt(1).index).toBe(N - 1);
    const mid = storyAt(1.2 / N);
    expect(mid.index).toBe(1);
    expect(mid.travel).toBeGreaterThan(0);
    expect(mid.travel).toBeLessThan(1);
    expect(storyAt(1.9 / N).travel).toBe(1);
  });

  it("shows each chapter's text at its jump point", () => {
    for (let i = 0; i < N; i++) expect(chapterVisible(chapterProgress(i))).toBe(i);
  });

  it("arrives exactly on each station once travel ends", () => {
    for (let i = 0; i < N; i++) {
      const s = shotAt(chapterProgress(i), true);
      expect(s.index).toBe(i);
      expect(s.battery).toBe(STATIONS[i].battery);
      expect(s.brownout).toBe(STATIONS[i].brownout);
    }
  });

  it("only moves time forward (night → next morning)", () => {
    const from = STATIONS.findIndex((s) => s.brownout);
    let last = shotAt((from + 0.95) / N).hour;
    let wrapped = false;
    for (let k = 1; k <= 20; k++) {
      const h = shotAt((from + 1 + (k / 20) * 0.42) / N).hour;
      if (h < last) wrapped = true;
      else expect(h).toBeGreaterThanOrEqual(last);
      last = h;
    }
    expect(wrapped).toBe(true);
    expect(last).toBeCloseTo(STATIONS[from + 1].hour, 0);
  });
});
