import type { Metadata } from "next";
import { WifiOff, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "You're Offline | SDA Church Kawangware",
  description: "You appear to be offline. Please check your connection and try again.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gradient-to-br from-primary via-primary/80 to-primary">
      {/* Glass card */}
      <div className="w-full max-w-md rounded-3xl p-10 space-y-6 bg-card/10 border border-card/20 backdrop-blur-xl shadow-2xl">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-card/10 border border-card/20">
          <WifiOff className="h-10 w-10 text-primary-foreground" aria-hidden="true" />
        </div>

        {/* Copy */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-primary-foreground tracking-tight">
            You&apos;re Offline
          </h1>
          <p className="text-primary-foreground/90 leading-relaxed">
            It looks like you&apos;ve lost your internet connection. Some pages
            are available offline — try navigating back or reconnect and refresh.
          </p>
        </div>

        {/* Church branding */}
        <p className="text-sm font-semibold text-primary-foreground/80 tracking-wide uppercase">
          SDA Church Kawangware
        </p>

        {/* Reload button — client-side refresh */}
        <a
          id="offline-reload-btn"
          href="/"
          className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold bg-card text-foreground shadow-lg transition-all duration-200 hover:bg-card/90 focus:outline-none focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2 focus:ring-offset-transparent"
        >
          <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" aria-hidden="true" />
          Try Again
        </a>

        <p className="text-xs text-primary-foreground/70">
          Pages you&apos;ve visited recently may still be available.
        </p>
      </div>
    </main>
  );
}
