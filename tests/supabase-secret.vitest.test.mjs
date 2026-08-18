import { describe, expect, it } from "vitest";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

describe("Supabase server configuration", () => {
  it("accepts the configured project URL and anon key without exposing secrets", async () => {
    expect(url, "SUPABASE_URL must be configured").toBeTruthy();
    expect(anonKey, "SUPABASE_ANON_KEY must be configured").toBeTruthy();
    expect(url).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i);

    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("external");
  }, 15000);
});
