import type { Metadata } from "next";

import { CreditBadgeFlow } from "./credit-badge-flow";

export const metadata: Metadata = { title: "Credit badge" };

export default function CreditBadgePage() {
  return <CreditBadgeFlow />;
}
