import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Path to the SW entry file we authored (inside /app so it can use TS imports)
  swSrc: "app/sw.ts",
  // Output path in /public (browser fetches /sw.js)
  swDest: "public/sw.js",
  // Scope: entire origin
  scope: "/",
  // Cache service-worker.js with no-store so browsers always re-check it
  // (serwist sets this automatically, but we're explicit)
  cacheOnNavigation: true,
  // Disable in dev to avoid stale content during local development
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {},
  env: {
    // Expose the build ID at runtime so /api/version can return it
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA
      ?? process.env.GIT_COMMIT
      ?? String(Date.now()),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      // The version endpoint must never be cached by any proxy or CDN
      {
        source: "/api/version",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
      // The SW itself must never be cached (browser checks it on every load)
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
