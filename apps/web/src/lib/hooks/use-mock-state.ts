"use client";

import { useSyncExternalStore } from "react";

import { mockStore, type MockState } from "@/lib/mock";

/** Live mock store (mock mode only). Server render and hydration see the "not loaded" state. */
export function useMockState(): MockState {
  return useSyncExternalStore(mockStore.subscribe, mockStore.getState, mockStore.getServerState);
}

const noopSubscribe = () => () => {};

/** False during the server render and hydration, true afterwards. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
