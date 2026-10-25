"use client";

/**
 * Treasurer's Cash Statement export card (T3.4, spec 03 §6): a single
 * Sabbath (default: the most recent Saturday in Nairobi) or a date range,
 * PDF or Excel, US Letter or A4 → generateCashStatement → download.
 * A collapsible period summary (T4.1, T4.2) follows the chosen range.
 * For a single date the certification status and Certify / Unlock actions
 * are shown (T5.3).
 */

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { AlertCircle, ChevronDown, Columns3, Download, Landmark } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PeriodSummary } from "@/components/treasury/period-summary";
import { StatementColumnsPreviewDialog } from "@/components/treasury/statement-columns-preview";
import { StatementCertificationControl } from "@/components/treasury/statement-certification";
import {
  GENERATE_CASH_STATEMENT,
  type GenerateCashStatementData,
} from "@/lib/graphql/treasury-mutations";
import { mostRecentSaturday, statementRangeError } from "@/lib/treasury/cash-statement";
import { downloadBase64File } from "@/lib/download-base64-file";

type Mode = "single" | "range";
type Format = "pdf" | "excel";
type Paper = "letter" | "a4";

interface Option<T extends string> {
  value: T;
  label: string;
}

const MODE_OPTIONS: Option<Mode>[] = [
  { value: "single", label: "Single date" },
  { value: "range", label: "Date range" },
];
const FORMAT_OPTIONS: Option<Format>[] = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
];
const PAPER_OPTIONS: Option<Paper>[] = [
  { value: "letter", label: "Letter" },
  { value: "a4", label: "A4" },
];

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium leading-none">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={value === option.value ? "default" : "outline"}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function CashStatementExportCard() {
  const [mode, setMode] = useState<Mode>("single");
  const [singleDate, setSingleDate] = useState<string>(() => mostRecentSaturday());
  const [rangeFrom, setRangeFrom] = useState<string>(() => mostRecentSaturday());
  const [rangeTo, setRangeTo] = useState<string>(() => mostRecentSaturday());
  const [format, setFormat] = useState<Format>("pdf");
  const [paper, setPaper] = useState<Paper>("letter");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);

  const [generateCashStatement, { loading }] =
    useMutation<GenerateCashStatementData>(GENERATE_CASH_STATEMENT);

  const dateFrom = mode === "single" ? singleDate : rangeFrom;
  const dateTo = mode === "single" ? singleDate : rangeTo;
  const validationError = mode === "single"
    ? (singleDate ? null : "Choose a date")
    : statementRangeError(rangeFrom, rangeTo);

  const handleGenerate = async () => {
    if (validationError) return;
    try {
      const { data } = await generateCashStatement({
        variables: { dateFrom, dateTo, format, paper },
      });
      const result = data?.generateCashStatement;
      if (result?.success && result.fileData && result.filename) {
        downloadBase64File(
          result.fileData,
          result.filename,
          result.contentType || "application/octet-stream",
        );
        toast.success(result.message || "Cash statement downloaded");
        setSummaryRefreshKey((key) => key + 1);
      } else {
        toast.error(result?.message || "Could not generate the cash statement");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate the cash statement");
    }
  };

  return (
    <Card data-testid="cash-statement-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          Treasurer&apos;s Cash Statement
        </CardTitle>
        <CardDescription>
          The church treasurer&apos;s cash statement: one section per date with a row per receipt,
          trust funds before local funds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <SegmentedControl label="Period" options={MODE_OPTIONS} value={mode} onChange={setMode} />
          <SegmentedControl label="Format" options={FORMAT_OPTIONS} value={format} onChange={setFormat} />
          <SegmentedControl label="Paper" options={PAPER_OPTIONS} value={paper} onChange={setPaper} />
        </div>

        {mode === "single" ? (
          <div className="space-y-3">
            <div className="space-y-2 sm:max-w-xs">
              <Label htmlFor="cash-statement-date">Date</Label>
              <Input
                id="cash-statement-date"
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Defaults to the most recent Sabbath.</p>
            </div>
            {singleDate && <StatementCertificationControl date={singleDate} />}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 sm:max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="cash-statement-from">From</Label>
              <Input
                id="cash-statement-from"
                type="date"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cash-statement-to">To</Label>
              <Input
                id="cash-statement-to"
                type="date"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
              />
            </div>
          </div>
        )}

        {validationError && (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {validationError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleGenerate()} disabled={loading || validationError !== null}>
            <Download className="h-4 w-4 mr-2" />
            {loading ? "Generating..." : "Generate Cash Statement"}
          </Button>
          <Button
            type="button"
            variant="link"
            className="px-0"
            onClick={() => setPreviewOpen(true)}
            disabled={validationError !== null}
          >
            <Columns3 className="h-4 w-4 mr-1" />
            Preview columns
          </Button>
        </div>

        <div className="border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            className="-ml-2 px-2"
            aria-expanded={summaryOpen}
            aria-controls="cash-statement-period-summary"
            onClick={() => setSummaryOpen((open) => !open)}
          >
            <ChevronDown
              className={`h-4 w-4 mr-1 transition-transform ${summaryOpen ? "rotate-0" : "-rotate-90"}`}
            />
            Period summary
          </Button>
          {summaryOpen && (
            <div id="cash-statement-period-summary" className="pt-4">
              {validationError ? (
                <p className="text-sm text-muted-foreground">
                  Choose a valid period to see its summary.
                </p>
              ) : (
                <PeriodSummary dateFrom={dateFrom} dateTo={dateTo} refreshKey={summaryRefreshKey} />
              )}
            </div>
          )}
        </div>
      </CardContent>
      <StatementColumnsPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </Card>
  );
}
