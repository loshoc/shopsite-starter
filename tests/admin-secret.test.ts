import assert from "node:assert/strict";
import { createHash, timingSafeEqual } from "node:crypto";
import test from "node:test";

import { readSession, signSession } from "../lib/admin-cookie.ts";
import { adminSecretProblem, safeAdminNext } from "../lib/admin-secret.ts";
import { configuredDatabaseUrl } from "../lib/database-url.ts";
import { ADMIN_RESPONSE_HEADERS } from "../lib/http.ts";
import { allowLoginAttempt, resetLoginAttempts } from "../lib/rate-limit.ts";

const EXAMPLE_SECRET = "replace_with_at_least_32_random_characters";

test("example ADMIN_SECRET is rejected", () => {
  assert.match(adminSecretProblem(undefined) ?? "", /missing/);
  assert.match(adminSecretProblem("short") ?? "", /32/);
  assert.match(adminSecretProblem(EXAMPLE_SECRET) ?? "", /placeholder/);
  assert.match(adminSecretProblem("x".repeat(40)) ?? "", /placeholder/);
  assert.equal(adminSecretProblem("a".repeat(16) + "B".repeat(16) + "c7!"), null);
});

test("database placeholder is not a live connection string", () => {
  assert.equal(configuredDatabaseUrl(""), null);
  assert.equal(configuredDatabaseUrl(undefined), null);
  assert.equal(configuredDatabaseUrl("postgresql://USER:PASSWORD@HOST:5432/DATABASE"), null);
  assert.equal(
    configuredDatabaseUrl("postgres://app:secret@db.internal:5432/shop"),
    "postgres://app:secret@db.internal:5432/shop",
  );
});

test("login allows five attempts per minute and blocks the sixth", () => {
  resetLoginAttempts();
  const now = 1_700_000_000_000;
  for (let i = 0; i < 5; i += 1) assert.equal(allowLoginAttempt("203.0.113.5", now), true);
  assert.equal(allowLoginAttempt("203.0.113.5", now), false);
  assert.equal(allowLoginAttempt("203.0.113.5", now + 60_000), true);
  resetLoginAttempts();
});

test("session cookie signature fails closed when tampered or expired", () => {
  const secret = "a".repeat(16) + "B".repeat(16) + "c7!";
  const token = signSession({ sid: "s".repeat(20), exp: Math.floor(Date.now() / 1000) + 60, iat: 10 }, secret);
  assert.ok(readSession(token, secret));
  assert.equal(readSession(`${token}x`, secret), null);
  assert.equal(readSession(token, `${secret}nope`), null);
  const expired = signSession({ sid: "s".repeat(20), exp: Math.floor(Date.now() / 1000) - 10, iat: 10 }, secret);
  assert.equal(readSession(expired, secret), null);
});

test("secret compare uses equal-length digests", () => {
  const a = createHash("sha256").update("one", "utf8").digest();
  const b = createHash("sha256").update("two", "utf8").digest();
  assert.equal(a.length, b.length);
  assert.equal(timingSafeEqual(a, a), true);
  assert.equal(timingSafeEqual(a, b), false);
});

test("admin responses do not open CORS", () => {
  const keys = Object.keys(ADMIN_RESPONSE_HEADERS).map((key) => key.toLowerCase());
  assert.equal(keys.includes("access-control-allow-origin"), false);
  assert.equal(ADMIN_RESPONSE_HEADERS["X-Frame-Options"], "DENY");
  assert.match(ADMIN_RESPONSE_HEADERS["Content-Security-Policy"], /frame-ancestors 'none'/);
});

test("login next path cannot leave the admin", () => {
  assert.equal(safeAdminNext("https://evil.example/admin"), "/admin");
  assert.equal(safeAdminNext("//evil.example"), "/admin");
  assert.equal(safeAdminNext("/admin/stock"), "/admin/stock");
  assert.equal(safeAdminNext("/admin/login"), "/admin");
});
