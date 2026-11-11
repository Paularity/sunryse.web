import { describe, expect, it } from "vitest";

import { clientKey, createRateLimiter, isBot } from "./lead-guard";

describe("lead spam protection", () => {
  it("flags a filled honeypot only", () => {
    expect(isBot({ name: "Ana", website: "http://spam.example" })).toBe(true);
    expect(isBot({ name: "Ana", website: "" })).toBe(false);
    expect(isBot({ name: "Ana", website: "   " })).toBe(false);
    expect(isBot({ name: "Ana" })).toBe(false);
    expect(isBot(null)).toBe(false);
  });

  it("limits requests per visitor within the window, then lets them through again", () => {
    const allow = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect([allow("a", 0), allow("a", 100), allow("a", 200), allow("a", 300)]).toEqual([true, true, true, false]);
    expect(allow("b", 300)).toBe(true);
    expect(allow("a", 1050)).toBe(true);
  });

  it("forgets the oldest visitors past the key limit", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 10_000, maxKeys: 2 });
    allow("a", 0);
    allow("b", 1);
    allow("c", 2); // "a" is dropped
    expect(allow("a", 3)).toBe(true);
    expect(allow("c", 4)).toBe(false);
  });

  it("reads the visitor IP from the host headers", () => {
    expect(clientKey(new Headers({ "x-real-ip": "1.2.3.4" }))).toBe("1.2.3.4");
    expect(clientKey(new Headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});
