/** Always visible at the very top (PRD §9.1). */
export function TestnetStrip() {
  return (
    <div className="border-b border-white/[0.07] bg-brand-900 px-4 pt-[calc(0.375rem+env(safe-area-inset-top,0px))] pb-1.5 text-center text-xs font-medium text-white/70">
      Testnet demo on Sepolia · No real money
    </div>
  );
}
