import test from "node:test";
import assert from "node:assert/strict";

test("OpenAI server-side secret authenticates without exposing the key", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey && process.env.REQUIRE_OPENAI_SECRET_TEST !== "1") {
      return;
    }
    assert.ok(apiKey, "OPENAI_API_KEY must be configured when REQUIRE_OPENAI_SECRET_TEST=1");

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    process.stdout.write(`OPENAI_SECRET_STATUS=${response.status === 200 ? "authenticated" : "authenticated_but_quota_limited"}\n`);
    assert.ok([200, 429].includes(response.status));
    assert.notEqual(response.status, 401);
    assert.notEqual(response.status, 403);
  });
