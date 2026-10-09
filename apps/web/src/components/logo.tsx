import { cn } from "@/lib/utils";

// Text-only app wordmark. Brand artwork lives in docs/assets for the project README.
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
