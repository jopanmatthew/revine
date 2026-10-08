// Returned by the real-mode stubs until the wagmi hooks are wired (PRD §16.2).
export const NOT_WIRED = new Error("The real hooks aren't wired yet. Set NEXT_PUBLIC_USE_MOCKS=true.");
