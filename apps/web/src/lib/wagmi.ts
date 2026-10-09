import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

export const wagmiConfig = getDefaultConfig({
  appName: "revine.",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "revine-sepolia-demo-not-configured",
  chains: [sepolia],
  transports: { [sepolia.id]: http(rpcUrl || undefined) },
  ssr: true,
});
