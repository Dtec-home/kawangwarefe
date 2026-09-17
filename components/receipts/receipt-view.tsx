/**
 * Printable receipt (T1.8, RC-5, RC-8).
 *
 * The M-Pesa code is shown here (RC-5); it is only kept out of the Cash
 * Statement export (D7). A void receipt keeps its number and shows a VOID
 * watermark with the reason (RC-6).
 */

import { ReceiptStatusBadge } from "@/components/receipts/receipt-badges";
import type { Receipt } from "@/lib/graphql/receipt-queries";
import {
  formatKes,
  formatNairobiDateTime,
  formatReceiptDate,
  receiptChannelLabel,
  receiptGiver,
} from "@/lib/receipts/format";

interface ReceiptViewProps {
  receipt: Receipt;
  churchName: string;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export function ReceiptView({ receipt, churchName }: ReceiptViewProps) {
  const isVoid = receipt.status === "void";

  return (
    <article
      aria-label={`Receipt ${receipt.number}`}
      className="receipt-print-area relative mx-auto w-full max-w-sm overflow-hidden rounded-xl border bg-card p-5 shadow-sm"
    >
      {isVoid && (
        <div
          aria-hidden
          className="receipt-void-mark pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        >
          <span className="-rotate-30 text-7xl font-black tracking-widest text-destructive/20">VOID</span>
        </div>
      )}

      <header className="space-y-1 border-b border-dashed pb-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide">{churchName}</p>
        <p className="text-xs text-muted-foreground">Official receipt</p>
        <p className="receipt-number font-mono text-2xl font-bold tracking-tight">{receipt.number}</p>
        <div className="flex justify-center">
          <ReceiptStatusBadge status={receipt.status} />
        </div>
      </header>

      <dl className="space-y-1.5 border-b border-dashed py-3 text-sm">
        <Row label="Date">{formatReceiptDate(receipt.receiptDate)}</Row>
        <Row label="Received from">{receiptGiver(receipt)}</Row>
        <Row label="Channel">{receiptChannelLabel(receipt.channel)}</Row>
        {receipt.mpesaCode && (
          <Row label="M-Pesa code">
            <span className="font-mono">{receipt.mpesaCode}</span>
          </Row>
        )}
        {receipt.legacyBookNumber && (
          <Row label="Old book no.">
            <span className="font-mono">{receipt.legacyBookNumber}</span>
          </Row>
        )}
      </dl>

      <table className="w-full border-b border-dashed text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="py-2 font-medium">Department</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {receipt.lines.map((line) => (
            <tr key={line.id} className="align-top">
              <td className="py-1 pr-2">
                <div>{line.categoryName}</div>
                {line.purposeName && <div className="text-xs text-muted-foreground">{line.purposeName}</div>}
              </td>
              <td className="py-1 text-right whitespace-nowrap">{formatKes(line.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t">
            <th scope="row" className="py-2 text-left">
              Total
            </th>
            <td className={`py-2 text-right text-base font-bold whitespace-nowrap ${isVoid ? "line-through" : ""}`}>
              {formatKes(receipt.totalAmount)}
            </td>
          </tr>
        </tfoot>
      </table>

      {isVoid && (
        <div className="mt-3 rounded-md border border-destructive/40 p-2 text-sm" role="note">
          <p className="font-semibold text-destructive">This receipt is VOID</p>
          {receipt.voidReason && <p className="mt-0.5">Reason: {receipt.voidReason}</p>}
          {receipt.voidedAt && (
            <p className="mt-0.5 text-xs text-muted-foreground">Voided {formatNairobiDateTime(receipt.voidedAt)}</p>
          )}
        </div>
      )}

      <footer className="pt-3 text-center text-xs text-muted-foreground">
        <p>Issued by {receipt.issuedByName || "System"}</p>
        <p>{formatNairobiDateTime(receipt.createdAt)}</p>
        <p className="mt-1">Thank you for your faithful giving.</p>
      </footer>
    </article>
  );
}
