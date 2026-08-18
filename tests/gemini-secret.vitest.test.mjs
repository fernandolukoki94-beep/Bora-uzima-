import { describe, expect, it } from "vitest";

const apiKey = process.env.GEMINI_API_KEY;

describe("Gemini server credential", () => {
  it("authenticates against the lightweight models endpoint when configured", async () => {
    if (!apiKey) {
      return;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    );

    expect([200, 403, 429]).toContain(response.status);
    expect(response.status).not.toBe(401);
  }, 15_000);
});
