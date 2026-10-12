import { redirect } from "next/navigation";

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
            <div className="space-y-2 text-sm text-zinc-700">
              <p>Admin is closed until ADMIN_SECRET is a random value of at least 32 characters.</p>
              <p>The placeholder in .env.example is rejected on purpose. Generate one with openssl rand -base64 32 and put it in .env.local.</p>
            </div>
          ) : (
            <LoginForm nextPath={safeAdminNext(query.next)} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
