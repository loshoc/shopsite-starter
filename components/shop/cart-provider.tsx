"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "shopsite.cart.v1";

export type CartItem = { skuId: string; qty: number };

type CartValue = {
  items: CartItem[];
  count: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (skuId: string, qty?: number) => void;
  setQty: (skuId: string, qty: number) => void;
  remove: (skuId: string) => void;
  clear: () => void;
};

const EMPTY: CartItem[] = [];
let snapshot: CartItem[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStored(): CartItem[] {
  if (hydrated) return snapshot;
  hydrated = true;
  if (typeof window === "undefined") return snapshot;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return snapshot;
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return snapshot;
    snapshot = parsed.filter(
      (item) => item && typeof item.skuId === "string" && Number.isInteger(item.qty) && item.qty > 0 && item.qty <= 99,
    );
  } catch {
    snapshot = EMPTY;
  }
  return snapshot;
}

function write(next: CartItem[]) {
  snapshot = next;
  hydrated = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode can reject storage. The in-memory bag still works.
  }
  emit();
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, readStored, () => EMPTY);
  const [open, setOpen] = useState(false);

  const value = useMemo<CartValue>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.qty, 0),
      open,
      setOpen,
      add: (skuId, qty = 1) => {
        const existing = snapshot.find((item) => item.skuId === skuId);
        const next = existing
          ? snapshot.map((item) =>
              item.skuId === skuId ? { ...item, qty: Math.min(99, item.qty + qty) } : item,
            )
          : [...snapshot, { skuId, qty }];
        write(next);
        setOpen(true);
      },
      setQty: (skuId, qty) => {
        write(
          qty <= 0
            ? snapshot.filter((item) => item.skuId !== skuId)
            : snapshot.map((item) => (item.skuId === skuId ? { ...item, qty: Math.min(99, qty) } : item)),
        );
      },
      remove: (skuId) => write(snapshot.filter((item) => item.skuId !== skuId)),
      clear: () => write([]),
    }),
    [items, open],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
