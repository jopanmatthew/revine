"use client";

import { useEffect, useSyncExternalStore } from "react";

import type { Role } from "@/lib/invoice";

// The last role used, so /app can go straight back to it (PRD §9.3). Browser storage only, wrapped in
// try/catch because it can be blocked; without it the role picker simply shows every time.
const ROLE_KEY = "revine.lastRole";
const ROLES: Role[] = ["seller", "buyer", "financier"];

function readRole(): Role | null {
  try {
    const stored = window.localStorage.getItem(ROLE_KEY);
    return ROLES.find((role) => role === stored) ?? null;
  } catch {
    return null;
  }
}

export function rememberRole(role: Role) {
  try {
    window.localStorage.setItem(ROLE_KEY, role);
  } catch {
    // Storage blocked: nothing to remember, nothing breaks.
  }
}

const noopSubscribe = () => () => {};

/** The remembered role; undefined while rendering on the server or hydrating. */
export function useLastRole(): Role | null | undefined {
  return useSyncExternalStore(noopSubscribe, readRole, () => undefined);
}

/** Dashboards call this so the role picker remembers where you were. */
export function useRememberRole(role: Role) {
  useEffect(() => rememberRole(role), [role]);
}
