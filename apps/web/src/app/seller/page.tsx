import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

import { SellerInvoiceList } from "./seller-invoice-list";

export const metadata: Metadata = { title: "Seller" };

export default function SellerPage() {
  return (
    <PlaceholderPage title="Seller dashboard" section="§9.4">
      <SellerInvoiceList />
    </PlaceholderPage>
  );
}
