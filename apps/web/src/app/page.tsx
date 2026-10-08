import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

// Placeholder for the landing page (PRD §9.2).
export default function LandingPage() {
  return (
    <section className="flex flex-1 flex-col bg-brand-900 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-16 sm:py-24">
        <Logo variant="dark" className="text-4xl" />
        <p className="text-xs font-medium tracking-widest text-white/60 uppercase">Placeholder · PRD §9.2</p>
        <p className="font-medium text-mint">Turn invoices into opportunities.</p>
        <h1 className="max-w-2xl font-heading text-4xl leading-tight font-bold sm:text-5xl">
          Get paid today for invoices due next month.
        </h1>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-11 bg-mint px-5 text-brand-900 hover:bg-mint/90">
            <Link href="/app">Launch app</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
