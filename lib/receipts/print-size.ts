/**
 * Printable receipt paper size (RC-8).
 *
 * RC-8 asks for an "A6/thermal-friendly" receipt, so the print view offers
 * both: an 80 mm thermal roll (the day-to-day choice at the church) and A6
 * paper (105 x 148 mm) for the office printer. The choice is remembered per
 * device in localStorage, which can throw in private browsing, so every
 * access is wrapped.
 */

export type ReceiptPrintSize = "thermal" | "a6";

/** The church prints on 80 mm thermal rolls day to day, so that stays the default. */
export const DEFAULT_RECEIPT_PRINT_SIZE: ReceiptPrintSize = "thermal";

export const RECEIPT_PRINT_SIZES: { value: ReceiptPrintSize; label: string; hint: string }[] = [
  { value: "thermal", label: "Thermal 80mm", hint: "80 mm receipt roll" },
  { value: "a6", label: "A6 paper", hint: "105 x 148 mm sheet" },
];

export const RECEIPT_PRINT_SIZE_STORAGE_KEY = "receipt-print-size";

function isPrintSize(value: unknown): value is ReceiptPrintSize {
  return value === "thermal" || value === "a6";
}

/** The size remembered on this device, or null when there is none (or storage is blocked). */
export function readStoredReceiptPrintSize(): ReceiptPrintSize | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(RECEIPT_PRINT_SIZE_STORAGE_KEY);
    return isPrintSize(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Remember the size on this device; silently a no-op when storage is blocked. */
export function storeReceiptPrintSize(size: ReceiptPrintSize): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECEIPT_PRINT_SIZE_STORAGE_KEY, size);
  } catch {
    /* private mode / blocked site data — the session default still applies */
  }
}
