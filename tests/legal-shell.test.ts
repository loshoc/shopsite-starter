import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const policyPages = [
  "app/(shop)/shipping/page.tsx",
  "app/(shop)/returns/page.tsx",
  "app/(shop)/privacy/page.tsx",
  "app/(shop)/terms/page.tsx",
];

test("policy pages stay shells with a replace marker", () => {
  for (const path of policyPages) {
    const source = read(path);
    assert.match(source, /Policy not set yet/);
    assert.match(source, /TODO: Replace me/);
    assert.equal(/\d+\s*-?\s*days?/i.test(source), false, path);
  }
});

test("faq stays marked replace-me; footer and kicker are buyer instructions", () => {
  assert.match(read("app/(shop)/faq/page.tsx"), /TODO: Replace me/);
  const footer = read("components/shop/footer.tsx");
  const textPage = read("components/shop/text-page.tsx");
  assert.equal(footer.includes("TODO: Replace me"), false);
  assert.match(footer, /Replace this line with your store footer\./);
  assert.equal(textPage.includes("TODO: Replace me"), false);
  assert.match(textPage, /Replace this line with your page label\./);
});

test("release docs force a legal and footer pass before go-live", () => {
  const checklist = read("DOCUMENTATION-CHECKLIST.md");
  const playbook = read("PLAYBOOK.md");
  const packaging = read("PACKAGING.md");
  for (const doc of [checklist, playbook]) {
    assert.match(doc, /Legal pages and footer/);
    assert.match(doc, /before go-live/i);
    assert.match(doc, /components\/shop\/footer\.tsx/);
    for (const page of ["/shipping", "/returns", "/faq", "/privacy", "/terms"]) {
      assert.match(doc, new RegExp(page));
    }
  }
  assert.match(packaging, /Policy not set yet/);
  assert.match(packaging, /TODO: Replace me/);
  assert.match(packaging, /before their own go-live/);
  for (const doc of [checklist, playbook, packaging]) {
    assert.match(doc, /Replace this line with your store footer/);
    assert.match(doc, /Replace this line with your page label/);
  }
});
