import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const launch = read("LAUNCH-CHECKLIST.md");
const deploy = read("DEPLOY-CHECKLIST.md");
const playbook = read("PLAYBOOK.md");
const readme = read("README.md");
const packaging = read("PACKAGING.md");
const docsChecklist = read("DOCUMENTATION-CHECKLIST.md");

test("launch checklist is the buyer pass and is linked from buyer docs", () => {
  for (const phrase of [
    "ADMIN_SECRET",
    "DATABASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "pk_test_",
    "sk_live_",
    "Stripe live keys cannot be used on a local address",
    "currency",
    "Not enough stock to start checkout.",
    "Sold out",
    "Oversold",
    "Admin → Stock",
    "shop.example.com",
  ]) {
    assert.match(launch, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), phrase);
  }
  assert.match(readme, /LAUNCH-CHECKLIST\.md/);
  assert.match(playbook, /LAUNCH-CHECKLIST\.md/);
  assert.match(deploy, /LAUNCH-CHECKLIST\.md/);
  assert.match(docsChecklist, /LAUNCH-CHECKLIST\.md/);
  assert.match(packaging, /LAUNCH-CHECKLIST\.md/);
});

test("Checkout business name docs use Stripe Dashboard field names", () => {
  for (const doc of [launch, deploy, playbook]) {
    assert.match(doc, /Business name/);
    assert.match(doc, /Settings → Business → Business details/);
    assert.match(doc, /Statement descriptor/);
    assert.match(doc, /Shortened descriptor/);
    assert.match(doc, /Public details/);
  }
  assert.match(launch, /dashboard\.stripe\.com\/settings\/business-details/);
  assert.match(deploy, /dashboard\.stripe\.com\/settings\/business-details/);
  assert.match(deploy, /## 4\. Checkout business name/);
  assert.match(docsChecklist, /Statement descriptor/);
});

test("Checkout session create leaves the Dashboard business name in place", () => {
  const stripe = read("lib/stripe.ts");
  assert.equal(stripe.includes("branding_settings"), false);
  assert.equal(stripe.includes("statement_descriptor"), false);
  assert.match(stripe, /currency: siteConfig\.currency/);
  assert.match(stripe, /appInfo: \{ name: "shopsite-starter" \}/);
});
