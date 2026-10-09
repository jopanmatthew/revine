"use client";

import Link from "next/link";
import { ArrowRightIcon, HandCoinsIcon, ReceiptTextIcon, StoreIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { BalancePill } from "@/components/balance-pill";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet-button";
import { cn } from "@/lib/utils";

const ROLES = [
  { href: "/seller", label: "Seller", icon: StoreIcon },
  { href: "/buyer", label: "Buyer", icon: ReceiptTextIcon },
  { href: "/financier", label: "Financier", icon: HandCoinsIcon },
] as const;

/** Pill segmented control on the dark header: Seller · Buyer · Financier, each to its dashboard. */
function RoleLinks({ activeHref, className }: { activeHref?: string; className?: string }) {
  return (
    <nav aria-label="Role" className={cn("inline-flex rounded-full bg-white/[0.07] p-1 ring-1 ring-white/10", className)}>
      {ROLES.map(({ href, label, icon: Icon }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium transition-[color,background-color] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-mint/70 md:h-9",
              active ? "bg-white text-brand-900 shadow-[0_1px_2px_rgb(0_0_0/0.2)]" : "text-white/70 hover:text-white",
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveRoleLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  if (pathname === "/") return <LandingLinks className={className} />;
  const active = ROLES.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  return <RoleLinks activeHref={active?.href} className={className} />;
}

function LandingLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Explore revine" className={cn("flex items-center gap-6 max-md:justify-center", className)}>
      <Link
        href="#how-it-works"
        className="text-sm font-medium text-white/70 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/70"
      >
        How it works
      </Link>
      <Link
        href="#privacy"
        className="text-sm font-medium text-white/70 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/70"
      >
        Privacy
      </Link>
    </nav>
  );
}

function HeaderAccount() {
  const pathname = usePathname();
  if (pathname === "/") {
    return (
      <Button asChild className="ml-auto h-10 rounded-full bg-mint px-4 text-brand-900 hover:bg-white md:ml-0">
        <Link href="/app">
          Launch app
          <ArrowRightIcon data-icon="inline-end" aria-hidden />
        </Link>
      </Button>
    );
  }
  return (
    <div className="ml-auto flex items-center gap-2 md:ml-0">
      <BalancePill />
      <WalletButton />
    </div>
  );
}

/** usePathname suspends while /invoice/[id] prerenders (Cache Components), so it sits in Suspense. */
function RoleSwitcher({ className }: { className?: string }) {
  return (
    <Suspense fallback={<span aria-hidden className={cn("invisible h-10 w-56", className)} />}>
      <ActiveRoleLinks className={className} />
    </Suspense>
  );
}

/** brand-900, so it runs straight into the landing hero and every screen's cover band. */
export function SiteHeader() {
  return (
    <header data-motion="header" className="sticky top-0 z-40 bg-brand-900 text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          aria-label="revine. home"
          className="shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-mint/70"
        >
          <Logo variant="dark" />
        </Link>
        <RoleSwitcher className="mx-auto max-md:hidden" />
        <Suspense fallback={null}>
          <HeaderAccount />
        </Suspense>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <RoleSwitcher className="flex w-full" />
      </div>
    </header>
  );
}
