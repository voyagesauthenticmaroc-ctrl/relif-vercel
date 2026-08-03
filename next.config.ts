import type { NextConfig } from "next";
import { createSecurityHeaders } from "./lib/security-headers";

const isDevelopment = process.env.NODE_ENV !== "production";
/*
 * The framework cannot know the request protocol while loading this file.
 * Transport-only directives are therefore added by the Worker per request.
 */
const securityHeaders = createSecurityHeaders({
  isDevelopment,
  isHttps: false,
});

const nextConfig: NextConfig = {
  images: {
    // Sites serves these small, local brand assets directly. Disabling the
    // optimizer also keeps the logo available when no ASSETS binding exists.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
