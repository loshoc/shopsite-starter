import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { GET } from "../app/llms.txt/route.ts";
import robots from "../app/robots.ts";
import { products } from "../data/products.ts";
import { siteConfig } from "../data/site.config.ts";
import {
  breadcrumbJsonLd,
  centsToPrice,
  disclosureFaqs,
  faqPageJsonLd,
  organizationWebSiteJsonLd,
  productJsonLd,
  serializeJsonLd,
  type JsonLdProduct,
} from "../lib/json-ld.ts";
import { llmsTxt } from "../lib/llms.ts";
import { aiCrawlerAgents, allowAiCrawlers, robotsDisallow, robotsPolicy, type RobotsRule } from "../lib/seo.ts";

const origin = "https://shop.example.com";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function product(overrides: Partial<JsonLdProduct> = {}): JsonLdProduct {
  return {
    name: "Linen market tote",
    description: "Washed oat linen.",
    skuId: "SKU-TOTE-01",
    priceCents: 1999,
    images: ["/products/linen.png"],
    orderable: true,
    storeVariants: [{ skuId: "SKU-TOTE-01", priceCents: 1999, orderable: true }],
    ...overrides,
  };
}

function parsed(data: unknown) {
  const raw = serializeJsonLd(data);
  assert.equal(raw.includes("<"), false);
  return JSON.parse(raw) as Record<string, unknown>;
}

function typesOf(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) typesOf(item, found);
    return found;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record["@type"] === "string") found.push(record["@type"]);
    for (const nested of Object.values(record)) typesOf(nested, found);
  }
  return found;
}

function rulesByAgent(rules: readonly RobotsRule[]): Map<string, RobotsRule> {
  const map = new Map<string, RobotsRule>();
  for (const rule of rules) {
    const names = Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent];
    for (const name of names) map.set(name, rule);
  }
  return map;
}

function pathsIn(text: string): string[] {
  return [...text.matchAll(/https?:\/\/[^\s)]+/g)].map((match) => new URL(match[0]).pathname);
}

test("product JSON-LD is valid, prices live availability, and omits reviews", () => {
  const inStock = parsed(productJsonLd(product(), `${origin}/products/linen-market-tote`, "usd", origin));
  assert.equal(inStock["@context"], "https://schema.org");
  assert.equal(inStock["@type"], "Product");
  assert.equal(inStock.name, "Linen market tote");
  assert.equal(inStock.sku, "SKU-TOTE-01");
  const offer = inStock.offers as { "@type": string; price: string; priceCurrency: string; availability: string; sku: string };
  assert.equal(offer["@type"], "Offer");
  assert.equal(offer.price, "19.99");
  assert.equal(offer.priceCurrency, "USD");
  assert.equal(offer.availability, "https://schema.org/InStock");
  assert.equal(offer.sku, "SKU-TOTE-01");
  assert.equal(centsToPrice(1999), "19.99");

  const soldOut = parsed(
    productJsonLd(
      product({
        orderable: false,
        storeVariants: [{ skuId: "SKU-TOTE-01", priceCents: 1999, orderable: false }],
      }),
      `${origin}/products/linen-market-tote`,
      "usd",
      origin,
    ),
  );
  const sold = soldOut.offers as { price: string; availability: string };
  assert.equal(sold.price, "19.99");
  assert.equal(sold.availability, "https://schema.org/OutOfStock");
  assert.equal(JSON.stringify(soldOut).includes("InStock"), false);

  for (const data of [inStock, soldOut]) {
    const types = typesOf(data);
    assert.equal(types.includes("Review"), false);
    assert.equal(types.includes("AggregateRating"), false);
    assert.equal(JSON.stringify(data).includes("ratingValue"), false);
    assert.equal(JSON.stringify(data).includes("reviewCount"), false);
  }
  assert.equal(read("lib/json-ld.ts").includes("stockUnits"), false);
  const page = read("app/(shop)/products/[id]/page.tsx");
  assert.match(page, /getStoreProduct/);
  assert.match(page, /productJsonLd\(product,/);
});

test("FAQPage matches real questions and skips placeholders", () => {
  assert.equal(faqPageJsonLd([]), null);
  assert.equal(
    faqPageJsonLd([{ question: "TODO: Replace me", answer: "Demo answers are not filled in." }]),
    null,
  );
  assert.equal(faqPageJsonLd([{ question: "  ", answer: "Nowhere" }, { question: "Hours", answer: " " }]), null);

  const data = parsed(
    faqPageJsonLd(
      [
        { question: " Where is the shop? ", answer: " On the shop page. " },
        { question: "Where is the shop?", answer: "Duplicate." },
        { question: "What is the fiber?", answer: "Linen." },
      ],
      `${origin}/faq`,
    ),
  );
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "FAQPage");
  assert.equal(data.url, `${origin}/faq`);
  const main = data.mainEntity as { "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }[];
  assert.equal(main.length, 2);
  assert.equal(main[0]?.["@type"], "Question");
  assert.equal(main[0]?.name, "Where is the shop?");
  assert.equal(main[0]?.acceptedAnswer["@type"], "Answer");
  assert.equal(main[0]?.acceptedAnswer.text, "On the shop page.");
  assert.equal(main[1]?.name, "What is the fiber?");
  assert.equal(main[1]?.acceptedAnswer.text, "Linen.");

  const hostile = faqPageJsonLd(
    [{ question: "</script>", answer: "Safe <answer>." }],
    `${origin}/faq`,
  );
  const raw = serializeJsonLd(hostile);
  assert.equal(raw.includes("</script>"), false);
  assert.equal(JSON.parse(raw).mainEntity[0].name, "</script>");
});

test("product disclosures become FAQPage only when they are questions", () => {
  assert.deepEqual(disclosureFaqs([{ title: "Details", body: "A short spoon carved from fallen cedar." }]), []);
  assert.deepEqual(
    disclosureFaqs([{ title: "TODO: Replace me", body: "Demo answers are not filled in. Replace this page before you go live." }]),
    [],
  );
  assert.deepEqual(disclosureFaqs([{ title: "Shipping", body: "Packed in a box." }]), []);

  const fromBody = disclosureFaqs([
    {
      title: "Details",
      body: "What wood is this?\nFallen cedar.\n\nHow should I wash it?\nHand wash and dry.",
    },
  ]);
  assert.deepEqual(fromBody, [
    { question: "What wood is this?", answer: "Fallen cedar." },
    { question: "How should I wash it?", answer: "Hand wash and dry." },
  ]);
  const schema = parsed(faqPageJsonLd(fromBody, `${origin}/products/cedar-spoon`));
  assert.equal(schema["@type"], "FAQPage");
  assert.equal((schema.mainEntity as { name: string }[])[0]?.name, "What wood is this?");

  assert.deepEqual(disclosureFaqs([{ title: "Is it food safe?", body: "Yes. Food-safe oil." }]), [
    { question: "Is it food safe?", answer: "Yes. Food-safe oil." },
  ]);
});

test("home graph is Organization and WebSite, with breadcrumbs, and no contact data", () => {
  const brand = {
    name: "North",
    tagline: "Quiet goods",
    description: "Objects for the table.",
    supportEmail: "buyer@example.com",
  };
  const graph = parsed(organizationWebSiteJsonLd(brand, origin));
  assert.equal(graph["@context"], "https://schema.org");
  const nodes = graph["@graph"] as { "@type": string; name: string; url: string; description?: string }[];
  assert.deepEqual(
    nodes.map((node) => node["@type"]),
    ["Organization", "WebSite"],
  );
  assert.equal(nodes[0]?.name, "North");
  assert.equal(nodes[0]?.url, origin);
  assert.equal(nodes[0]?.description, "Objects for the table.");
  assert.equal(nodes[1]?.name, "North");
  assert.equal(nodes[1]?.url, origin);
  assert.equal(nodes[1]?.description, "Shop North. Quiet goods.");
  const serialized = JSON.stringify(graph);
  assert.equal(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized), false);
  assert.equal(typesOf(graph).includes("Review"), false);

  const crumbs = parsed(
    breadcrumbJsonLd(
      [
        { name: "Home", path: "/" },
        { name: "Shop", path: "/shop" },
        { name: " Cedar spoon ", path: "/products/cedar-spoon" },
      ],
      origin,
    ),
  );
  assert.equal(crumbs["@type"], "BreadcrumbList");
  const items = crumbs.itemListElement as { "@type": string; position: number; name: string; item: string }[];
  assert.deepEqual(
    items.map((item) => item.position),
    [1, 2, 3],
  );
  assert.equal(items[0]?.["@type"], "ListItem");
  assert.equal(items[0]?.name, "Home");
  assert.equal(items[0]?.item, origin);
  assert.equal(items[2]?.name, "Cedar spoon");
  assert.equal(items[2]?.item, `${origin}/products/cedar-spoon`);
  assert.equal(breadcrumbJsonLd([{ name: " ", path: "/" }], origin), null);
});

test("robots.txt allows AI crawlers by default and blocks them when turned off", () => {
  assert.deepEqual([...aiCrawlerAgents], ["GPTBot", "Google-Extended", "PerplexityBot", "ClaudeBot", "Bingbot"]);
  assert.equal(allowAiCrawlers(""), true);
  assert.equal(allowAiCrawlers("1"), true);
  assert.equal(allowAiCrawlers("true"), true);
  assert.equal(allowAiCrawlers("0"), false);
  assert.equal(allowAiCrawlers("false"), false);
  assert.equal(allowAiCrawlers("OFF"), false);

  const sitemap = `${origin}/sitemap.xml`;
  for (const allowed of [true, false]) {
    const doc = robotsPolicy(sitemap, allowed);
    assert.equal(doc.sitemap, sitemap);
    const rules = rulesByAgent(doc.rules);
    const star = rules.get("*");
    assert.equal(star?.allow, "/");
    assert.deepEqual(star?.disallow, [...robotsDisallow]);
    for (const bot of aiCrawlerAgents) {
      const rule = rules.get(bot);
      assert.ok(rule, bot);
      if (allowed) {
        assert.equal(rule?.allow, "/");
        assert.deepEqual(rule?.disallow, [...robotsDisallow]);
      } else {
        assert.equal(rule?.allow, undefined);
        assert.deepEqual(rule?.disallow, "/");
      }
    }
  }

  const previous = process.env.GEO_ALLOW_AI_CRAWLERS;
  try {
    delete process.env.GEO_ALLOW_AI_CRAWLERS;
    assert.equal(allowAiCrawlers(), true);
    const open = rulesByAgent(robots().rules);
    assert.equal(open.get("GPTBot")?.allow, "/");
    assert.deepEqual(open.get("ClaudeBot")?.disallow, [...robotsDisallow]);
    assert.match(robots().sitemap ?? "", /\/sitemap\.xml$/);

    process.env.GEO_ALLOW_AI_CRAWLERS = "0";
    const closed = rulesByAgent(robots().rules);
    assert.equal(closed.get("*")?.allow, "/");
    assert.deepEqual(closed.get("PerplexityBot")?.disallow, "/");
    assert.deepEqual(closed.get("Bingbot")?.disallow, "/");
    assert.equal(closed.get("Google-Extended")?.allow, undefined);
  } finally {
    if (previous === undefined) delete process.env.GEO_ALLOW_AI_CRAWLERS;
    else process.env.GEO_ALLOW_AI_CRAWLERS = previous;
  }
});

test("llms.txt lists the brand and catalogue and skips private paths and contact data", () => {
  const text = llmsTxt({
    origin,
    brand: siteConfig,
    products: [
      ...products,
      {
        id: "hidden-bowl",
        name: "Hidden bowl",
        description: "Not for sale. buyer@example.com",
        hidden: true,
        priceCents: 100,
      },
    ],
    currency: siteConfig.currency,
  });
  assert.match(text, /^# Demo Shop\n/);
  assert.match(text, /Shop Demo Shop\. Cedar spoon, linen napkin, and stone bowl\./);
  assert.match(text, /A demo storefront for the ShopSite starter/);
  assert.match(text, /\[Cedar tasting spoon\]\(https:\/\/shop\.example\.com\/products\/cedar-spoon\)/);
  assert.match(text, /A short spoon carved from fallen cedar\. 18\.00 USD/);
  assert.match(text, /\[Linen napkin\]\(https:\/\/shop\.example\.com\/products\/linen-napkin\): Stonewashed linen napkin\. 22\.00–24\.00 USD/);
  assert.match(text, /\[FAQ\]\(https:\/\/shop\.example\.com\/faq\)/);
  assert.match(text, /\[Shop\]\(https:\/\/shop\.example\.com\/shop\)/);
  assert.equal(text.includes("Hidden bowl"), false);
  assert.equal(text.includes("buyer@example.com"), false);
  assert.equal(text.includes(siteConfig.supportEmail), false);
  const paths = pathsIn(text);
  for (const blocked of ["/admin", "/api", "/success", "/cancel"]) {
    assert.equal(
      paths.some((path) => path === blocked || path.startsWith(`${blocked}/`)),
      false,
      blocked,
    );
  }
  assert.equal(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text), false);
  assert.match(text, /\n$/);

  const source = read("lib/llms.ts");
  assert.equal(source.includes("supportEmail"), false);
  assert.equal(source.includes("ADMIN_SECRET"), false);
  assert.equal(source.includes("DATABASE_URL"), false);
  assert.equal(source.includes("orders"), false);
});

test("llms.txt route serves the public catalogue as text", async () => {
  const response = await GET();
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  const text = await response.text();
  assert.match(text, /# Demo Shop/);
  assert.match(text, /Cedar tasting spoon/);
  assert.match(text, /\/products\/cedar-spoon/);
  assert.equal(text.includes(siteConfig.supportEmail), false);
  const paths = pathsIn(text);
  assert.equal(paths.some((path) => path === "/admin" || path.startsWith("/admin/")), false);
  assert.equal(paths.some((path) => path === "/api" || path.startsWith("/api/")), false);
});

test("FAQ accordion questions match the schema input, and the crawler switch is documented", () => {
  const faq = read("app/(shop)/faq/page.tsx");
  const disclosure = read("components/shop/disclosure.tsx");
  assert.match(faq, /TODO: Replace me/);
  assert.match(faq, /DisclosureList/);
  assert.match(faq, /title: item\.question/);
  assert.match(faq, /body: item\.answer/);
  assert.match(faq, /faqPageJsonLd\(faqs/);
  assert.match(disclosure, /<details/);
  assert.match(disclosure, /<summary/);
  assert.match(read(".env.example"), /GEO_ALLOW_AI_CRAWLERS=1/);
  assert.match(read(".env.example"), /Set to 0/);
  assert.match(read("PLAYBOOK.md"), /GEO_ALLOW_AI_CRAWLERS/);
  assert.match(read("DEPLOY-CHECKLIST.md"), /GEO_ALLOW_AI_CRAWLERS/);
});
