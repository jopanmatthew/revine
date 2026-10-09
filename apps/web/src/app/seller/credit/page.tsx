import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { USE_MOCKS, ZK_PROOFS_ENABLED } from "@/lib/config";

import { CreditBadgeFlow } from "./credit-badge-flow";

export const metadata: Metadata = { title: "Credit badge" };

export default function CreditBadgePage() {
  if (!USE_MOCKS && !ZK_PROOFS_ENABLED) redirect("/seller");
  return <CreditBadgeFlow />;
}
