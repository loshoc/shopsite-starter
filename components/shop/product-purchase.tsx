"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AddToCart } from "@/components/shop/add-to-cart";
import { siteConfig } from "@/data/site.config";
import { formatMoney } from "@/lib/format";
import { findVariant, initialSelection, optionAxes, selectOption, trustNotes } from "@/lib/storefront-ui";

export type PurchaseVariant = {
  skuId: string;
  priceCents: number;
  orderable: boolean;
  qtyLabel: string;
  options: { name: string; value: string }[];
};

export function ProductPurchase({ name, variants }: { name: string; variants: PurchaseVariant[] }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState(() => initialSelection(variants));
  const axes = useMemo(() => optionAxes(variants), [variants]);
  const selected = findVariant(variants, selection) ?? variants[0];
  const notes = trustNotes(siteConfig.shippingNote, siteConfig.returnsNote);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      document.body.style.paddingBottom = mobile.matches ? `${bar.offsetHeight}px` : "";
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    mobile.addEventListener("change", apply);
    return () => {
      observer.disconnect();
      mobile.removeEventListener("change", apply);
      document.body.style.paddingBottom = "";
    };
  }, []);

  if (!selected) return null;

  function choose(axis: string, value: string) {
    setSelection((current) => selectOption(variants, current, axis, value));
  }

  return (
    <div className="mt-5">
      <p className="shop-title font-medium">{formatMoney(selected.priceCents)}</p>
      {axes.map((axis) => (
        <fieldset key={axis.name} className="mt-5 min-w-0 border-0 p-0">
          <legend className="text-sm">{axis.name}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {axis.values.map((value) => {
              const pressed = selection[axis.name] === value;
              const matched = findVariant(variants, { ...selection, [axis.name]: value });
              const unavailable = matched ? !matched.orderable : false;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => choose(axis.name, value)}
                  className={
                    pressed
                      ? "h-9 rounded-full bg-fg px-3 text-sm text-surface"
                      : `h-9 rounded-full border border-border px-3 text-sm ${unavailable ? "text-muted" : "text-fg"}`
                  }
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {selected.qtyLabel}
      </p>
      <div
        ref={barRef}
        className="mt-4 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:mt-0 max-md:border-t max-md:border-border max-md:bg-surface max-md:px-5 max-md:pt-3 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-3 md:block">
          <div className="min-w-0 flex-1 md:hidden">
            <p className="truncate text-sm">{name}</p>
            <p className="text-sm text-muted">
              {formatMoney(selected.priceCents)} · {selected.qtyLabel}
            </p>
          </div>
          <AddToCart
            skuId={selected.skuId}
            disabled={!selected.orderable}
            className="h-11 w-full max-md:w-auto max-md:shrink-0 max-md:px-5"
          />
        </div>
        <TrustLines notes={notes} className="mt-3 max-md:mt-2" />
      </div>
    </div>
  );
}

function TrustLines({
  notes,
  className = "",
}: {
  notes: { label: string; text: string }[];
  className?: string;
}) {
  if (notes.length === 0) return null;
  return (
    <ul className={`space-y-1 text-sm text-muted ${className}`}>
      {notes.map((note) => (
        <li key={note.label}>
          {note.label}. {note.text}
        </li>
      ))}
    </ul>
  );
}
