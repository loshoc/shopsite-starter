import assert from "node:assert/strict";
import test from "node:test";

import { POST } from "../app/api/checkout/route.ts";
import { createCheckoutSession, getStripe } from "../lib/stripe.ts";
import {
  LIVE_STRIPE_LOCAL_MESSAGE,
  liveStripeLocalProblem,
  requestHostValues,
  type LiveStripeCheck,
} from "../lib/stripe-live.ts";

const localOrigins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"] as const;
const localHosts = ["localhost:3000", "127.0.0.1:3000", "[::1]:3000", "::1"] as const;

function check(overrides: LiveStripeCheck = {}): string | null {
  return liveStripeLocalProblem({
    secretKey: "sk_test_51LocalOk",
    publishableKey: "pk_test_51LocalOk",
    appUrl: "http://localhost:3000",
    nodeEnv: "development",
    requestHosts: ["localhost:3000"],
    ...overrides,
  });
}

test("test keys are allowed on localhost, 127.0.0.1, and ::1", () => {
  for (const appUrl of localOrigins) {
    for (const host of localHosts) {
      assert.equal(check({ appUrl, requestHosts: [host] }), null, `${appUrl} ${host}`);
    }
  }
  assert.equal(check({ appUrl: "", nodeEnv: "development", requestHosts: [] }), null);
  assert.equal(check({ secretKey: "", publishableKey: "", requestHosts: ["localhost:3000"] }), null);
  assert.equal(check({ secretKey: "sk_test_live_named", publishableKey: "pk_test_live_named" }), null);
});

test("live secret or publishable keys are refused on a local app origin", () => {
  for (const appUrl of localOrigins) {
    assert.equal(check({ secretKey: "sk_live_51Refused", appUrl, requestHosts: [] }), LIVE_STRIPE_LOCAL_MESSAGE, appUrl);
    assert.equal(
      check({ publishableKey: "pk_live_51Refused", appUrl, requestHosts: [] }),
      LIVE_STRIPE_LOCAL_MESSAGE,
      appUrl,
    );
  }
  assert.equal(
    check({ secretKey: " sk_live_51Refused ", appUrl: "", nodeEnv: "development", requestHosts: [] }),
    LIVE_STRIPE_LOCAL_MESSAGE,
  );
});

test("live keys are refused when the request host is local even if APP_URL is public", () => {
  const appUrl = "https://shop.example.com";
  assert.equal(check({ secretKey: "sk_live_51Public", appUrl, requestHosts: ["shop.example.com"] }), null);
  for (const host of localHosts) {
    assert.equal(
      check({ secretKey: "sk_live_51Public", publishableKey: "pk_test_51Public", appUrl, requestHosts: [host] }),
      LIVE_STRIPE_LOCAL_MESSAGE,
      host,
    );
  }
  const headers = new Headers({
    host: "shop.example.com",
    "x-forwarded-host": "localhost:3000",
  });
  assert.equal(
    check({ secretKey: "sk_live_51Public", appUrl, requestHosts: requestHostValues(headers) }),
    LIVE_STRIPE_LOCAL_MESSAGE,
  );
});

test("checkout refuses a live key on localhost before creating a session", async () => {
  await withEnv(
    {
      STRIPE_SECRET_KEY: "sk_live_51LocalRefused",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_51LocalOk",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NODE_ENV: "test",
      DATABASE_URL: undefined,
    },
    async () => {
      assert.throws(() => getStripe(), /local address/);
      const localApp = await postCheckout("http://localhost:3000/api/checkout", { host: "localhost:3000" });
      assert.equal(localApp.status, 503);
      assert.equal(await errorOf(localApp), LIVE_STRIPE_LOCAL_MESSAGE);

      process.env.NEXT_PUBLIC_APP_URL = "https://shop.example.com";
      await assert.rejects(
        () => createCheckoutSession([{ skuId: "SPOON-CEDAR-01", qty: 1 }], ["127.0.0.1:3000"]),
        /local address/,
      );
      const localHost = await postCheckout("http://127.0.0.1:3000/api/checkout", { host: "127.0.0.1:3000" });
      const forwarded = await postCheckout("https://shop.example.com/api/checkout", {
        host: "shop.example.com",
        "x-forwarded-host": "[::1]:3000",
      });
      assert.equal(localHost.status, 503);
      assert.equal(forwarded.status, 503);
      assert.equal(await errorOf(localHost), LIVE_STRIPE_LOCAL_MESSAGE);
      assert.equal(await errorOf(forwarded), LIVE_STRIPE_LOCAL_MESSAGE);
    },
  );
});

test("a placeholder live key still reports that Stripe is not configured", async () => {
  await withEnv(
    {
      STRIPE_SECRET_KEY: "sk_live_your_secret",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_your_publishable_key",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NODE_ENV: "test",
      DATABASE_URL: undefined,
    },
    async () => {
      const response = await postCheckout("http://localhost:3000/api/checkout", { host: "localhost:3000" });
      assert.equal(response.status, 503);
      assert.equal(await errorOf(response), "Stripe is not configured.");
    },
  );
});

function postCheckout(url: string, headers: Record<string, string>): Promise<Response> {
  return POST(
    new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ lines: [{ skuId: "SPOON-CEDAR-01", qty: 1 }] }),
    }),
  );
}

async function errorOf(response: Response): Promise<string | undefined> {
  const body = (await response.json()) as { error?: string; url?: string };
  assert.equal(body.url, undefined);
  return body.error;
}

async function withEnv(values: Record<string, string | undefined>, run: () => Promise<void>): Promise<void> {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    await run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}
