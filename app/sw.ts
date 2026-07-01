/// <reference lib="webworker" />
/// <reference lib="webworker.iterable" />
// ^ These two triple-slash directives override the tsconfig "dom" lib for this file,
//   making "self" resolve as ServiceWorkerGlobalScope so that skipWaiting(),
//   addEventListener("message", …), and ExtendableMessageEvent all typecheck.

/**
 * Service Worker Entry Point (serwist)
 *
 * This is compiled by @serwist/next at build time.
 * It is NOT a regular module — it runs inside the SW scope.
 *
 * Strategy:
 *  - Static assets (/_next/static/**): CacheFirst — content-hashed filenames
 *    make stale entries unreachable after a new deploy anyway.
 *  - Everything else (HTML, API, GraphQL): NetworkFirst — always try the
 *    network so users see the latest content. Falls back to cache only when
 *    offline.
 *
 * Activation flow:
 *  - skipWaiting is NOT set globally. A newly installed SW waits in the
 *    "installed/waiting" state until the update-prompt UI sends a
 *    SKIP_WAITING message. This makes the "Update Now" button the sole
 *    activation trigger.
 *  - clientsClaim: true — after activation, the new SW immediately takes
 *    control of every open tab so the reload picks up the latest assets.
 */

import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope;

declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST: Array<string | { url: string; revision: string | null }>;
  }
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,  // injected by @serwist/next at build time
  precacheOptions: {
    navigateFallback: "/offline",       // serve branded offline page when offline
  },
  skipWaiting: false,                   // wait until the user clicks "Update now"
  clientsClaim: true,                   // take control of all tabs after activation
  navigationPreload: true,              // speed up navigation responses
  runtimeCaching: defaultCache,         // sensible defaults (NetworkFirst for nav etc.)
});

serwist.addEventListeners();

// ── Explicit SKIP_WAITING handler ─────────────────────────────────────────────
// update-prompt.tsx calls swRegistration.waiting.postMessage({ type: "SKIP_WAITING" }).
// Attach this handler to Serwist's internal message handling to avoid conflicts.
// serwist.addEventListeners() already sets up message handling, so we wrap
// this handler to integrate with it properly.
const originalMessageHandler = self.onmessage;
self.onmessage = (event: ExtendableMessageEvent) => {
  // Handle SKIP_WAITING first
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  // Then pass to original handler if it exists
  if (originalMessageHandler) {
    originalMessageHandler.call(self, event);
  }
};
