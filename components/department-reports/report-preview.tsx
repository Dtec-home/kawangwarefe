/**
 * A department report laid out like its PDF (DEPARTMENT_REPORTS §4.5, DR-7):
 * title "<Dept> Department Report", "Period <label>", then sections 1–8 with
 * the registry titles. Read-only. The leader sees it before submitting; staff
 * (DR-8) reuse it to review, adding their own controls per section through
 * `renderSectionExtras`.
 *
 * It never shows a status badge, so `data-testid="dept-report-status"` stays
 * unique on the report page.
 */

import type { ReactNode } from "react";

import { FinancialTable } from "@/components/department-reports/editor/financial-table";
import { formatAsOf } from "@/components/department-reports/editor/helpers";
import { DEFAULT_SECTION_SPECS, ITEM_KIND_BY_SECTION, isListSection } from "@/lib/department-reports/sections";
import type { DepartmentReport, ReportItem, ReportSectionSpec } from "@/lib/department-reports/types";
import { cn } from "@/lib/utils";

/** The parts of a report the preview reads. */
export type ReportPreviewData = Pick<
  DepartmentReport,
  "introduction" | "conclusion" | "financialNote" | "leaders" | "items" | "financial" | "period" | "department"
>;

export interface ReportPreviewProps {
  report: ReportPreviewData;
  /** The server's `reportSectionSpecs`; the contract defaults when omitted. */
  specs?: readonly ReportSectionSpec[];
  /** Extra content under a section's heading (e.g. reviewer comments). */
  renderSectionExtras?: (spec: ReportSectionSpec) => ReactNode;
  className?: string;
}

export const previewSectionId = (key: string) => `preview-section-${key}`;

function NotWritten() {
  return <p className="text-sm italic text-muted-foreground">Not filled in yet.</p>;
}

function Paragraphs({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return <NotWritten />;
  return (
    <div className="space-y-2">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line break-words">
          {p}
        </p>
      ))}
    </div>
  );
}

function ItemList({ items, objectives }: { items: ReportItem[]; objectives: Map<string, string> }) {
  if (items.length === 0) return <p className="text-sm italic text-muted-foreground">None listed.</p>;
  return (
    <ol className="list-decimal space-y-1.5 pl-6">
      {items.map((item) => {
        const fulfils = item.fulfilsId ? objectives.get(item.fulfilsId) : undefined;
        return (
          <li key={item.id} className="break-words">
            {item.text}
            {fulfils ? <span className="block text-xs text-muted-foreground">Fulfils: {fulfils}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

function SectionBody({ spec, report }: { spec: ReportSectionSpec; report: ReportPreviewData }) {
  if (spec.kind === "text") {
    return <Paragraphs text={spec.key === "conclusion" ? report.conclusion : report.introduction} />;
  }
  if (spec.kind === "leaders") {
    if (report.leaders.length === 0) return <NotWritten />;
    return (
      <ul className="divide-y rounded-lg border">
        {report.leaders.map((leader, i) => (
          <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 p-2">
            <span className="font-medium break-words">{leader.name}</span>
            <span className="text-sm text-muted-foreground break-words">
              {[leader.roleTitle, leader.phone].filter(Boolean).join(" · ")}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (spec.kind === "list" && isListSection(spec.key)) {
    const kind = ITEM_KIND_BY_SECTION[spec.key];
    const byOrder = (a: ReportItem, b: ReportItem) => a.order - b.order;
    const items = report.items.filter((i) => i.kind === kind).sort(byOrder);
    const objectives = new Map(report.items.filter((i) => i.kind === "objective").map((i) => [i.id, i.text]));
    return <ItemList items={items} objectives={objectives} />;
  }
  if (spec.kind === "financial") {
    const { financial } = report;
    return (
      <div className="space-y-2">
        <FinancialTable statement={financial} caption={`${spec.title}, ${report.period.label}`} />
        <p className="text-xs text-muted-foreground">
          {financial.frozen ? "Frozen on submission" : "From the treasurer's books"} as of {formatAsOf(financial.asOf)}
        </p>
        {report.financialNote.trim() ? <Paragraphs text={report.financialNote} /> : null}
      </div>
    );
  }
  return null;
}

export function ReportPreview({ report, specs = DEFAULT_SECTION_SPECS, renderSectionExtras, className }: ReportPreviewProps) {
  const ordered = specs.slice().sort((a, b) => a.number - b.number);
  return (
    <article
      data-testid="dept-report-preview"
      aria-label={`${report.department.name} Department Report, period ${report.period.label}`}
      className={cn("space-y-6 rounded-xl border bg-card p-4 shadow-sm sm:p-8", className)}
    >
      <header className="space-y-1 border-b pb-4 text-center">
        <h2 className="text-xl font-bold tracking-tight break-words sm:text-2xl">
          {report.department.name} Department Report
        </h2>
        <p className="text-muted-foreground">Period {report.period.label}</p>
      </header>
      {ordered.map((spec) => (
        <section key={spec.key} id={previewSectionId(spec.key)} className="space-y-2">
          <h3 id={`${previewSectionId(spec.key)}-title`} className="text-base font-semibold">
            {spec.number}. {spec.title}
          </h3>
          {renderSectionExtras?.(spec)}
          <SectionBody spec={spec} report={report} />
        </section>
      ))}
    </article>
  );
}
