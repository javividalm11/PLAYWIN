import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Escudos y logos de ligas servidos por ESPN
      { protocol: "https", hostname: "a.espncdn.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
