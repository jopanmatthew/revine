import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // No Next.js badge over the UI in dev: the demo runs side by side in three windows.
  devIndicators: false,
  partialPrefetching: true,
  experimental: {
    // Use the compiler API to retain build checks when child CLI stdout is unavailable.
    useTypeScriptCli: false,
    turbopackPluginRuntimeStrategy: "workerThreads",
  },
};

export default nextConfig;
