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
    <article className="shop-pad-loose mx-auto w-full max-w-2xl">
      <p className="text-sm text-muted">Replace this line with your page label.</p>
      <h1 className="shop-display mt-2 font-medium tracking-tight">{title}</h1>
      <p className="mt-3 text-base text-muted">{lede}</p>
      <div className="mt-8 space-y-4 text-sm leading-7 text-fg/80">{children}</div>
    </article>
  );
}
