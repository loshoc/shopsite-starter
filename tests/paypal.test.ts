import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import { POST as postCheckout } from "../app/api/checkout/route.ts";
import { GET as getPayPalConfig } from "../app/api/paypal/config/route.ts";
import { POST as postPayPalCapture } from "../app/api/paypal/orders/capture/route.ts";
import { POST as postPayPalOrder } from "../app/api/paypal/orders/route.ts";
import { POST as postPayPalWebhook } from "../app/api/webhooks/paypal/route.ts";
import { listOrders, listStockRecords } from "../lib/db.ts";
import { orderDashboardUrl } from "../lib/order-dashboard.ts";
import {
  LIVE_PAYPAL_LOCAL_MESSAGE,
  paypalConfigProblem,
  paypalStorefrontPayload,
  resetPayPalForTests,
} from "../lib/paypal.ts";
import { seedFixtureStock } from "./stock-fixtures.ts";

const SANDBOX_ID = "SandboxClientIdTest01";
const SANDBOX_SECRET = "SandboxClientSecret01";
const SANDBOX_WEBHOOK = "SandboxWebhookId0001";
const LIVE_ID = "LiveClientIdTest000001";
const LIVE_SECRET = "LiveClientSecret000001";
const LIVE_WEBHOOK = "LiveWebhookId0000001";
const ORDER_ID = "5O190127TN364715T";
const CAPTURE_ID = "8F148933LY538835L";
const SKU = "SPOON-CEDAR-01";

const PAYPAL_KEYS = [
  "PAYPAL_MODE",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "PAYPAL_SANDBOX_CLIENT_ID",
  "PAYPAL_SANDBOX_CLIENT_SECRET",
  "PAYPAL_SANDBOX_WEBHOOK_ID",
  "PAYPAL_LIVE_CLIENT_ID",
  "PAYPAL_LIVE_CLIENT_SECRET",
  "PAYPAL_LIVE_WEBHOOK_ID",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_WEBHOOK_ID",
  "NEXT_PUBLIC_PAYPAL_CLIENT_SECRET",
  "NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_SECRET",
  "NEXT_PUBLIC_PAYPAL_WEBHOOK_ID",
  "NEXT_PUBLIC_APP_URL",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NODE_ENV",
  "DATABASE_URL",
];

describe("paypal", { concurrency: 1 }, () => {
  test("missing PayPal config hides PayPal and leaves Stripe checkout on its own gate", async () => {
    await withEnv(
      {
        STRIPE_SECRET_KEY: "sk_test_your_secret_key",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_your_publishable_key",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NODE_ENV: "test",
      },
      async () => {
        assert.match(paypalConfigProblem() ?? "", /not configured/);
        assert.deepEqual(paypalStorefrontPayload(["localhost:3000"]), { enabled: false });
        const config = await getPayPalConfig(request("http://localhost:3000/api/paypal/config", { host: "localhost:3000" }));
        assert.deepEqual(await config.json(), { enabled: false });
        const checkout = await postCheckout(jsonRequest("http://localhost:3000/api/checkout", { host: "localhost:3000" }));
        assert.equal(checkout.status, 503);
        assert.equal((await checkout.json()).error, "Stripe is not configured.");
      },
    );
  });

  test("placeholder PayPal values stay hidden, including when Stripe is also a placeholder", async () => {
    await withEnv(
      {
        PAYPAL_MODE: "sandbox",
        NEXT_PUBLIC_PAYPAL_CLIENT_ID: "your_sandbox_client_id",
        PAYPAL_SANDBOX_CLIENT_ID: "your_sandbox_client_id",
        PAYPAL_SANDBOX_CLIENT_SECRET: "your_sandbox_client_secret",
        PAYPAL_SANDBOX_WEBHOOK_ID: "your_sandbox_webhook_id",
        STRIPE_SECRET_KEY: "sk_live_your_secret",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NODE_ENV: "test",
      },
      async () => {
        assert.equal(paypalConfigProblem(), "PayPal is not configured.");
        const checkout = await postCheckout(jsonRequest("http://localhost:3000/api/checkout", { host: "localhost:3000" }));
        assert.equal((await checkout.json()).error, "Stripe is not configured.");
      },
    );
  });

  test("a public PayPal secret, a generic secret, a mode mismatch, or a shared sandbox/live value stays hidden", async () => {
    await withEnv(sandboxEnv(), async () => {
      assert.equal(paypalConfigProblem(), null);
    });
    await withEnv({ ...sandboxEnv(), NEXT_PUBLIC_PAYPAL_CLIENT_SECRET: "SandboxClientSecret01" }, async () => {
      assert.equal(paypalConfigProblem(), "PayPal secret must not use NEXT_PUBLIC_.");
    });
    await withEnv({ ...sandboxEnv(), PAYPAL_CLIENT_SECRET: LIVE_SECRET }, async () => {
      assert.equal(paypalConfigProblem(), "PayPal is not configured.");
    });
    await withEnv({ ...sandboxEnv(), NEXT_PUBLIC_PAYPAL_CLIENT_ID: LIVE_ID }, async () => {
      assert.equal(paypalConfigProblem(), "PayPal client id does not match PAYPAL_MODE.");
    });
    await withEnv({ ...sandboxEnv(), PAYPAL_LIVE_CLIENT_ID: SANDBOX_ID, PAYPAL_LIVE_CLIENT_SECRET: LIVE_SECRET }, async () => {
      assert.equal(paypalConfigProblem(), "PayPal sandbox and live credentials must not be the same value.");
    });
    await withEnv(
      { ...sandboxEnv(), PAYPAL_LIVE_CLIENT_ID: LIVE_ID, PAYPAL_LIVE_CLIENT_SECRET: SANDBOX_SECRET },
      async () => {
        assert.equal(paypalConfigProblem(), "PayPal sandbox and live credentials must not be the same value.");
      },
    );
    await withEnv({ ...sandboxEnv(), PAYPAL_MODE: "live" }, async () => {
      assert.equal(paypalConfigProblem(), "PayPal is not configured.");
    });
  });

  test("sandbox is offered on localhost and live is refused there", async () => {
    await withEnv({ ...sandboxEnv(), NEXT_PUBLIC_APP_URL: "http://localhost:3000" }, async () => {
      const payload = paypalStorefrontPayload(["localhost:3000"]);
      assert.equal(payload.enabled, true);
      if (payload.enabled) {
        assert.equal(payload.clientId, SANDBOX_ID);
        assert.equal(payload.currency, "USD");
        assert.equal("clientSecret" in payload, false);
      }
      const response = await getPayPalConfig(request("http://localhost:3000/api/paypal/config", { host: "localhost:3000" }));
      const body = await response.json();
      assert.equal(JSON.stringify(body).includes(SANDBOX_SECRET), false);
      assert.equal(body.enabled, true);
    });

    await withEnv(
      { ...liveEnv(), NEXT_PUBLIC_APP_URL: "http://localhost:3000", NODE_ENV: "test" },
      async () => {
        assert.equal(paypalStorefrontPayload(["localhost:3000"]).enabled, false);
        const response = await postPayPalOrder(
          jsonRequest("http://localhost:3000/api/paypal/orders", { host: "localhost:3000" }),
        );
        assert.equal(response.status, 503);
        assert.equal((await response.json()).error, LIVE_PAYPAL_LOCAL_MESSAGE);
      },
    );
  });

  test("create order calls the sandbox API with the sandbox secret and does not write an order", async () => {
    const calls: { url: string; authorization: string; body: string }[] = [];
    await withEnv(sandboxEnv(), async () => {
      resetPayPalForTests(async (url, init) => {
        calls.push({
          url,
          authorization: String(init?.headers && headerOf(init.headers, "authorization")),
          body: typeof init?.body === "string" ? init.body : "",
        });
        if (url.endsWith("/v1/oauth2/token")) return json({ access_token: "tok_sandbox", expires_in: 3000 });
        if (url.endsWith("/v2/checkout/orders")) return json({ id: ORDER_ID, status: "CREATED" });
        return json({}, 404);
      });
      await seedFixtureStock([{ skuId: SKU, qty: 4, incoming: 0, status: "active", lowStockThreshold: 2 }]);
      const before = await orderCount();
      const response = await postPayPalOrder(
        jsonRequest("https://shop.example.com/api/paypal/orders", { host: "shop.example.com" }),
      );
      assert.equal(response.status, 200);
      assert.equal((await response.json()).orderId, ORDER_ID);
      assert.equal(await orderCount(), before);
      const tokenCall = calls.find((call) => call.url.endsWith("/v1/oauth2/token"));
      const orderCall = calls.find((call) => call.url.endsWith("/v2/checkout/orders"));
      assert.ok(tokenCall);
      assert.ok(orderCall);
      assert.equal(tokenCall.url.startsWith("https://api-m.sandbox.paypal.com/"), true);
      assert.equal(Buffer.from(tokenCall.authorization.replace("Basic ", ""), "base64").toString("utf8"), `${SANDBOX_ID}:${SANDBOX_SECRET}`);
      assert.equal(orderCall.body.includes(LIVE_SECRET), false);
      assert.equal(orderCall.authorization, "Bearer tok_sandbox");
      const created = JSON.parse(orderCall.body) as {
        purchase_units: { amount: { value: string; currency_code: string }; items: { sku: string }[] }[];
      };
      assert.equal(created.purchase_units[0].amount.currency_code, "USD");
      assert.equal(created.purchase_units[0].amount.value, "18.00");
      assert.equal(created.purchase_units[0].items[0].sku, SKU);
    });
  });

  test("sold-out PayPal checkout does not call PayPal", async () => {
    let called = false;
    await withEnv(sandboxEnv(), async () => {
      resetPayPalForTests(async () => {
        called = true;
        return json({}, 500);
      });
      await seedFixtureStock([{ skuId: SKU, qty: 0, incoming: 0, status: "active", lowStockThreshold: 2 }]);
      const response = await postPayPalOrder(
        jsonRequest("https://shop.example.com/api/paypal/orders", { host: "shop.example.com" }),
      );
      assert.equal(response.status, 409);
      assert.equal((await response.json()).error, "Not enough stock to start checkout.");
      assert.equal(called, false);
    });
  });

  test("capture does not write stock, and only a verified webhook does", async () => {
    await withEnv({ ...sandboxEnv(), NEXT_PUBLIC_APP_URL: "https://shop.example.com", NODE_ENV: "test" }, async () => {
      await seedFixtureStock([{ skuId: SKU, qty: 4, incoming: 0, status: "active", lowStockThreshold: 2 }]);
      const ordersBefore = await orderCount();
      installPayPalFetch("SUCCESS");

      const capture = await postPayPalCapture(
        new Request("https://shop.example.com/api/paypal/orders/capture", {
          method: "POST",
          headers: { "content-type": "application/json", host: "shop.example.com" },
          body: JSON.stringify({ orderId: ORDER_ID }),
        }),
      );
      assert.equal(capture.status, 200);
      assert.equal((await stockQty()), 4);
      assert.equal(await orderCount(), ordersBefore);

      const unsigned = await postPayPalWebhook(
        new Request("https://shop.example.com/api/webhooks/paypal", {
          method: "POST",
          body: JSON.stringify(captureEvent()),
        }),
      );
      assert.equal(unsigned.status, 400);
      assert.equal((await stockQty()), 4);

      installPayPalFetch("FAILURE");
      const rejected = await postPayPalWebhook(signedWebhook(captureEvent()));
      assert.equal(rejected.status, 400);
      assert.equal((await stockQty()), 4);

      installPayPalFetch("SUCCESS");
      const accepted = await postPayPalWebhook(signedWebhook(captureEvent()));
      assert.equal(accepted.status, 200);
      assert.equal((await stockQty()), 3);
      const order = (await listOrders()).find((row) => row.stripeSessionId === `paypal:${ORDER_ID}`);
      assert.ok(order);
      assert.equal(order.paymentIntentId, CAPTURE_ID);
      assert.equal(order.email, "buyer@example.com");
      assert.equal(order.totalCents, 1800);
      assert.equal(orderDashboardUrl(order.paymentIntentId, order.stripeSessionId).includes("dashboard.stripe.com"), false);
      assert.match(orderDashboardUrl(order.paymentIntentId, order.stripeSessionId), /^https:\/\/www\.sandbox\.paypal\.com\//);

      const replay = await postPayPalWebhook(signedWebhook(captureEvent()));
      assert.equal(replay.status, 200);
      assert.equal((await stockQty()), 3);

      const refunded = await postPayPalWebhook(signedWebhook(refundEvent()));
      assert.equal(refunded.status, 200);
      assert.equal(await stockQty(), 4);
      const refundedOrder = (await listOrders()).find((row) => row.stripeSessionId === `paypal:${ORDER_ID}`);
      assert.equal(refundedOrder?.status, "refunded");
      assert.equal(refundedOrder?.restocked, true);

      installPayPalFetch("SUCCESS", { ...completedOrder(), purchase_units: mismatchedOrderUnits() });
      const mismatchResponse = await postPayPalWebhook(
        signedWebhook({
          ...captureEvent(),
          id: "WH-MISMATCH-EVENT002",
        }),
      );
      assert.equal(mismatchResponse.status, 500);
      assert.equal(await stockQty(), 4);
    });
  });

  test("PayPal secrets are not public env names", () => {
    const example = read(".env.example");
    assert.match(example, /NEXT_PUBLIC_PAYPAL_CLIENT_ID/);
    assert.doesNotMatch(example, /NEXT_PUBLIC_PAYPAL_(SANDBOX_|LIVE_)?CLIENT_SECRET/);
    assert.doesNotMatch(example, /NEXT_PUBLIC_PAYPAL_(SANDBOX_|LIVE_)?WEBHOOK_ID/);
    assert.match(example, /PAYPAL_SANDBOX_CLIENT_SECRET/);
    assert.match(example, /PAYPAL_LIVE_CLIENT_SECRET/);
    const capture = read("app/api/paypal/orders/capture/route.ts");
    const buttons = read("components/shop/paypal-buttons.tsx");
    assert.equal(capture.includes("applyPaidCheckout"), false);
    assert.equal(capture.includes("applyRefund"), false);
    assert.equal(/SECRET|WEBHOOK_ID/.test(buttons), false);
    assert.match(read("DEPLOY-CHECKLIST.md"), /PAYMENT\.CAPTURE\.COMPLETED/);
    assert.match(read("PLAYBOOK.md"), /\/api\/webhooks\/paypal/);
  });
});

function sandboxEnv(): Record<string, string> {
  return {
    PAYPAL_MODE: "sandbox",
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: SANDBOX_ID,
    PAYPAL_SANDBOX_CLIENT_ID: SANDBOX_ID,
    PAYPAL_SANDBOX_CLIENT_SECRET: SANDBOX_SECRET,
    PAYPAL_SANDBOX_WEBHOOK_ID: SANDBOX_WEBHOOK,
    NEXT_PUBLIC_APP_URL: "https://shop.example.com",
    NODE_ENV: "test",
  };
}

function liveEnv(): Record<string, string> {
  return {
    PAYPAL_MODE: "live",
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: LIVE_ID,
    PAYPAL_LIVE_CLIENT_ID: LIVE_ID,
    PAYPAL_LIVE_CLIENT_SECRET: LIVE_SECRET,
    PAYPAL_LIVE_WEBHOOK_ID: LIVE_WEBHOOK,
  };
}

function captureEvent() {
  return {
    id: "WH-CAPTURE-EVENT0001",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: CAPTURE_ID,
      status: "COMPLETED",
      amount: { currency_code: "USD", value: "18.00" },
      supplementary_data: { related_ids: { order_id: ORDER_ID } },
    },
  };
}

function refundEvent() {
  return {
    id: "WH-REFUND-EVENT00001",
    event_type: "PAYMENT.CAPTURE.REFUNDED",
    resource: {
      id: "1JU08902CX8725123",
      status: "COMPLETED",
      amount: { currency_code: "USD", value: "18.00" },
      links: [
        {
          rel: "up",
          href: `https://api.sandbox.paypal.com/v2/payments/captures/${CAPTURE_ID}`,
        },
      ],
    },
  };
}

function completedOrder() {
  return {
    id: ORDER_ID,
    status: "COMPLETED",
    payer: { email_address: "buyer@example.com" },
    purchase_units: [
      {
        custom_id: JSON.stringify([{ skuId: SKU, qty: 1 }]),
        amount: { currency_code: "USD", value: "18.00" },
        items: [
          {
            name: "Cedar tasting spoon",
            sku: SKU,
            quantity: "1",
            unit_amount: { currency_code: "USD", value: "18.00" },
          },
        ],
        payments: {
          captures: [
            {
              id: CAPTURE_ID,
              status: "COMPLETED",
              amount: { currency_code: "USD", value: "18.00" },
            },
          ],
        },
      },
    ],
  };
}

function mismatchedOrderUnits() {
  return [
    {
      custom_id: JSON.stringify([{ skuId: SKU, qty: 1 }]),
      amount: { currency_code: "USD", value: "1.00" },
      items: [
        {
          name: "Cedar tasting spoon",
          sku: SKU,
          quantity: "1",
          unit_amount: { currency_code: "USD", value: "1.00" },
        },
      ],
      payments: {
        captures: [
          {
            id: CAPTURE_ID,
            status: "COMPLETED",
            amount: { currency_code: "USD", value: "1.00" },
          },
        ],
      },
    },
  ];
}

function installPayPalFetch(verification: "SUCCESS" | "FAILURE", order: unknown = completedOrder()) {
  resetPayPalForTests(async (url, init) => {
    if (url.endsWith("/v1/oauth2/token")) return json({ access_token: "tok_sandbox", expires_in: 3000 });
    if (url.endsWith("/v1/notifications/verify-webhook-signature")) {
      const body = JSON.parse(String(init?.body)) as { webhook_id?: string };
      if (body.webhook_id !== SANDBOX_WEBHOOK) {
        return json({ verification_status: "FAILURE" });
      }
      return json({ verification_status: verification });
    }
    if (url.endsWith(`/v2/checkout/orders/${ORDER_ID}/capture`)) return json({ id: ORDER_ID, status: "COMPLETED" });
    if (url.endsWith(`/v2/checkout/orders/${ORDER_ID}`)) return json(order);
    if (url.endsWith(`/v2/payments/captures/${CAPTURE_ID}`)) {
      return json({
        id: CAPTURE_ID,
        status: "REFUNDED",
        amount: { currency_code: "USD", value: "18.00" },
      });
    }
    return json({}, 404);
  });
}

function signedWebhook(event: unknown): Request {
  return new Request("https://shop.example.com/api/webhooks/paypal", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "paypal-transmission-id": "8b3c4d5e-1111",
      "paypal-transmission-time": "2026-10-17T00:00:00Z",
      "paypal-transmission-sig": "AAAAAAAAAAAAAAAAAAAAAA",
      "paypal-cert-url": "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1",
      "paypal-auth-algo": "SHA256withRSA",
      host: "shop.example.com",
    },
    body: JSON.stringify(event),
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function request(url: string, headers: Record<string, string>): Request {
  return new Request(url, { headers });
}

function jsonRequest(url: string, headers: Record<string, string>): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ lines: [{ skuId: SKU, qty: 1 }] }),
  });
}

function headerOf(headers: HeadersInit, name: string): string | null {
  if (headers instanceof Headers) return headers.get(name);
  if (Array.isArray(headers)) return headers.find(([key]) => key.toLowerCase() === name)?.[1] ?? null;
  const value = headers[name] ?? headers[name.toLowerCase()];
  return typeof value === "string" ? value : null;
}

async function stockQty(): Promise<number> {
  const row = (await listStockRecords()).find((item) => item.skuId === SKU);
  if (!row) throw new Error("missing stock row");
  return row.qty;
}

async function orderCount(): Promise<number> {
  return (await listOrders()).length;
}

function read(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

async function withEnv(values: Record<string, string | undefined>, run: () => Promise<void>): Promise<void> {
  const previous = new Map<string, string | undefined>();
  for (const key of PAYPAL_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(values)) {
    if (!previous.has(key)) previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetPayPalForTests();
  try {
    await run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    resetPayPalForTests();
  }
}
