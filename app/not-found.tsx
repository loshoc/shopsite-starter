import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shop-pad-loose mx-auto flex max-w-lg flex-1 flex-col justify-center">
      <h1 className="shop-display font-medium tracking-tight">Page not found.</h1>
      <Link href="/shop" className="mt-4 text-sm underline">
        Back to the shop
      </Link>
    </main>
  );
}
