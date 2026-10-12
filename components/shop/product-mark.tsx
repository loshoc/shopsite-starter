const marks: Record<string, string> = {
  "linen-market-tote": "from-[#efe2cf] to-[#c4a27a]",
  "speckled-mug": "from-[#f7f1e8] to-[#d7c3ae]",
  "wool-camp-scarf": "from-[#e7efe6] to-[#8ea38a]",
};

export function ProductMark({ id, className = "" }: { id: string; className?: string }) {
  const tone = marks[id] ?? "from-sand to-copper/40";
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${tone} ${className}`} aria-hidden>
      <div className="absolute inset-6 rounded-full border border-ink/10" />
      <div className="absolute bottom-6 left-6 h-px w-16 bg-ink/30" />
    </div>
  );
}
