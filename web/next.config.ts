import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows next/image to serve local images from /public
  // and any external domains you explicitly allow
  images: {
    remotePatterns: [],
  },

  // Required for Vercel — ensures trailing slashes are consistent
  trailingSlash: false,

  // Compress output for faster Vercel edge delivery
  compress: true,
};

export default nextConfig;
