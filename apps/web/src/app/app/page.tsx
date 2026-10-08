import type { Metadata } from "next";
import Link from "next/link";

import { PlaceholderPage } from "@/components/placeholder-page";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pick a role" };

const ROLES = [
  { href: "/seller", title: "I sell goods", description: "Get paid now for your invoices" },
  { href: "/buyer", title: "I owe an invoice", description: "Confirm and pay invoices sent to you" },
  { href: "/financier", title: "I have capital", description: "Finance verified invoices and earn" },
] as const;

export default function RolePickerPage() {
  return (
    <PlaceholderPage title="Role picker" section="§9.3">
      <div className="grid gap-4 sm:grid-cols-3">
        {ROLES.map((role) => (
          <Link key={role.href} href={role.href} className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </PlaceholderPage>
  );
}
