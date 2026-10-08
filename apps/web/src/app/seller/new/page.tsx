import type { Metadata } from "next";

import { CreateInvoice } from "./create-invoice-form";

export const metadata: Metadata = { title: "New invoice" };

export default function CreateInvoicePage() {
  return <CreateInvoice />;
}
