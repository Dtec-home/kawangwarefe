/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
/// <reference lib="webworker"/>
/// <reference lib="webworker.iterable"/>

// Re-declare the global scope so TypeScript resolves the SW-specific
// globals (skipWaiting, addEventListener("message"), etc.) correctly.
declare let self: ServiceWorkerGlobalScope;

// Serwist injects this precache manifest variable at build time.
declare const __SW_MANIFEST: (string | { url: string; revision: string | null })[];

