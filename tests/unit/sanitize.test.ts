import { describe, it, expect } from "vitest";
import { escapeHtml, stripHtml, sanitizeInput, sanitizeUrl } from "@/lib/sanitize";

describe("Sanitization", () => {
  describe("escapeHtml()", () => {
    it("should escape HTML special characters", () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it("should escape ampersands", () => {
      expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
    });

    it("should escape single quotes", () => {
      expect(escapeHtml("it's")).toBe("it&#x27;s");
    });

    it("should leave safe text unchanged", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
    });
  });

  describe("stripHtml()", () => {
    it("should remove HTML tags", () => {
      expect(stripHtml("<b>bold</b>")).toBe("bold");
    });

    it("should remove nested tags", () => {
      expect(stripHtml("<div><p>text</p></div>")).toBe("text");
    });

    it("should handle script tags", () => {
      expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
    });
  });

  describe("sanitizeInput()", () => {
    it("should strip HTML and trim", () => {
      expect(sanitizeInput("  <b>hello</b>  ")).toBe("hello");
    });

    it("should handle plain text", () => {
      expect(sanitizeInput("normal text")).toBe("normal text");
    });
  });

  describe("sanitizeUrl()", () => {
    it("should allow https URLs", () => {
      expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
    });

    it("should allow http URLs", () => {
      expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
    });

    it("should reject javascript: URLs", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    });

    it("should reject data: URLs", () => {
      expect(sanitizeUrl("data:text/html,<script>")).toBeNull();
    });

    it("should reject invalid URLs", () => {
      expect(sanitizeUrl("not a url")).toBeNull();
    });
  });
});
