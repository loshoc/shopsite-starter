import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { GET } from "../app/llms.txt/route.ts";
import { llmsBody } from "../lib/llms.ts";
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
import { aiCrawlerAgents, allowAiCrawlers, keepBingbot, robotsDisallow, robotsPolicy, type RobotsRule } from "../lib/seo.ts";

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

  assert.equal(keepBingbot(undefined), false);
  assert.equal(keepBingbot(""), false);
  assert.equal(keepBingbot("0"), false);
  assert.equal(keepBingbot("true"), false);
  assert.equal(keepBingbot("1"), true);
  assert.equal(keepBingbot(" 1 "), true);

  const sitemap = `${origin}/sitemap.xml`;
  const privatePaths = ["/admin", "/api", "/success", "/cancel"] as const;
  const openRules: RobotsRule[] = [
    { userAgent: "*", allow: "/", disallow: [...privatePaths] },
    { userAgent: [...aiCrawlerAgents], allow: "/", disallow: [...privatePaths] },
  ];
  const closedRules: RobotsRule[] = [
    { userAgent: "*", allow: "/", disallow: [...privatePaths] },
    { userAgent: [...aiCrawlerAgents], disallow: ["/", ...privatePaths] },
  ];
  for (const allowed of [true, false]) {
    const doc = robotsPolicy(sitemap, allowed, false);
    assert.equal(doc.sitemap, sitemap);
    assert.deepEqual(doc.rules, allowed ? openRules : closedRules);
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
        assert.deepEqual(rule?.disallow, ["/", ...robotsDisallow]);
      }
      const blocked = Array.isArray(rule?.disallow) ? rule.disallow : [rule?.disallow];
      for (const path of privatePaths) {
        assert.equal(blocked.includes(path) || blocked.includes("/"), true, `${bot} ${path}`);
      }
    }
  }

  const kept = robotsPolicy(sitemap, false, true);
  assert.deepEqual(kept.rules, [
    { userAgent: "*", allow: "/", disallow: [...privatePaths] },
    {
      userAgent: aiCrawlerAgents.filter((agent) => agent !== "Bingbot"),
      disallow: ["/", ...privatePaths],
    },
    { userAgent: "Bingbot", allow: "/", disallow: [...privatePaths] },
  ]);
  assert.deepEqual(robotsPolicy(sitemap, true, true).rules, openRules);

  const previous = process.env.GEO_ALLOW_AI_CRAWLERS;
  const previousKeep = process.env.GEO_KEEP_BINGBOT;
  try {
    delete process.env.GEO_ALLOW_AI_CRAWLERS;
    delete process.env.GEO_KEEP_BINGBOT;
    assert.equal(allowAiCrawlers(), true);
    assert.equal(keepBingbot(), false);
    const open = rulesByAgent(robots().rules);
    assert.equal(open.get("GPTBot")?.allow, "/");
    assert.deepEqual(open.get("ClaudeBot")?.disallow, [...robotsDisallow]);
    assert.match(robots().sitemap ?? "", /\/sitemap\.xml$/);
    const openSitemap = robots().sitemap;

    process.env.GEO_ALLOW_AI_CRAWLERS = "0";
    const closed = rulesByAgent(robots().rules);
    assert.equal(closed.get("*")?.allow, "/");
    assert.deepEqual(closed.get("*")?.disallow, [...robotsDisallow]);
    assert.deepEqual(closed.get("PerplexityBot")?.disallow, ["/", ...robotsDisallow]);
    assert.deepEqual(closed.get("Bingbot")?.disallow, ["/", ...robotsDisallow]);
    assert.equal(closed.get("Google-Extended")?.allow, undefined);
    for (const agent of ["*", ...aiCrawlerAgents]) {
      const blocked = closed.get(agent)?.disallow;
      const list = Array.isArray(blocked) ? blocked : [blocked];
      for (const path of privatePaths) {
        assert.equal(list.includes(path), true, `${agent} ${path}`);
      }
    }

    const matrix: { ai: string | undefined; keep: string | undefined; rules: RobotsRule[] }[] = [
      { ai: undefined, keep: undefined, rules: openRules },
      { ai: "1", keep: undefined, rules: openRules },
      { ai: "0", keep: undefined, rules: closedRules },
      { ai: "0", keep: "0", rules: closedRules },
      { ai: "1", keep: "0", rules: openRules },
      { ai: undefined, keep: "1", rules: openRules },
      { ai: "1", keep: "1", rules: openRules },
      { ai: "0", keep: "true", rules: closedRules },
      { ai: "0", keep: "1", rules: kept.rules },
    ];
    for (const row of matrix) {
      if (row.ai === undefined) delete process.env.GEO_ALLOW_AI_CRAWLERS;
      else process.env.GEO_ALLOW_AI_CRAWLERS = row.ai;
      if (row.keep === undefined) delete process.env.GEO_KEEP_BINGBOT;
      else process.env.GEO_KEEP_BINGBOT = row.keep;
      const doc = robots();
      assert.equal(doc.sitemap, openSitemap, `sitemap ai=${row.ai} keep=${row.keep}`);
      assert.deepEqual(doc.rules, row.rules, `rules ai=${String(row.ai)} keep=${String(row.keep)}`);
      const byAgent = rulesByAgent(doc.rules);
      for (const agent of ["*", ...aiCrawlerAgents]) {
        const blocked = byAgent.get(agent)?.disallow;
        const list = Array.isArray(blocked) ? blocked : [blocked];
        for (const path of privatePaths) {
          assert.equal(list.includes(path), true, `${agent} ${path} ai=${row.ai} keep=${row.keep}`);
        }
      }
      if (row.keep === "1" && row.ai === "0") {
        assert.equal(byAgent.get("Bingbot")?.allow, "/");
        assert.deepEqual(byAgent.get("Bingbot")?.disallow, [...privatePaths]);
        assert.equal(byAgent.get("GPTBot")?.allow, undefined);
        assert.deepEqual(byAgent.get("ClaudeBot")?.disallow, ["/", ...privatePaths]);
      }
    }
  } finally {
    if (previous === undefined) delete process.env.GEO_ALLOW_AI_CRAWLERS;
    else process.env.GEO_ALLOW_AI_CRAWLERS = previous;
    if (previousKeep === undefined) delete process.env.GEO_KEEP_BINGBOT;
    else process.env.GEO_KEEP_BINGBOT = previousKeep;
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

test("JSON-LD stringifies and escapes < so product copy cannot close the script", () => {
  const hostile = "Cedar <spoon> </script><script>alert(1)</script>";
  const data = productJsonLd(
    product({ name: hostile, description: `Washed ${hostile} linen.` }),
    `${origin}/products/linen-market-tote`,
    "usd",
    origin,
  );
  const raw = serializeJsonLd(data);
  assert.equal(raw, JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026"));
  assert.match(raw, /\\u003c/);
  assert.equal(raw.includes("<"), false);
  assert.equal(raw.includes("</script>"), false);
  assert.equal(JSON.parse(raw).name, hostile);
  const component = read("components/shop/json-ld.tsx");
  assert.match(component, /serializeJsonLd/);
  assert.equal(component.includes("JSON.stringify"), false);
});

test("llms.txt route serves the public catalogue as text", async () => {
  const response = await GET();
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const text = await response.text();
  assert.match(text, /# Demo Shop/);
  assert.match(text, /Cedar tasting spoon/);
  assert.match(text, /\/products\/cedar-spoon/);
  assert.equal(text.includes(siteConfig.supportEmail), false);
  const paths = pathsIn(text);
  assert.equal(paths.some((path) => path === "/admin" || path.startsWith("/admin/")), false);
  assert.equal(paths.some((path) => path === "/api" || path.startsWith("/api/")), false);

  const sentinel = "sk_test_geo_secret_should_not_leak";
  const previousSecret = process.env.ADMIN_SECRET;
  const previousStripe = process.env.STRIPE_SECRET_KEY;
  const previousDatabase = process.env.DATABASE_URL;
  try {
    process.env.ADMIN_SECRET = sentinel;
    process.env.STRIPE_SECRET_KEY = sentinel;
    process.env.DATABASE_URL = "postgresql://user:password@db.internal:5432/orders";
    const again = llmsBody();
    assert.equal(again, text);
    assert.equal(again.includes(sentinel), false);
    assert.equal(again.includes("db.internal"), false);
    assert.equal(again.includes("support@example.com"), false);
  } finally {
    if (previousSecret === undefined) delete process.env.ADMIN_SECRET;
    else process.env.ADMIN_SECRET = previousSecret;
    if (previousStripe === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previousStripe;
    if (previousDatabase === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabase;
  }

  const route = read("app/llms.txt/route.ts");
  assert.match(route, /export const dynamic = "force-static"/);
  assert.match(route, /export function GET\(\): Response/);
  assert.match(route, /"Content-Type": "text\/plain; charset=utf-8"/);
  assert.match(route, /"X-Content-Type-Options": "nosniff"/);
  assert.equal(route.includes("searchParams"), false);
  assert.equal(route.includes("request"), false);
  assert.equal(route.includes("nextUrl"), false);
  assert.equal(route.includes("supportEmail"), false);
  assert.equal(route.includes("ADMIN_SECRET"), false);
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
  const example = read(".env.example");
  assert.match(example, /GEO_ALLOW_AI_CRAWLERS=1/);
  assert.match(example, /Server-only crawler switch/);
  assert.match(example, /Not a secret/);
  assert.match(example, /Set to 0/);
  assert.match(example, /^# GEO_KEEP_BINGBOT=1$/m);
  assert.equal(/^\s*GEO_KEEP_BINGBOT\s*=/m.test(example), false);
  assert.equal(example.includes("NEXT_PUBLIC_GEO_ALLOW_AI_CRAWLERS"), false);
  assert.equal(example.includes("NEXT_PUBLIC_GEO_KEEP_BINGBOT"), false);
  const deploy = read("DEPLOY-CHECKLIST.md");
  assert.match(deploy, /\| `GEO_ALLOW_AI_CRAWLERS` \|/);
  assert.match(deploy, /\| `GEO_KEEP_BINGBOT` \|/);
  assert.match(deploy, /Not a secret and not `NEXT_PUBLIC_`/);
  assert.match(deploy, /Unset by default/);
  const playbook = read("PLAYBOOK.md");
  assert.match(playbook, /GEO_ALLOW_AI_CRAWLERS/);
  assert.match(playbook, /By default, `0` still blocks Bingbot/);
  assert.match(playbook, /`GEO_KEEP_BINGBOT=1` keeps Bingbot \(normal Bing search\)/);
  assert.equal(playbook.includes("PayPal cannot call localhost"), false);
  const policy = read("lib/seo.ts");
  assert.match(policy, /process\.env\.GEO_ALLOW_AI_CRAWLERS/);
  assert.match(policy, /process\.env\.GEO_KEEP_BINGBOT/);
  assert.equal(policy.includes("NEXT_PUBLIC_GEO_ALLOW_AI_CRAWLERS"), false);
  assert.equal(policy.includes("NEXT_PUBLIC_GEO_KEEP_BINGBOT"), false);
});
