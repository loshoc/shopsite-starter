import assert from "node:assert/strict";
import test from "node:test";

import { clientIp } from "../lib/http.ts";

test("clientIp uses the first x-forwarded-for hop by default", () => {
  const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1", "cf-connecting-ip": "198.51.100.9" });
  assert.equal(clientIp(headers, undefined), "203.0.113.5");
  assert.equal(clientIp(new Headers({ "x-real-ip": "203.0.113.7" }), undefined), "203.0.113.7");
  assert.equal(clientIp(new Headers(), undefined), "unknown");
});

test("clientIp prefers the trusted proxy header when configured", () => {
  const headers = new Headers({ "x-forwarded-for": "172.64.0.1", "cf-connecting-ip": "198.51.100.9" });
  assert.equal(clientIp(headers, "CF-Connecting-IP"), "198.51.100.9");
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "172.64.0.1" }), "cf-connecting-ip"), "172.64.0.1");
  assert.equal(clientIp(headers, "  "), "172.64.0.1");
});
