import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "New invoice" };

export default function CreateInvoicePage() {
  return <PlaceholderPage title="Create invoice" section="§9.5" />;
}
