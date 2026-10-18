export function DisclosureList({
  items,
}: {
  items: { id: string; title: string; body: React.ReactNode; open?: boolean }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <details key={item.id} open={item.open} className="group">
          <summary className="shop-disclosure shop-focus flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            {item.title}
            <span aria-hidden className="shop-disclosure-icon text-muted group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="pb-4 text-sm leading-6 whitespace-pre-wrap text-muted">{item.body}</div>
        </details>
      ))}
    </div>
  );
}
