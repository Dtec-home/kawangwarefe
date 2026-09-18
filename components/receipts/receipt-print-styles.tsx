/**
 * Print CSS for a single receipt (RC-8): an 80 mm thermal roll or A6 paper.
 *
 * Everything outside `.receipt-print-area` (sidebar, header, bottom nav,
 * buttons) is hidden at both sizes; the receipt is pinned to the top-left of
 * the page in a compact, black-on-white layout. A void receipt prints a dark
 * VOID watermark and a boxed VOID note so it is unmistakable on paper, not
 * only on screen.
 */

import { DEFAULT_RECEIPT_PRINT_SIZE, type ReceiptPrintSize } from "@/lib/receipts/print-size";

/** Shared by both sizes: hide the app, flatten colours, keep VOID legible. */
const COMMON_PRINT_CSS = `
  html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
  body * { visibility: hidden !important; }
  .receipt-print-area, .receipt-print-area * { visibility: visible !important; }
  .receipt-print-area {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    color: #000 !important;
    overflow: visible !important;
    overflow-wrap: break-word !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .receipt-print-area * {
    color: #000 !important;
    background: transparent !important;
    box-shadow: none !important;
    overflow-wrap: break-word !important;
  }
  .receipt-print-area .receipt-number { overflow-wrap: normal !important; white-space: nowrap !important; }
  /* VOID must read on a thermal roll too, where a faint grey prints as nothing. */
  .receipt-print-area .receipt-void-mark { display: flex !important; }
  .receipt-print-area .receipt-void-mark span {
    color: rgba(0, 0, 0, 0.32) !important;
    -webkit-text-stroke: 0.6px rgba(0, 0, 0, 0.6) !important;
  }
  .receipt-print-area .receipt-void-note { border: 2pt solid #000 !important; padding: 2mm !important; }
  .receipt-print-area .receipt-void-note-title { font-weight: 800 !important; letter-spacing: 0.06em !important; }
  .receipt-no-print, .receipt-no-print * { display: none !important; visibility: hidden !important; }
`;

/** Page box, content width and type scale per size. */
const SIZE_PRINT_CSS: Record<ReceiptPrintSize, string> = {
  thermal: `
  @page { size: 80mm auto; margin: 4mm; }
  .receipt-print-area {
    width: 72mm !important;
    max-width: 72mm !important;
    font-size: 9pt !important;
    line-height: 1.3 !important;
  }
  .receipt-print-area .receipt-number { font-size: 14pt !important; }
  .receipt-print-area .receipt-void-mark span { font-size: 30pt !important; }
`,
  a6: `
  @page { size: 105mm 148mm; margin: 8mm 7mm; }
  .receipt-print-area {
    width: 91mm !important;
    max-width: 91mm !important;
    font-size: 10pt !important;
    line-height: 1.4 !important;
  }
  .receipt-print-area .receipt-number { font-size: 18pt !important; }
  .receipt-print-area .receipt-void-mark span { font-size: 40pt !important; }
`,
};

/** The `@media print` block for one paper size. */
export function receiptPrintCss(size: ReceiptPrintSize): string {
  return `@media print {${SIZE_PRINT_CSS[size]}${COMMON_PRINT_CSS}}`;
}

interface ReceiptPrintStylesProps {
  /** Defaults to the 80 mm thermal roll used day to day. */
  size?: ReceiptPrintSize;
}

export function ReceiptPrintStyles({ size = DEFAULT_RECEIPT_PRINT_SIZE }: ReceiptPrintStylesProps = {}) {
  return (
    <style data-testid="receipt-print-styles" data-print-size={size}>
      {receiptPrintCss(size)}
    </style>
  );
}
