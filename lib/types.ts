export type StockStatus = "active" | "hidden" | "unlimited";

export type ReservationLine = {
  skuId: string;
  qty: number;
};

export type StockRecord = {
  skuId: string;
  qty: number;
  sold: number;
  incoming: number;
  status: StockStatus;
  lowStockThreshold: number;
  updatedAt: string;
};

export type OrderStatus = "paid" | "partially_refunded" | "refunded";

export type OrderRecord = {
  stripeSessionId: string;
  email: string | null;
  totalCents: number;
  currency: string;
  status: OrderStatus;
  paymentIntentId: string | null;
  reservation: ReservationLine[];
  amountRefundedCents: number;
  restocked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaidCheckout = {
  eventId: string;
  eventType: string;
  stripeSessionId: string;
  email: string | null;
  totalCents: number;
  currency: string;
  paymentIntentId: string | null;
  reservation: ReservationLine[];
};

export type RefundInput = {
  eventId: string;
  eventType: string;
  paymentIntentId: string | null;
  amount: number;
  amountRefunded: number;
  fullyRefunded: boolean;
};

export type StockDraft = {
  skuId: string;
  qty: number;
  incoming: number;
  status: StockStatus;
  lowStockThreshold: number;
};

export class InventoryUnavailable extends Error {
  readonly code = "inventory_unavailable";

  constructor() {
    super("Inventory store is unavailable");
    this.name = "InventoryUnavailable";
  }
}

export class StockNotSeeded extends Error {
  readonly code = "stock_not_seeded";

  constructor(skuId: string) {
    super(`No stock row for ${skuId}. Seed the catalogue before saving.`);
    this.name = "StockNotSeeded";
    this.skuId = skuId;
  }

  readonly skuId: string;
}
