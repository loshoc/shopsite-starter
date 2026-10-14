export type Option = { name: string; value: string };

export type ChoiceVariant = {
  options: Option[];
  orderable?: boolean;
};

export function optionAxes(variants: { options: Option[] }[]): { name: string; values: string[] }[] {
  const order: string[] = [];
  const values = new Map<string, string[]>();
  for (const variant of variants) {
    for (const option of variant.options) {
      const name = option.name.trim();
      const value = option.value.trim();
      if (!name || !value) continue;
      let list = values.get(name);
      if (!list) {
        list = [];
        values.set(name, list);
        order.push(name);
      }
      if (!list.includes(value)) list.push(value);
    }
  }
  return order.map((name) => ({ name, values: values.get(name) ?? [] }));
}

export function findVariant<T extends { options: Option[] }>(
  variants: T[],
  selection: Record<string, string>,
): T | undefined {
  const names = Object.keys(selection);
  return variants.find((variant) => {
    if (variant.options.length !== names.length) return false;
    return variant.options.every((option) => selection[option.name] === option.value);
  });
}

export function initialSelection<T extends ChoiceVariant>(variants: T[]): Record<string, string> {
  const chosen = variants.find((variant) => variant.orderable) ?? variants[0];
  return Object.fromEntries((chosen?.options ?? []).map((option) => [option.name, option.value]));
}

/** Keeps the clicked value and snaps the other axes onto a real variant. */
export function selectOption<T extends { options: Option[] }>(
  variants: T[],
  selection: Record<string, string>,
  name: string,
  value: string,
): Record<string, string> {
  const next = { ...selection, [name]: value };
  if (findVariant(variants, next)) return next;
  const fallback = variants.find((variant) =>
    variant.options.some((option) => option.name === name && option.value === value),
  );
  if (!fallback) return next;
  return Object.fromEntries(fallback.options.map((option) => [option.name, option.value]));
}

export function variantHint(variants: { options: Option[] }[]): string | null {
  const axis = optionAxes(variants).find((item) => item.values.length > 1);
  if (!axis) return null;
  const shown = axis.values.slice(0, 3);
  const extra = axis.values.length - shown.length;
  const list = extra > 0 ? `${shown.join(", ")} +${extra}` : shown.join(", ");
  return `${axis.name}: ${list}`;
}

export function displayPriceCents(
  variants: { priceCents: number }[],
  fallback: number,
): { cents: number; from: boolean } {
  if (variants.length === 0) return { cents: fallback, from: false };
  const prices = variants.map((variant) => variant.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { cents: min, from: min !== max };
}

export function trustNotes(
  shippingNote: string,
  returnsNote: string,
): { label: "Shipping" | "Returns"; text: string }[] {
  const lines: { label: "Shipping" | "Returns"; text: string }[] = [];
  const shipping = shippingNote.trim();
  const returns = returnsNote.trim();
  if (shipping) lines.push({ label: "Shipping", text: shipping });
  if (returns) lines.push({ label: "Returns", text: returns });
  return lines;
}

export function publishedFaqs(
  faqs: readonly { question: string; answer: string }[],
): { question: string; answer: string }[] {
  return faqs
    .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
    .filter((item) => item.question.length > 0 && item.answer.length > 0);
}

/** Esc should move focus to the Bag control unless it is already there. */
export function shouldMoveFocusToBag(activeId: string | null): boolean {
  return activeId !== "bag-control";
}
