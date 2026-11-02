/**
 * @file next.config.ts
 * @description Disables the floating Next.js 'N' development indicator badge
 * so the UI looks 100% clean for client demos and marketing presentations.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default nextConfig;