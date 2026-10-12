import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col justify-center px-5 py-24">
      <p className="text-xs uppercase tracking-[0.2em] text-copper">404</p>
      <h1 className="mt-3 font-serif text-4xl">That page is not on the shelf.</h1>
      <Link href="/shop" className="mt-6 text-sm text-copper">
        Back to the shop
      </Link>
    </main>
  );
}
