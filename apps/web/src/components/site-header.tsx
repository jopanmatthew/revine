"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { BalancePill } from "@/components/balance-pill";
import { Logo } from "@/components/logo";
import { WalletButton } from "@/components/wallet-button";
import { cn } from "@/lib/utils";

const ROLES = [
  { href: "/seller", label: "Seller" },
  { href: "/buyer", label: "Buyer" },
  { href: "/financier", label: "Financier" },
] as const;

/** Segmented control: Seller · Buyer · Financier, each navigating to its dashboard (§9.1). */
function RoleLinks({ activeHref, className }: { activeHref?: string; className?: string }) {
  return (
    <nav aria-label="Role" className={cn("inline-flex rounded-lg bg-muted p-1", className)}>
      {ROLES.map(({ href, label }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 flex-1 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors md:h-8",
              active ? "bg-card text-ink shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveRoleLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  const active = ROLES.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  return <RoleLinks activeHref={active?.href} className={className} />;
}

/** usePathname suspends while /invoice/[id] prerenders (Cache Components), so it sits in Suspense. */
function RoleSwitcher({ className }: { className?: string }) {
  return (
    <Suspense fallback={<RoleLinks className={className} />}>
      <ActiveRoleLinks className={className} />
    </Suspense>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" aria-label="revine. home" className="shrink-0">
          <Logo />
        </Link>
        <RoleSwitcher className="mx-auto max-md:hidden" />
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <BalancePill />
          <WalletButton />
        </div>
      </div>
      <div className="px-4 pb-2 md:hidden">
        <RoleSwitcher className="flex w-full" />
      </div>
    </header>
  );
}
