"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { StickyAction } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Highlight a changed amount without ever clipping or hiding its digits.
 */
export function PrintedFigure({ value, children }: { value: bigint | number | string; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current !== value && ref.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current.animate([{ filter: "brightness(1.2)" }, { filter: "brightness(1)" }], {
        duration: 300,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
      });
    }
    previous.current = value;
  }, [value]);

  return (
    <span ref={ref} className="inline-block">
      {children}
    </span>
  );
}

export interface CoverFigure {
  label: string;
  value: ReactNode;
}

/**
 * Every screen opens like the landing hero (§9.1): a brand-900 band straight under the dark header,
 * the one number that matters set large, the screen's one action as a mint pill, and its tabs as
 * pills. With `overlap`, the band leaves room for the page's first white sheet to rise over its edge.
 * Titles mix weights like the landing H1: wrap the key words in <strong>.
 */
export function Cover({
  title,
  lede,
  badge,
  hero,
  figures = [],
  action,
  tabs,
  loading = false,
  overlap = true,
  children,
}: {
  title: ReactNode;
  lede?: ReactNode; // one line under the title on screens without a hero figure
  badge?: ReactNode;
  hero?: { label: string; value: ReactNode; note?: ReactNode };
  figures?: CoverFigure[];
  action?: ReactNode;
  tabs?: ReactNode; // a <CoverTabs>, inside a <Tabs> that wraps the whole screen
  loading?: boolean;
  overlap?: boolean;
  children?: ReactNode; // e.g. a back link above the title
}) {
  return (
    <section data-motion="cover" className="bg-brand-900 text-white">
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-6 sm:gap-8 sm:pt-10",
          overlap ? "pb-20 sm:pb-24" : "pb-10 sm:pb-14",
        )}
      >
        {children}
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1
                className={
                  hero
                    ? "text-xl font-normal tracking-tight text-white/75 sm:text-2xl [&_strong]:font-bold [&_strong]:text-white"
                    : "max-w-3xl text-[2.5rem] leading-[1.04] font-normal tracking-[-0.035em] text-balance sm:text-6xl [&_strong]:font-bold"
                }
              >
                {title}
              </h1>
              {badge}
            </div>
            {lede && <p className="max-w-2xl text-base text-pretty text-white/70 sm:text-lg">{lede}</p>}
          </div>
          {action && <StickyAction>{action}</StickyAction>}
        </div>

        {hero && (
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-32 bg-white/10" />
                <Skeleton className="h-14 w-72 bg-white/10" />
              </div>
            ) : (
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-sm text-white/60">{hero.label}</span>
                <span className="text-[clamp(1.65rem,8.5vw,2.75rem)] leading-[0.95] font-bold tracking-[-0.035em] tabular-nums sm:text-6xl lg:text-7xl">
                  {hero.value}
                </span>
                {hero.note && <span className="mt-1.5 max-w-xl text-sm text-pretty text-white/70 sm:text-base">{hero.note}</span>}
              </div>
            )}

            {figures.length > 0 && (
              <dl className="flex flex-wrap gap-x-10 gap-y-4 max-lg:w-full max-lg:border-t max-lg:border-white/10 max-lg:pt-5 lg:pb-2">
                {figures.map((figure) => (
                  <div key={figure.label} className="flex flex-col gap-1 lg:items-end">
                    <dt className="text-xs text-white/55">{figure.label}</dt>
                    <dd className="text-lg font-bold tabular-nums sm:text-xl">
                      {loading ? <Skeleton className="h-6 w-24 bg-white/10" /> : figure.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}

        {tabs}
      </div>
    </section>
  );
}

/** The cover's primary action: a mint pill on the dark band, the same weight everywhere. */
export const coverActionClass = "h-12 bg-mint px-7 text-base text-brand-900 hover:bg-white max-sm:w-full";

/** The cover's secondary action, outlined on the dark band (a white pill in the phone's sticky bar). */
export const coverSecondaryClass =
  "h-12 border-white/25 bg-transparent px-7 text-base text-white hover:bg-white/10 hover:text-white max-sm:w-full max-sm:border-foreground/15 max-sm:bg-card max-sm:text-ink";

/** A quiet tab bar with a clear active underline; scrolls sideways on phones. */
export function CoverTabs({ items }: { items: { value: string; label: string; count?: number }[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:thin] sm:mx-0 sm:px-0">
      <TabsList variant="line" className="h-auto w-max justify-start gap-1 rounded-none border-b border-white/15 bg-transparent p-0 group-data-horizontal/tabs:h-auto">
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="h-11 flex-none gap-2 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 text-sm font-medium text-white/65 shadow-none transition-colors duration-150 after:hidden hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-mint data-[state=active]:border-mint data-[state=active]:bg-transparent data-[state=active]:text-mint data-[state=active]:shadow-none"
          >
            {item.label}
            {item.count !== undefined && <span className="min-w-5 text-center text-xs font-medium tabular-nums">{item.count}</span>}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
