import { describe, it, expect, beforeEach, vi } from "vitest";
import { cache, CACHE_TTL } from "@/lib/cache";

describe("MemoryCache", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("should store and retrieve values", () => {
    cache.set("key1", "value1", 60000);
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return null for missing keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("should return null for expired entries", () => {
    vi.useFakeTimers();
    cache.set("key1", "value1", 1000);
    vi.advanceTimersByTime(1001);
    expect(cache.get("key1")).toBeNull();
    vi.useRealTimers();
  });

  it("should delete entries", () => {
    cache.set("key1", "value1", 60000);
    cache.delete("key1");
    expect(cache.get("key1")).toBeNull();
  });

  it("should invalidate by pattern", () => {
    cache.set("user:1:xp", 100, 60000);
    cache.set("user:1:level", "Cadet", 60000);
    cache.set("user:2:xp", 200, 60000);
    cache.invalidatePattern("user:1");
    expect(cache.get("user:1:xp")).toBeNull();
    expect(cache.get("user:1:level")).toBeNull();
    expect(cache.get("user:2:xp")).toBe(200);
  });

  it("should clear all entries", () => {
    cache.set("a", 1, 60000);
    cache.set("b", 2, 60000);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("should handle complex values", () => {
    const obj = { xp: 100, level: "Captain", achievements: ["first_blood"] };
    cache.set("user:1", obj, 60000);
    expect(cache.get("user:1")).toEqual(obj);
  });

  describe("CACHE_TTL constants", () => {
    it("should have expected TTL values", () => {
      expect(CACHE_TTL.LEADERBOARD).toBe(300000);
      expect(CACHE_TTL.LEVEL_CONFIG).toBe(1800000);
      expect(CACHE_TTL.DOMAIN_LIST).toBe(600000);
      expect(CACHE_TTL.DAILY_CHALLENGE).toBe(3600000);
      expect(CACHE_TTL.USER_XP).toBe(60000);
    });
  });
});
