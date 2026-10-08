import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { InvoiceDetail } from "./invoice-detail";

export const metadata: Metadata = { title: "Invoice" };

export default function InvoicePage({ params }: PageProps<"/invoice/[id]">) {
  return (
    // With Cache Components, params are runtime data and must be read inside Suspense.
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl px-4 pt-10">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      {params.then(({ id }) => (
        <InvoiceDetail rawId={id} />
      ))}
    </Suspense>
  );
}
