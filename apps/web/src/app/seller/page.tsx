import type { Metadata } from "next";

import { SellerDashboard } from "./seller-dashboard";

export const metadata: Metadata = { title: "Seller" };

export default function SellerPage() {
  return <SellerDashboard />;
}
