<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Install with `npm ci`.
- Start with `npm run dev -- --hostname localhost --port 3000` and open `http://localhost:3000`. Next.js 16 listens on `0.0.0.0` by default. With that bind, `request.nextUrl.origin` does not match a browser `Origin` of `http://localhost:3000`, and `proxy.ts` answers `/api/admin/login` with 403. Binding to `localhost` keeps admin requests same-origin. Opening the site at `http://127.0.0.1:3000` is also refused for dev assets (`allowedDevOrigins`).
- Copy `.env.example` to `.env.local` and set `ADMIN_SECRET` to the output of `openssl rand -hex 32`. The example placeholder is rejected, so `/admin` stays closed until the secret is valid. Leave `DATABASE_URL` as the example placeholder so `npm run dev` uses the in-memory catalogue and stock.
- `npm test` and `npm run lint` are the local checks. A production build needs a public `NEXT_PUBLIC_APP_URL` because a localhost value fails `next build`. Use `NEXT_PUBLIC_APP_URL=https://example.com npm run build`.
