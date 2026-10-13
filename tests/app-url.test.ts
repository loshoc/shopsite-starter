import assert from "node:assert/strict";
import test from "node:test";

import { assertProductionAppUrl, isLocalOnlyHost, resolveAppUrl } from "../lib/app-url.ts";

const shop = { appUrl: "https://shop.example.com", nodeEnv: "production" };

test("origin has no trailing slash", () => {
  assert.equal(resolveAppUrl({ ...shop, appUrl: "https://shop.example.com/" }), "https://shop.example.com");
  assert.equal(resolveAppUrl({ appUrl: "http://localhost:3000/", nodeEnv: "development" }), "http://localhost:3000");
});

test("development falls back when the origin is missing or invalid", () => {
  assert.equal(resolveAppUrl({ nodeEnv: "development" }), "http://localhost:3000");
  assert.equal(resolveAppUrl({ appUrl: "not a url", nodeEnv: "test" }), "http://localhost:3000");
  assert.equal(resolveAppUrl({ appUrl: "http://127.0.0.1:3000", nodeEnv: "development" }), "http://127.0.0.1:3000");
});

test("production build refuses a missing or non-origin URL", () => {
  assert.throws(() => resolveAppUrl({ nodeEnv: "production" }), /NEXT_PUBLIC_APP_URL is required in production/);
  assert.throws(() => resolveAppUrl({ appUrl: "shop.example.com", nodeEnv: "production" }), /absolute http\(s\) origin/);
  assert.throws(() => resolveAppUrl({ appUrl: "https://shop.example.com/shop", nodeEnv: "production" }), /no path/);
  assert.throws(() => assertProductionAppUrl({ nodeEnv: "production" }), /required in production/);
  assert.doesNotThrow(() => assertProductionAppUrl({ nodeEnv: "development" }));
});

test("production refuses local-only hosts", () => {
  const hosts = [
    "http://localhost:3000",
    "http://LOCALHOST",
    "http://app.localhost",
    "http://127.0.0.1:3000",
    "http://127.1",
    "http://0.0.0.0:3000",
    "http://[::1]:3000",
    "http://foo.local",
    "http://host.docker.internal:3000",
    "http://[::ffff:127.0.0.1]",
  ];
  for (const appUrl of hosts) {
    assert.throws(() => resolveAppUrl({ appUrl, nodeEnv: "production" }), /local-only host/, appUrl);
  }
  assert.equal(isLocalOnlyHost("shop.example.com"), false);
});

test("a public production origin is accepted", () => {
  assert.equal(resolveAppUrl(shop), "https://shop.example.com");
  assert.equal(resolveAppUrl({ ...shop, appUrl: "https://Shop.Example.com:8443" }), "https://shop.example.com:8443");
});

test("Vercel preview falls back only when APP_URL is unset", () => {
  assert.equal(
    resolveAppUrl({ nodeEnv: "production", vercelEnv: "preview", vercelUrl: "shopsite-git-seo.vercel.app" }),
    "https://shopsite-git-seo.vercel.app",
  );
  assert.equal(
    resolveAppUrl({
      nodeEnv: "production",
      vercelEnv: "preview",
      vercelUrl: "https://shopsite-git-seo.vercel.app/",
    }),
    "https://shopsite-git-seo.vercel.app",
  );
  assert.throws(
    () =>
      resolveAppUrl({
        appUrl: "http://localhost:3000",
        nodeEnv: "production",
        vercelEnv: "preview",
        vercelUrl: "shopsite-git-seo.vercel.app",
      }),
    /local-only host/,
  );
  assert.throws(
    () => resolveAppUrl({ nodeEnv: "production", vercelEnv: "production", vercelUrl: "shopsite.vercel.app" }),
    /required in production/,
  );
});
