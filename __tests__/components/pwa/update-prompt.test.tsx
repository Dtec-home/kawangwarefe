/**
 * UpdatePrompt — Unit Tests
 *
 * Verifies every detection path and the update handler.
 *
 * Strategy:
 *  - Mock navigator.serviceWorker entirely (jsdom has no SW support).
 *  - Mock fetch for the /api/version polling path.
 *  - Use vi.useFakeTimers to fast-forward the 5-minute interval without
 *    actually waiting in tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { UpdatePrompt } from "@/components/pwa/update-prompt";

// ─────────────────────────── helpers ────────────────────────────────────────

/** Create a fake ServiceWorker stub. */
function makeWorker(state: ServiceWorker["state"] = "activated"): Partial<ServiceWorker> {
  return {
    state,
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
  };
}

/** Create a minimal fake ServiceWorkerRegistration. */
function makeRegistration(overrides: Partial<ServiceWorkerRegistration> = {}): Partial<ServiceWorkerRegistration> {
  return {
    waiting: null,
    installing: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/** Shorthand to create a fake ServiceWorkerContainer. */
function makeSwContainer(
  registration: Partial<ServiceWorkerRegistration>,
  controller: Partial<ServiceWorker> | null = makeWorker(),
) {
  const listeners: Record<string, EventListener[]> = {};
  return {
    register: vi.fn().mockResolvedValue(registration),
    controller,
    addEventListener: vi.fn((type: string, fn: EventListener) => {
      listeners[type] = listeners[type] ?? [];
      listeners[type].push(fn);
    }),
    removeEventListener: vi.fn(),
    /** Dispatch a fake controllerchange event to all listeners */
    _dispatchControllerChange: () => {
      listeners["controllerchange"]?.forEach((fn) =>
        fn(new Event("controllerchange"))
      );
    },
  };
}

// ─────────────── setup / teardown ───────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  // Default: no SW support — individual tests override as needed.
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: undefined,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  // Reset reload spy
  vi.unstubAllGlobals();
});

// ─────────────────────────── tests ──────────────────────────────────────────

describe("UpdatePrompt", () => {
  it("renders nothing when there is no pending update", async () => {
    const reg = makeRegistration();
    const container = makeSwContainer(reg);
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: container });

    render(<UpdatePrompt />);
    // Let all useEffect microtasks settle
    await act(async () => { await Promise.resolve(); });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  // ── SW path ───────────────────────────────────────────────────────────────

  it("shows the overlay when reg.waiting is set on mount", async () => {
    const waiting = makeWorker("installed");
    const reg = makeRegistration({ waiting: waiting as ServiceWorker });
    const container = makeSwContainer(reg);
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: container });

    render(<UpdatePrompt />);
    await act(async () => { await Promise.resolve(); });

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("New Version Available")).toBeDefined();
  });

  it("shows the overlay after updatefound → statechange → installed", async () => {
    // Set up a registration whose updatefound fires during the test
    let updateFoundListener: (() => void) | null = null;
    let stateChangeListener: (() => void) | null = null;

    const installing: Partial<ServiceWorker> = {
      state: "installing" as const,
      addEventListener: vi.fn((type: string, fn: () => void) => {
        if (type === "statechange") stateChangeListener = fn;
      }),
    };

    const reg: Partial<ServiceWorkerRegistration> = {
      waiting: null,
      installing: null,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn((type: string, fn: () => void) => {
        if (type === "updatefound") updateFoundListener = fn;
      }),
      removeEventListener: vi.fn(),
    };

    const container = makeSwContainer(reg);
    // Simulate a real controller being active so the condition is satisfied
    container.controller = makeWorker("activated") as ServiceWorker;
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: container });

    render(<UpdatePrompt />);
    await act(async () => { await Promise.resolve(); });

    // Fire updatefound — simulates a new SW beginning to install
    expect(updateFoundListener).not.toBeNull();
    act(() => {
      // The component reads registration.installing at the time of updatefound
      (reg as { installing: Partial<ServiceWorker> }).installing = installing;
      updateFoundListener?.();
    });

    // Simulate the installing SW transitioning to "installed" state
    act(() => {
      (installing as { state: string }).state = "installed";
      stateChangeListener?.();
    });

    expect(screen.getByRole("dialog")).toBeDefined();
  });

  // ── Version-poll path ─────────────────────────────────────────────────────

  it("shows the overlay when the version poll detects a new version", async () => {
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: undefined });

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      const version = callCount === 1 ? "v1" : "v2";
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ version }),
      } as Response);
    });

    render(<UpdatePrompt />);
    // First fetch — captures initial version
    await act(async () => { await Promise.resolve(); });

    // Fast-forward past POLL_INTERVAL_MS (5 min) to trigger the second fetch
    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000 + 100);
      await Promise.resolve();
    });

    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("does NOT show overlay when version poll returns the same version twice", async () => {
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: undefined });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: "v1" }),
    } as Response);

    render(<UpdatePrompt />);
    await act(async () => { await Promise.resolve(); });
    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000 + 100);
      await Promise.resolve();
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  // ── Update handler ────────────────────────────────────────────────────────

  it("sends SKIP_WAITING and shows spinner when Update Now is clicked (SW path)", async () => {
    const waiting = makeWorker("installed");
    const reg = makeRegistration({ waiting: waiting as ServiceWorker });
    const container = makeSwContainer(reg);
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: container });

    render(<UpdatePrompt />);
    await act(async () => { await Promise.resolve(); });

    const btn = screen.getByRole("button", { name: /update now/i });
    fireEvent.click(btn);

    expect(waiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    // Button becomes disabled while updating
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("calls window.location.reload() after controllerchange when using SW path", async () => {
    const reloadMock = vi.fn();
    vi.stubGlobal("location", { ...globalThis.location, reload: reloadMock });

    const waiting = makeWorker("installed");
    const reg = makeRegistration({ waiting: waiting as ServiceWorker });
    const container = makeSwContainer(reg);
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: container });

    render(<UpdatePrompt />);
    await act(async () => { await Promise.resolve(); });

    const btn = screen.getByRole("button", { name: /update now/i });
    fireEvent.click(btn);

    // Simulate the service worker controller changing
    act(() => { container._dispatchControllerChange(); });

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("calls window.location.reload() directly when triggered via version-poll path", async () => {
    const reloadMock = vi.fn();
    vi.stubGlobal("location", { ...globalThis.location, reload: reloadMock });

    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: undefined });

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ version: callCount === 1 ? "v1" : "v2" }),
      } as Response);
    });

    render(<UpdatePrompt />);
    await act(async () => { await Promise.resolve(); });
    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000 + 100);
      await Promise.resolve();
    });

    // At this point overlay is shown with no swRegistration (no SW available)
    const btn = screen.getByRole("button", { name: /update now/i });
    fireEvent.click(btn);

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
