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
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg [&::-webkit-details-marker]:hidden">
            {item.title}
            <span aria-hidden className="text-muted transition group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="pb-4 text-sm leading-6 whitespace-pre-wrap text-muted">{item.body}</div>
        </details>
      ))}
    </div>
  );
}
