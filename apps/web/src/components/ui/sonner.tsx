"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useIsDesktop } from "@/components/action-sheet"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  // Phones: top, below the role switcher (their primary action is a sticky bottom bar).
  // Desktop: bottom-right, clear of the header and each page's primary action.
  const desktop = useIsDesktop()

  return (
    <Sonner
      theme="light"
      position={desktop ? "bottom-right" : "top-center"}
      offset={{ bottom: 24, right: 24 }}
      mobileOffset={{ top: 152, left: 16, right: 16 }}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          // Sonner's injected styles win the cascade, so brand overrides need !important.
          toast: "cn-toast !rounded-xl !border-foreground/10 !shadow-[0_18px_40px_-20px_rgb(11_31_26/0.45)] !font-sans",
          title: "!text-[0.9375rem] !font-bold !text-ink",
          description: "!text-ink-muted",
          success: "[&_[data-icon]]:!text-brand-700",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
