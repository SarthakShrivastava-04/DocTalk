import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
       protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/lrigu76hy/**', 
      },
    ],
  },
};

export default nextConfig;
