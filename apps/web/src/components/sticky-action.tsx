"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";

const ACTION_BAR_CLASS =
  "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-30 max-sm:flex max-sm:gap-2 max-sm:border-t max-sm:border-foreground/10 max-sm:bg-background/90 max-sm:px-4 max-sm:pt-3 max-sm:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] max-sm:backdrop-blur-md max-sm:[&>*]:flex-1";

/** The primary action stays inline on desktop and escapes animated stacking contexts on phones. */
export function StickyAction({ children, portal = false }: { children: ReactNode; portal?: boolean }) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (portal) setPortalRoot(document.body);
  }, [portal]);

  if (!portal) return <div className={ACTION_BAR_CLASS}>{children}</div>;

  return (
    <>
      <div className={portalRoot ? `${ACTION_BAR_CLASS} max-sm:hidden` : ACTION_BAR_CLASS}>{children}</div>
      {portalRoot &&
        createPortal(
          <div className={`${ACTION_BAR_CLASS} sm:hidden`}>{children}</div>,
          portalRoot,
        )}
    </>
  );
}
