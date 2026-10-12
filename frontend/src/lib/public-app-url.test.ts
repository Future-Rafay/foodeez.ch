import assert from "node:assert/strict";
import test from "node:test";
import { getPublicAppOrigin } from "./public-app-url";

test("public checkout URLs use only the configured canonical origin", () => {
  assert.equal(getPublicAppOrigin("https://foodeez.ch/customer/path"), "https://foodeez.ch");
  assert.equal(getPublicAppOrigin("http://localhost:3000/cart"), "http://localhost:3000");
  assert.throws(() => getPublicAppOrigin("javascript:alert(1)"));
  assert.throws(() => getPublicAppOrigin(""));
});
