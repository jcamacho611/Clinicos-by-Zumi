import type { NextConfig } from "next";
import { klinikosSecurityHeaders, PRIVATE_NO_STORE_HEADERS } from "./src/lib/security/headers";

const privateNoStoreHeaders = Object.entries(PRIVATE_NO_STORE_HEADERS).map(([key, value]) => ({ key, value }));
const privateRobotsHeader = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" };

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: klinikosSecurityHeaders(),
      },
      {
        source: "/api/:path*",
        headers: [...privateNoStoreHeaders, privateRobotsHeader],
      },
      {
        source: "/access",
        headers: [...privateNoStoreHeaders, privateRobotsHeader],
      },
      {
        source: "/access/:path*",
        headers: [...privateNoStoreHeaders, privateRobotsHeader],
      },
      {
        source: "/login",
        headers: [...privateNoStoreHeaders, privateRobotsHeader],
      },
      {
        source: "/portal/:path*",
        headers: [...privateNoStoreHeaders, privateRobotsHeader],
      },
      {
        source: "/payments/:path*",
        headers: [...privateNoStoreHeaders, privateRobotsHeader],
      },
      {
        source: "/private-demo",
        headers: [privateRobotsHeader],
      },
    ];
  },
};

export default nextConfig;
