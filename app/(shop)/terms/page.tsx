import type { Metadata } from "next";

import { TextPage } from "@/components/shop/text-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <TextPage title="Terms" lede="Placeholder terms. Not legal advice.">
      <p>Prices are the catalogue amounts in US dollars. Stripe is the merchant of record for the card payment in this demo setup only if you configure it that way. By default you are the merchant.</p>
      <p>Replace this page with terms that match how you actually sell.</p>
    </TextPage>
  );
}
