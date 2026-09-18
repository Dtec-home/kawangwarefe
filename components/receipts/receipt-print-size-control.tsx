/**
 * "Print size" control for the receipt print view (RC-8).
 *
 * RC-8 wants the printable receipt to suit both an 80 mm thermal roll and A6
 * paper, so the user picks. The choice is remembered per device in
 * localStorage, which can throw in private browsing.
 */

"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_RECEIPT_PRINT_SIZE,
  RECEIPT_PRINT_SIZES,
  readStoredReceiptPrintSize,
  storeReceiptPrintSize,
  type ReceiptPrintSize,
} from "@/lib/receipts/print-size";

export function useReceiptPrintSize() {
  // Read once at mount, like `auth-context` does: this page never renders
  // server-side with content, so there is nothing to hydrate against.
  const [size, setSize] = useState<ReceiptPrintSize>(
    () => readStoredReceiptPrintSize() ?? DEFAULT_RECEIPT_PRINT_SIZE
  );

  const choose = useCallback((next: ReceiptPrintSize) => {
    setSize(next);
    storeReceiptPrintSize(next);
  }, []);

  return { size, setSize: choose };
}

interface ReceiptPrintSizeControlProps {
  value: ReceiptPrintSize;
  onChange: (size: ReceiptPrintSize) => void;
}

export function ReceiptPrintSizeControl({ value, onChange }: ReceiptPrintSizeControlProps) {
  return (
    <div
      role="group"
      aria-label="Print size"
      className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5"
    >
      {RECEIPT_PRINT_SIZES.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="xs"
          variant={option.value === value ? "secondary" : "ghost"}
          aria-pressed={option.value === value}
          title={option.hint}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
