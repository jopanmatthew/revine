export type RoleName = "Seller" | "Buyer" | "Financier";

// One colour per role across the landing: the chip, the tab dot and the "three views" columns.
export const ROLE_CHIP: Record<RoleName, string> = {
  Seller: "bg-brand-700 text-white",
  Buyer: "bg-ink text-white",
  Financier: "bg-mint text-brand-900",
};

export const ROLE_DOT: Record<RoleName, string> = {
  Seller: "bg-brand-700",
  Buyer: "bg-ink",
  Financier: "bg-mint",
};
