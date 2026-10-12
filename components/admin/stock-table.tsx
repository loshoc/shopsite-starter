"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ModeBanner } from "@/components/admin/mode-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockStatus } from "@/lib/types";

type AdminStockRow = {
  skuId: string;
  name: string;
  priceCents: number;
  catalogueQty: number;
  featured: boolean;
  qty: number;
  sold: number;
  incoming: number;
  status: StockStatus | "missing";
  lowStockThreshold: number;
  persisted: boolean;
  badge: "missing" | "hidden" | "unlimited" | "out" | "low" | "in";
};

type Draft = {
  skuId: string;
  qty: number;
  incoming: number;
  status: StockStatus;
  lowStockThreshold: number;
};

const badgeTone = {
  missing: "bad",
  hidden: "neutral",
  unlimited: "info",
  out: "bad",
  low: "warn",
  in: "ok",
} as const;

export function StockTable({
  mode,
  rows,
}: {
  mode: "memory" | "postgres";
  rows: AdminStockRow[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>(() => rows.map(toDraft));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      const dirty = drafts.some((draft) => {
        const original = rows.find((row) => row.skuId === draft.skuId);
        return original ? !same(draft, original) : true;
      });
      if (!dirty) router.refresh();
    };
    const id = window.setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [drafts, rows, router]);

  const dirtyCount = useMemo(
    () => drafts.filter((draft) => {
      const original = rows.find((row) => row.skuId === draft.skuId);
      return original ? !same(draft, original) : false;
    }).length,
    [drafts, rows],
  );

  function update(skuId: string, patch: Partial<Draft>) {
    setDrafts((current) => current.map((draft) => (draft.skuId === skuId ? { ...draft, ...patch } : draft)));
  }

  async function saveAll() {
    const changed = drafts.filter((draft) => {
      const original = rows.find((row) => row.skuId === draft.skuId);
      return original ? !same(draft, original) : false;
    });
    if (changed.length === 0) return;
    setPending(true);
    const response = await fetch("/api/admin/stock", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rows: changed }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!response.ok) {
      toast.error(data.error ?? "Could not save stock.");
      return;
    }
    toast.success("Stock saved.");
    router.refresh();
  }

  async function seed() {
    setPending(true);
    const response = await fetch("/api/admin/stock/seed", { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as { error?: string; inserted?: number };
    setPending(false);
    if (!response.ok) {
      toast.error(data.error ?? "Could not seed.");
      return;
    }
    toast.success(data.inserted ? `Inserted ${data.inserted} SKU${data.inserted === 1 ? "" : "s"}.` : "Catalogue already seeded. Live rows were left alone.");
    router.refresh();
  }

  async function receive(skuId: string) {
    setPending(true);
    const response = await fetch("/api/admin/stock/receive", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ skuId }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; received?: boolean };
    setPending(false);
    if (!response.ok) {
      toast.error(data.error ?? "Could not receive.");
      return;
    }
    toast.success(data.received ? "Incoming moved into quantity." : "Nothing incoming to receive.");
    router.refresh();
  }

  const missing = rows.every((row) => !row.persisted);

  return (
    <div className="space-y-4">
      <ModeBanner mode={mode} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void saveAll()} disabled={pending || dirtyCount === 0}>
          Save all{dirtyCount ? ` (${dirtyCount})` : ""}
        </Button>
        <Button type="button" variant="outline" onClick={() => void seed()} disabled={pending}>
          Seed catalogue
        </Button>
        <p className="text-xs text-muted-foreground">Seed inserts missing SKUs only. It never overwrites live quantity.</p>
      </div>
      {missing ? (
        <p className="rounded-md border border-border bg-card px-3 py-3 text-sm">
          No stock rows yet. Seed the catalogue, or set DATABASE_URL and seed. A missing row is treated as quantity 0 at checkout.
        </p>
      ) : null}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Incoming</TableHead>
              <TableHead>Sold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Low at</TableHead>
              <TableHead>State</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const draft = drafts.find((item) => item.skuId === row.skuId) ?? toDraft(row);
              const dirty = !same(draft, row);
              return (
                <TableRow key={row.skuId} className={dirty ? "bg-amber-50" : undefined}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.skuId}</div>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20"
                      type="number"
                      min={0}
                      value={draft.qty}
                      disabled={!row.persisted}
                      onChange={(event) => update(row.skuId, { qty: Number(event.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20"
                      type="number"
                      min={0}
                      value={draft.incoming}
                      disabled={!row.persisted}
                      onChange={(event) => update(row.skuId, { incoming: Number(event.target.value) })}
                    />
                  </TableCell>
                  <TableCell className="tabular-nums">{row.sold}</TableCell>
                  <TableCell>
                    <select
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      value={draft.status}
                      disabled={!row.persisted}
                      onChange={(event) => update(row.skuId, { status: event.target.value as StockStatus })}
                    >
                      <option value="active">active</option>
                      <option value="hidden">hidden</option>
                      <option value="unlimited">unlimited</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20"
                      type="number"
                      min={0}
                      value={draft.lowStockThreshold}
                      disabled={!row.persisted}
                      onChange={(event) => update(row.skuId, { lowStockThreshold: Number(event.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge tone={badgeTone[row.badge]}>{row.badge}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending || !row.persisted || row.incoming <= 0}
                      onClick={() => void receive(row.skuId)}
                    >
                      Receive
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const draft = drafts.find((item) => item.skuId === row.skuId) ?? toDraft(row);
          return (
            <div key={row.skuId} className="space-y-3 rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.skuId}</p>
                </div>
                <Badge tone={badgeTone[row.badge]}>{row.badge}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted-foreground">
                  Qty
                  <Input type="number" min={0} value={draft.qty} disabled={!row.persisted} onChange={(event) => update(row.skuId, { qty: Number(event.target.value) })} />
                </label>
                <label className="text-xs text-muted-foreground">
                  Incoming
                  <Input type="number" min={0} value={draft.incoming} disabled={!row.persisted} onChange={(event) => update(row.skuId, { incoming: Number(event.target.value) })} />
                </label>
              </div>
              <Button type="button" size="sm" variant="outline" disabled={pending || !row.persisted || row.incoming <= 0} onClick={() => void receive(row.skuId)}>
                Receive incoming
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toDraft(row: AdminStockRow): Draft {
  return {
    skuId: row.skuId,
    qty: row.qty,
    incoming: row.incoming,
    status: row.status === "missing" ? "active" : row.status,
    lowStockThreshold: row.lowStockThreshold,
  };
}

function same(draft: Draft, row: AdminStockRow): boolean {
  const status = row.status === "missing" ? "active" : row.status;
  return (
    draft.qty === row.qty &&
    draft.incoming === row.incoming &&
    draft.status === status &&
    draft.lowStockThreshold === row.lowStockThreshold
  );
}
