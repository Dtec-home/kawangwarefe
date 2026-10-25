/**
 * Idempotent manual entry submissions (T5.3, D14).
 *
 * Each confirmed submission carries a client-generated `idempotencyKey`. The
 * key is kept while the outcome is unknown (network error → retry), so a
 * retry that reaches the server twice still records one gift: the backend
 * answers the repeat with the first receipt and `idempotentReplay: true`.
 * The key is dropped once the server gave a definitive answer (receipt issued
 * or entry refused), or when the submitted details change — that is a new
 * submission, e.g. the next giver.
 */

"use client";

import { useCallback, useRef } from "react";

/** RFC 4122 v4 UUID; falls back when `crypto.randomUUID` is unavailable (plain http). */
export function generateIdempotencyKey(): string {
  const cryptoApi: Crypto | undefined = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();
  const bytes = new Uint8Array(16);
  if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Stable fingerprint of a submission's variables (key order independent). */
export function submissionFingerprint(variables: unknown): string {
  const normalise = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalise);
    if (value && typeof value === "object") {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          const v = (value as Record<string, unknown>)[key];
          if (v !== undefined) acc[key] = normalise(v);
          return acc;
        }, {});
    }
    return value;
  };
  return JSON.stringify(normalise(variables));
}

export interface IdempotencyKeys {
  /** The key for these submission variables: reused while they are unchanged and unresolved. */
  keyFor: (variables: unknown) => string;
  /** Forget the key after a definitive outcome (issued or refused). */
  settle: () => void;
}

export function useIdempotencyKey(): IdempotencyKeys {
  const current = useRef<{ key: string; fingerprint: string } | null>(null);

  const keyFor = useCallback((variables: unknown) => {
    const fingerprint = submissionFingerprint(variables);
    if (!current.current || current.current.fingerprint !== fingerprint) {
      current.current = { key: generateIdempotencyKey(), fingerprint };
    }
    return current.current.key;
  }, []);

  const settle = useCallback(() => {
    current.current = null;
  }, []);

  return { keyFor, settle };
}
