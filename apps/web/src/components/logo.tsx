import { cn } from "@/lib/utils";

// Text-only stand-in until the designer exports logo-horizontal-light.svg / -dark.svg to
// public/brand/ (PRD §10.1). Don't draw the mark here; swap this for the SVGs when they land.
export function Logo({ variant = "light", className }: { variant?: "light" | "dark"; className?: string }) {
  return (
    <span
      className={cn(
        "font-heading text-2xl leading-none font-bold tracking-tight",
        variant === "light" ? "text-brand-900" : "text-white",
        className,
      )}
    >
      revine<span className="text-mint">.</span>
    </span>
  );
}
