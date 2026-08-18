import type { NextConfig } from "next";
import { klinikosSecurityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Source maps make original implementation details materially easier to recover
  // from browser-delivered assets. Keep them off publicly; use a private observability
  // upload path if production debugging later requires symbolication.
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: klinikosSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
