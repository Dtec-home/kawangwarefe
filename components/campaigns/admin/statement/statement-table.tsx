/**
 * The campaign statement as a table: one line per gift, expense or payout,
 * oldest first, with the running balance and a totals row. On narrow screens
 * the channel moves under the description and the table scrolls sideways.
 */

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatKes } from "@/lib/receipts/format";
import { formatEntryDate } from "@/lib/treasury/entry-dates";
import type { CampaignStatement } from "@/lib/types/fundraising";
import { statementChannelLabel, toAmount } from "@/components/campaigns/admin/statement/statement-model";

const NUM = "text-right tabular-nums whitespace-nowrap";

function money(value: string): string {
  return toAmount(value) === 0 ? "—" : formatKes(value);
}

interface StatementTableProps {
  statement: CampaignStatement;
  periodLabel: string;
}

export function StatementTable({ statement, periodLabel }: StatementTableProps) {
  return (
    <Table data-testid="statement-table">
      <TableCaption className="sr-only">Campaign statement, {periodLabel}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="whitespace-nowrap">Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="hidden sm:table-cell">Channel</TableHead>
          <TableHead className="text-right">In</TableHead>
          <TableHead className="text-right">Out</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {statement.rows.map((row, index) => {
          const channel = statementChannelLabel(row.channel);
          return (
            // Lines have no id; the position in a statement is stable.
            <TableRow key={`${row.on}-${index}`}>
              <TableCell className="whitespace-nowrap text-muted-foreground">{formatEntryDate(row.on)}</TableCell>
              <TableCell className="min-w-40">
                <span className="block">{row.description}</span>
                <span className="block text-xs text-muted-foreground sm:hidden">{channel}</span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">{channel}</TableCell>
              <TableCell className={NUM}>{money(row.moneyIn)}</TableCell>
              <TableCell className={NUM}>{money(row.moneyOut)}</TableCell>
              <TableCell className={`${NUM} font-medium`}>{formatKes(row.balance)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow data-testid="statement-totals">
          <TableCell colSpan={2} className="font-semibold">
            Totals
          </TableCell>
          <TableCell className="hidden sm:table-cell" />
          <TableCell className={`${NUM} font-semibold`}>{formatKes(statement.totalIn)}</TableCell>
          <TableCell className={`${NUM} font-semibold`}>{formatKes(statement.totalOut)}</TableCell>
          <TableCell className={`${NUM} font-semibold`}>{formatKes(statement.balance)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
