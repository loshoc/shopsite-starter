import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col justify-center px-5 py-16">
      <h1 className="text-3xl font-medium tracking-tight">Page not found.</h1>
      <Link href="/shop" className="mt-4 text-sm underline">
        Back to the shop
      </Link>
    </main>
  );
}
