import { Button } from "@/components/ui/button";
import { AdminNav, MobileAdminNav } from "@/components/admin/nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ShopSite</p>
          <p className="text-sm font-semibold">Admin</p>
        </div>
        <AdminNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
          <MobileAdminNav />
          <p className="text-sm font-medium text-zinc-700">Operations</p>
          <form action="/api/admin/logout" method="post" className="ml-auto">
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </header>
        <div className="flex-1 bg-zinc-50 p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
