import type { Metadata } from "next";
import { Suspense } from "react";

import { PlaceholderPage } from "@/components/placeholder-page";
import { Skeleton } from "@/components/ui/skeleton";

import { InvoiceSummary } from "./invoice-summary";

export const metadata: Metadata = { title: "Invoice" };

export default function InvoicePage({ params }: PageProps<"/invoice/[id]">) {
  return (
    <PlaceholderPage title="Invoice detail" section="§9.10">
      {/* With Cache Components, params are runtime data and must be read inside Suspense. */}
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
        {params.then(({ id }) => (
          <InvoiceSummary rawId={id} />
        ))}
      </Suspense>
    </PlaceholderPage>
  );
}
