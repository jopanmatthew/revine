import type { Metadata } from "next";

import { FinancierDashboard } from "./financier-dashboard";

export const metadata: Metadata = { title: "Financier" };

export default function FinancierPage() {
  return <FinancierDashboard />;
}
