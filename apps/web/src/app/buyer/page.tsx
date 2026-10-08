import type { Metadata } from "next";

import { BuyerDashboard } from "./buyer-dashboard";

export const metadata: Metadata = { title: "Buyer" };

export default function BuyerPage() {
  return <BuyerDashboard />;
}
