import type { Metadata } from "next";

import { TextPage } from "@/components/shop/text-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <TextPage title="Privacy" lede="Placeholder policy for the starter kit.">
      <p>The shop stores a thin order row: email, total, status, and the Stripe Checkout session id. It does not store card numbers or the full Stripe payload.</p>
      <p>The admin session is an httpOnly cookie. Replace this page before you sell to customers.</p>
    </TextPage>
  );
}
