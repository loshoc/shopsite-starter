"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { copyText, generateAdminSecret } from "@/lib/generate-admin-secret";

type CopyState = "idle" | "copied" | "manual" | "unavailable";

/**
 * Shown only while admin is closed. The secret is created after a click,
 * held in component state, and never sent to the server.
 */
export function AdminClosed() {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [secret, setSecret] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onGenerate() {
    if (pending) return;
    setPending(true);
    setCopyState("idle");
    setSecret(null);
    try {
      let value: string;
      try {
        value = generateAdminSecret();
      } catch {
        setCopyState("unavailable");
        return;
      }

      const copied = await copyText(value);
      if (copied === "copied") {
        setCopyState("copied");
        return;
      }
      setSecret(value);
      setCopyState("manual");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 text-sm text-zinc-700">
      <p>Admin is closed until ADMIN_SECRET is a random value of at least 32 characters.</p>
      <p>The placeholder in .env.example is rejected on purpose. Login stays closed until a real secret is in the environment and the server is restarted.</p>
      <Button type="button" onClick={() => void onGenerate()} disabled={pending} className="w-full">
        Generate secret
      </Button>
      <div aria-live="polite" className="space-y-2">
        {copyState === "copied" ? <p>Copied.</p> : null}
        {copyState === "manual" && secret ? (
          <div className="space-y-2">
            <p>Clipboard unavailable. Copy this value by hand.</p>
            <textarea
              readOnly
              rows={2}
              value={secret}
              aria-label="Generated admin secret"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              onFocus={(event) => event.currentTarget.select()}
              className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        ) : null}
        {copyState === "unavailable" ? <p>This browser cannot generate a cryptographic secret. Try again.</p> : null}
      </div>
      <p>
        Put the value in <code className="font-mono">.env.local</code> as <code className="font-mono">ADMIN_SECRET=...</code>, then
        restart <code className="font-mono">npm run dev</code>.
      </p>
    </div>
  );
}
