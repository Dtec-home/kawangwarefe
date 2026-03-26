/**
 * PWA Update Prompt — Mandatory Overlay
 *
 * Shows a full-screen blocking overlay whenever a new app version is detected.
 * The user CANNOT dismiss it — they must click "Update now" to reload.
 *
 * Detection uses two complementary signals (whichever fires first):
 *  1. Service Worker `updatefound` / `waiting` events (instant — fires as soon
 *     as the browser finishes downloading the new SW during a page visit).
 *  2. Polling `/api/version` every 5 minutes (catches deployments that happen
 *     while the tab stays open without a page reload).
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function UpdatePrompt() {
  const [updateReady, setUpdateReady] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Track the SW registration so we can signal SKIP_WAITING on demand.
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Captured once when the component first mounts (i.e. when the page loads).
  // Using useRef so it resets cleanly on unmount and doesn't leak across
  // HMR cycles in development the way a module-level variable would.
  const initialVersionRef = useRef<string | null>(null);

  // ── Service Worker update detection ───────────────────────────────────────

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const swContainer = globalThis.navigator.serviceWorker;
    if (!swContainer) return;

    let registration: ServiceWorkerRegistration | null = null;
    let swPoller: ReturnType<typeof setInterval> | null = null;

    const handleUpdateFound = () => {
      const installing = registration?.installing;
      if (!installing) return;

      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          // A new SW has installed and there is already an active one controlling the page.
          // This is exactly the "update waiting" state.
          setSwRegistration(registration);
          setUpdateReady(true);
        }
      });
    };

    swContainer
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        registration = reg;

        // Already waiting (user navigated away and back while an update was pending)
        if (reg.waiting && navigator.serviceWorker.controller) {
          setSwRegistration(reg);
          setUpdateReady(true);
          return;
        }

        reg.addEventListener("updatefound", handleUpdateFound);

        // Poll for updates every 60 s on top of the browser's own check.
        swPoller = setInterval(() => reg.update(), 60_000);
      })
      .catch(console.error);

    return () => {
      registration?.removeEventListener("updatefound", handleUpdateFound);
      if (swPoller) clearInterval(swPoller);
    };
  }, []);

  // ── Version-file polling (backup for long-lived tabs) ─────────────────────

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data: { version: string } = await res.json();

        if (initialVersionRef.current === null) {
          // First call — record the build this tab loaded with.
          initialVersionRef.current = data.version;
          return;
        }

        if (data.version !== initialVersionRef.current) {
          setUpdateReady(true);
        }
      } catch {
        // Network error — silently ignore, will retry next interval.
      }
    };

    fetchVersion(); // Run immediately on mount to capture initial version.
    const timer = setInterval(fetchVersion, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // ── Handle "Update now" click ─────────────────────────────────────────────

  const handleUpdate = () => {
    setIsUpdating(true);

    if (swRegistration?.waiting) {
      // Register listener FIRST to avoid race condition where SW activates
      // before we attach the handler.
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        globalThis.location.reload();
      });

      // Now tell the waiting SW to skip its waiting phase and activate.
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    } else {
      // No waiting SW (version-poll triggered). A hard reload will fetch the
      // latest HTML and the new SW will install on the next visit.
      globalThis.location.reload();
    }
  };

  if (!updateReady) return null;

  return (
    /* Full-screen backdrop — pointer-events: all so nothing below is clickable */
    <dialog
      open
      aria-label="App update required"
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative mx-4 max-w-sm w-full rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.12)" }}
      >
        {/* Accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

        <div className="p-8 text-center space-y-5">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30">
            <RefreshCw
              className={`h-8 w-8 text-indigo-600 dark:text-indigo-400 ${isUpdating ? "animate-spin" : ""}`}
            />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              New Version Available
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              A new version of the app has been deployed. Please update now to
              continue — this ensures you always have the latest features and
              security fixes.
            </p>
          </div>

          {/* Update button */}
          <button
            id="pwa-update-now-btn"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="w-full rounded-xl py-3 px-6 font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: isUpdating
                ? "#6366f1"
                : "linear-gradient(135deg, #4f46e5, #7c3aed)",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
            }}
          >
            {isUpdating ? "Updating…" : "Update Now"}
          </button>

          <p className="text-xs text-slate-400 dark:text-slate-600">
            The page will reload automatically after the update.
          </p>
        </div>
      </div>
    </dialog>
  );
}
