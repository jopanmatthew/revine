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

/** Pill segmented control on the dark header: Seller · Buyer · Financier, each to its dashboard (§9.1). */
function RoleLinks({ activeHref, className }: { activeHref?: string; className?: string }) {
  return (
    <nav aria-label="Role" className={cn("inline-flex rounded-full bg-white/[0.07] p-1 ring-1 ring-white/10", className)}>
      {ROLES.map(({ href, label }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 flex-1 items-center justify-center rounded-full px-4 text-sm font-medium transition-[color,background-color] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-mint/70 md:h-8",
              active ? "bg-white text-brand-900 shadow-[0_1px_2px_rgb(0_0_0/0.2)]" : "text-white/70 hover:text-white",
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

/** brand-900, so it runs straight into the landing hero and every screen's cover band (§9.1). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-brand-900 text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          aria-label="revine. home"
          className="shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-mint/70"
        >
          <Logo variant="dark" />
        </Link>
        <RoleSwitcher className="mx-auto max-md:hidden" />
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <BalancePill />
          <WalletButton />
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <RoleSwitcher className="flex w-full" />
      </div>
    </header>
  );
}
