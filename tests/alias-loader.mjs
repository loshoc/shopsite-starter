// Node's test runner does not read tsconfig paths. Rewrite `@/` and the
// `server-only` marker so inventory modules can be exercised in tests.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return nextResolve(new URL("./empty-server-only.mjs", import.meta.url).href, context);
  }
  if (specifier.startsWith("@/")) {
    const file = new URL(`../${specifier.slice(2)}.ts`, import.meta.url);
    return nextResolve(file.href, context);
  }
  return nextResolve(specifier, context);
}
