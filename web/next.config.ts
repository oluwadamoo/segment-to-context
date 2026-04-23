import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    API_BASE_URL: process.env.API_BASE_URL ?? "http://localhost:5300",
  },
};

export default nextConfig;
