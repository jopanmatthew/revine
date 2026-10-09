"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { displayName } from "@/lib/demo-names";

const STORAGE_KEY = "revine.profile-names.v1";
const CHANGE_EVENT = "revine:profile-names-changed";
const EMPTY_SNAPSHOT = "{}";
const MAX_NAME_LENGTH = 32;

type NamesByAddress = Record<string, string>;

function snapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function parseSnapshot(value: string): NamesByAddress {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([address, name]) => {
        if (!/^0x[0-9a-f]{40}$/i.test(address) || typeof name !== "string") return [];
        const clean = name.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
        return clean ? [[address.toLowerCase(), clean]] : [];
      }),
    );
  } catch {
    return {};
  }
}

/** Names stay on this device and are keyed by wallet address. */
export function saveProfileName(address: string, input: string) {
  if (!/^0x[0-9a-f]{40}$/i.test(address)) throw new Error("Connect a valid wallet before saving a name.");

  const name = input.trim().replace(/\s+/g, " ");
  if (name.length > MAX_NAME_LENGTH) throw new Error(`Use ${MAX_NAME_LENGTH} characters or fewer.`);

  try {
    const names = parseSnapshot(snapshot());
    if (name) names[address.toLowerCase()] = name;
    else delete names[address.toLowerCase()];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    throw new Error("Could not save the name in this browser. Check your browser storage settings.");
  }
}

export function useProfileName(address?: string | null): string | undefined {
  const saved = useSyncExternalStore(subscribe, snapshot, () => EMPTY_SNAPSHOT);
  return useMemo(() => {
    if (!address) return undefined;
    return parseSnapshot(saved)[address.toLowerCase()];
  }, [address, saved]);
}

/** Resolve saved local names first, then the appropriate demo or abbreviated-address fallback. */
export function useDisplayNameLookup(): (address?: string | null) => string {
  const saved = useSyncExternalStore(subscribe, snapshot, () => EMPTY_SNAPSHOT);
  const names = useMemo(() => parseSnapshot(saved), [saved]);
  return useCallback(
    (address?: string | null) => {
      if (!address) return "Unknown wallet";
      return names[address.toLowerCase()] ?? displayName(address);
    },
    [names],
  );
}
