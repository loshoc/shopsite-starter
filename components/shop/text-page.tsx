export function TextPage({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-copper">TODO: Replace me</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">{title}</h1>
      <p className="mt-4 text-lg text-ink/70">{lede}</p>
      <div className="mt-8 space-y-4 text-sm leading-7 text-ink/80">{children}</div>
    </article>
  );
}
