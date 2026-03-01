import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from any hostname for avatars/assets
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
