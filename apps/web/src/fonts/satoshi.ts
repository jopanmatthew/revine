import localFont from "next/font/local";

// Satoshi from Fontshare (free; license in Satoshi-LICENSE.txt), self-hosted so nothing depends on
// an outside font server. Use 400 for body text, 500 for labels and buttons, 700 for headings and amounts.
export const satoshi = localFont({
  src: [
    { path: "./Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "./Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});
