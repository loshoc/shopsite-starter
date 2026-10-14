import { redirect } from "next/navigation";

import { AdminClosed } from "@/components/admin/admin-closed";
import { LoginForm } from "@/components/admin/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminConfigProblem, hasValidAdminSession } from "@/lib/admin-auth";
import { safeAdminNext } from "@/lib/admin-secret";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const query = await searchParams;
  const problem = adminConfigProblem();
  if (!problem && (await hasValidAdminSession())) {
    redirect(safeAdminNext(query.next));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ShopSite</p>
          <CardTitle className="text-lg">Admin login</CardTitle>
        </CardHeader>
        <CardContent>
          {problem || query.error === "config" ? (
            <AdminClosed />
          ) : (
            <LoginForm nextPath={safeAdminNext(query.next)} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
