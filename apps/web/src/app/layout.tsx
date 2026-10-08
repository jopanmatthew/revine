import type { Metadata } from "next";

import { NetworkBanner } from "@/components/network-banner";
import { SiteHeader } from "@/components/site-header";
import { TestnetStrip } from "@/components/testnet-strip";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { satoshi } from "@/fonts/satoshi";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "revine. — Turn invoices into opportunities.",
    template: "%s · revine.",
  },
  description:
    "revine. helps Indonesian SMEs sell unpaid invoices to financiers and receive cash now. Testnet demo on Sepolia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${satoshi.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <TestnetStrip />
          <SiteHeader />
          <NetworkBanner />
          <main className="flex flex-1 flex-col">{children}</main>
          <Toaster position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
