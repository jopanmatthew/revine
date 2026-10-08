import type { ReactNode } from "react";

/** Scaffolding for routes whose real screen isn't built yet. Remove once each screen lands. */
export function PlaceholderPage({
  title,
  section,
  children,
}: {
  title: string;
  section: string; // e.g. "§9.4"
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-widest text-ink-muted uppercase">Placeholder · PRD {section}</p>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}
