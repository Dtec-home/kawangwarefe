import type { Metadata } from "next";
import { WifiOff, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "You're Offline | SDA Church Kawangware",
  description: "You appear to be offline. Please check your connection and try again.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
      }}
    >
      {/* Glass card */}
      <div
        className="w-full max-w-md rounded-3xl p-10 space-y-6"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Icon */}
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <WifiOff className="h-10 w-10 text-indigo-400" aria-hidden="true" />
        </div>

        {/* Copy */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            You&apos;re Offline
          </h1>
          <p className="text-slate-300 leading-relaxed">
            It looks like you&apos;ve lost your internet connection. Some pages
            are available offline — try navigating back or reconnect and refresh.
          </p>
        </div>

        {/* Church branding */}
        <p className="text-sm font-semibold text-indigo-300 tracking-wide uppercase">
          SDA Church Kawangware
        </p>

        {/* Reload button — client-side refresh */}
        <button
          id="offline-reload-btn"
          type="button"
          onClick={() => globalThis.location.reload()}
          className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-transparent"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
          }}
        >
          <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" aria-hidden="true" />
          Try Again
        </button>

        <p className="text-xs text-slate-500">
          Pages you&apos;ve visited recently may still be available.
        </p>
      </div>
    </main>
  );
}
