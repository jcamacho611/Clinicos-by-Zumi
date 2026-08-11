import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        // `/capabilities` was a feature encyclopedia: an inventory of everything
        // Klinikos might one day do, on a light theme that predated design law, using
        // copy the public rules now forbid. It helped nobody decide anything.
        // Permanent redirect so any existing link lands on the page that answers the
        // question the visitor actually had.
        source: "/capabilities",
        destination: "/how-it-works",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
