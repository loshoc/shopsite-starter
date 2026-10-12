import { AdminShell } from "@/components/admin/shell";
import { requireAdminPage } from "@/lib/admin-guard";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
