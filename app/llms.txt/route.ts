import { llmsBody } from "@/lib/llms";

/** Built once. GET takes no arguments, so a query string cannot change the body. */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(llmsBody(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
