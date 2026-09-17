/**
 * Print CSS for a single receipt (RC-8): thermal 80 mm rolls or A6 paper.
 *
 * Everything outside `.receipt-print-area` (sidebar, header, bottom nav,
 * buttons) is hidden; the receipt is pinned to the top-left of the page in
 * a compact, black-on-white layout.
 */

const PRINT_CSS = `
@media print {
  @page { size: auto; margin: 4mm; }
  html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
  body * { visibility: hidden !important; }
  .receipt-print-area, .receipt-print-area * { visibility: visible !important; }
  .receipt-print-area {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 72mm !important;
    max-width: 72mm !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    color: #000 !important;
    font-size: 9pt !important;
    line-height: 1.3 !important;
  }
  .receipt-print-area * { color: #000 !important; background: transparent !important; box-shadow: none !important; }
  .receipt-print-area .receipt-number { font-size: 14pt !important; }
  .receipt-print-area .receipt-void-mark span { color: rgba(0, 0, 0, 0.18) !important; }
  .receipt-no-print { display: none !important; }
}
`;

export function ReceiptPrintStyles() {
  return <style data-testid="receipt-print-styles">{PRINT_CSS}</style>;
}
