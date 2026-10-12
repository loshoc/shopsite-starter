import { StockTable } from "@/components/admin/stock-table";
import { listAdminStock } from "@/lib/stock";
import { InventoryUnavailable } from "@/lib/types";

export default async function StockPage() {
  const data = await loadStock();
  if (!data) {
    return <p className="text-sm">Inventory store is unavailable. Check DATABASE_URL. Nothing was opened for sale.</p>;
  }
  const key = data.rows
    .map((row) => `${row.skuId}:${row.qty}:${row.incoming}:${row.sold}:${row.status}:${row.lowStockThreshold}`)
    .join("|");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Stock</h1>
        <p className="text-sm text-muted-foreground">
          Catalogue seed counts are not live quantity. A missing row sells as zero.
        </p>
      </div>
      <StockTable key={key} mode={data.mode} rows={data.rows} />
    </div>
  );
}

async function loadStock() {
  try {
    return await listAdminStock();
  } catch (error) {
    if (error instanceof InventoryUnavailable) return null;
    throw error;
  }
}
