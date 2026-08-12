import type { NextConfig } from "next";
import { klinikosSecurityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
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
