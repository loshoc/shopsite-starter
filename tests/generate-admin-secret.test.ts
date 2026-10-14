import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import test from "node:test";

import { adminSecretProblem } from "../lib/admin-secret.ts";
import { copyText, generateAdminSecret } from "../lib/generate-admin-secret.ts";

test("generated secret is 32 bytes of base64 and passes the server check", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 20; i += 1) {
    const secret = generateAdminSecret();
    assert.equal(adminSecretProblem(secret), null);
    assert.ok(secret.length >= 32);
    assert.match(secret, /^[A-Za-z0-9+/]+=*$/);
    assert.equal(Buffer.from(secret, "base64").length, 32);
    seen.add(secret);
  }
  assert.equal(seen.size, 20);
});

test("clipboard success and failure stay in the browser", async () => {
  const original = globalThis.navigator;
  const written: string[] = [];
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (value: string) => {
          written.push(value);
        },
      },
    },
  });
  try {
    assert.equal(await copyText("local-only-value"), "copied");
    assert.deepEqual(written, ["local-only-value"]);

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        clipboard: {
          writeText: async () => {
            throw new Error("denied");
          },
        },
      },
    });
    assert.equal(await copyText("local-only-value"), "manual");

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {},
    });
    assert.equal(await copyText("local-only-value"), "manual");
  } finally {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: original });
  }
});

test("closed screen generates locally and does not call the server", () => {
  const page = readFileSync(new URL("../app/admin/login/page.tsx", import.meta.url), "utf8");
  const closed = readFileSync(new URL("../components/admin/admin-closed.tsx", import.meta.url), "utf8");
  const generator = readFileSync(new URL("../lib/generate-admin-secret.ts", import.meta.url), "utf8");

  assert.match(page, /adminConfigProblem\(\)/);
  assert.match(page, /<AdminClosed \/>/);
  assert.equal(page.includes("generateAdminSecret"), false);
  assert.match(closed, /generateAdminSecret/);
  assert.match(closed, /copyText/);
  assert.equal(/fetch\s*\(/.test(closed), false);
  assert.equal(/console\./.test(closed), false);
  assert.match(generator, /getRandomValues/);
  assert.equal(generator.includes("process.env"), false);
  assert.equal(/console\./.test(generator), false);
  assert.equal(/writeFile|appendFile|fs\./.test(generator), false);
});
