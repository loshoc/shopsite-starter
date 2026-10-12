"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatMoney, formatWhen } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export type ThinOrder = {
  email: string | null;
  totalCents: number;
  currency: string;
  status: OrderStatus;
  stripeSessionId: string;
  dashboardUrl: string;
  restocked: boolean;
  createdAt: string;
};

export function OrdersTable({ orders }: { orders: ThinOrder[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<ThinOrder | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);

  async function restock() {
    if (!target || !confirm) return;
    setPending(true);
    const response = await fetch("/api/admin/orders/restock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stripeSessionId: target.stripeSessionId }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!response.ok) {
      toast.error(data.error ?? "Could not restock.");
      return;
    }
    toast.success("Reserved units returned to stock.");
    setTarget(null);
    setConfirm(false);
    router.refresh();
  }

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">No orders yet. Paid Checkout sessions show up here after the webhook.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Session</th>
              <th className="px-3 py-2 font-medium">Stock</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.stripeSessionId} className="border-b border-border last:border-0">
                <td className="px-3 py-3 whitespace-nowrap">{formatWhen(order.createdAt)}</td>
                <td className="px-3 py-3">{order.email ?? "Guest"}</td>
                <td className="px-3 py-3 whitespace-nowrap">{formatMoney(order.totalCents, order.currency)}</td>
                <td className="px-3 py-3">{labelStatus(order.status)}</td>
                <td className="px-3 py-3">
                  <a className="text-zinc-900 underline" href={order.dashboardUrl} target="_blank" rel="noreferrer">
                    {order.stripeSessionId.slice(0, 14)}…
                  </a>
                </td>
                <td className="px-3 py-3">
                  {order.restocked ? (
                    <span className="text-xs text-muted-foreground">Restocked</span>
                  ) : order.status === "paid" ? (
                    <span className="text-xs text-muted-foreground">Held</span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTarget(order);
                        setConfirm(false);
                      }}
                    >
                      Restock inventory
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AlertDialog open={Boolean(target)} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restock this refund?</AlertDialogTitle>
            <AlertDialogDescription>
              Partial refunds do not return units automatically. Check the box to put the reserved units back on the shelf.
              Full refunds already restock unless this row still says otherwise.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 flex items-center gap-2">
            <Checkbox id="restock" checked={confirm} onCheckedChange={(value) => setConfirm(value === true)} />
            <Label htmlFor="restock">Restock inventory</Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm">
              Cancel
            </AlertDialogCancel>
            <Button type="button" disabled={!confirm || pending} onClick={() => void restock()}>
              {pending ? "Restocking…" : "Restock reserved units"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function labelStatus(status: OrderStatus): string {
  if (status === "partially_refunded") return "Partial refund";
  if (status === "refunded") return "Refunded";
  return "Paid";
}
