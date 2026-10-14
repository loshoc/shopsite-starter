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
      <p className="text-sm text-muted">TODO: Replace me</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">{title}</h1>
      <p className="mt-3 text-base text-muted">{lede}</p>
      <div className="mt-8 space-y-4 text-sm leading-7 text-fg/80">{children}</div>
    </article>
  );
}
