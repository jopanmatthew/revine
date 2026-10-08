"use client";

import { useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

/** A radio group drawn as a segmented control (sort orders, tiers). Arrow keys move the choice. */
export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; disabled?: boolean }[];
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    for (let i = 1; i <= options.length; i++) {
      const next = (index + step * i + options.length) % options.length;
      if (!options[next].disabled) {
        onChange(options[next].value);
        refs.current[next]?.focus();
        return;
      }
    }
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-full bg-muted p-1", className)}>
      {options.map((option, i) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, i)}
            className={cn(
              "flex h-10 flex-1 items-center justify-center rounded-full px-2 text-[0.8125rem] font-medium whitespace-nowrap min-[400px]:px-3 min-[400px]:text-sm transition-[color,background-color,box-shadow] duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40 sm:h-8",
              checked ? "bg-card text-ink shadow-[0_1px_2px_rgb(11_31_26/0.08)]" : "text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
