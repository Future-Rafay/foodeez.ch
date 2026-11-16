import assert from "node:assert/strict";
import test from "node:test";

test("bots and link previews never trigger a Google refresh", async () => {
  const { isBotUserAgent } = await import("./google-business-refresh");
  assert.equal(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), true);
  assert.equal(isBotUserAgent("facebookexternalhit/1.1"), true);
  assert.equal(isBotUserAgent("WhatsApp/2.23"), true);
  assert.equal(isBotUserAgent("Mozilla/5.0 (Windows NT 10.0) Chrome-Lighthouse"), true);
  assert.equal(isBotUserAgent(null), true);
  assert.equal(isBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"), false);
  assert.equal(isBotUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"), false);
});
