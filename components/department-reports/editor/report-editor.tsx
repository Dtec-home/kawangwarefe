/**
 * The leader's report editor (DEPARTMENT_REPORTS US-3…US-7, US-10, DR-7).
 *
 * Section values live in local state while the leader writes; every change
 * is handed to `saveSection` (debounced autosave in `useReportDraft`) and
 * pending saves are flushed when the leader leaves a section. The report
 * passed in follows the Apollo cache, so after a save it carries the new
 * ids, `missing` and `progress`; local rows adopt the saved ids by position.
 */

"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Eye, History } from "lucide-react";

import type { ReportPreviewData } from "@/components/department-reports/report-preview";
import { Button } from "@/components/ui/button";
import { ITEM_KIND_BY_SECTION, SECTION_HINTS, isListSection, type ListSectionKey } from "@/lib/department-reports/sections";
import type {
  DepartmentReport,
  ReportError,
  ReportSectionSpec,
  SectionKey,
} from "@/lib/department-reports/types";
import type { ReportDraftState } from "@/lib/department-reports/use-report-draft";

import { FinancialSectionEditor } from "./financial-section";
import {
  adoptItemIds,
  financialDraftFrom,
  itemRowsFrom,
  leaderRowsFrom,
  lineKey,
  reportErrorMessage,
  toItemInputs,
  toLeaderInputs,
  type FinancialDraft,
  type ItemRow,
  type LeaderRow,
} from "./helpers";
import { LeadersSectionEditor } from "./leaders-section";
import { ListSectionEditor, type ObjectiveOption } from "./list-section";
import { PinnedComments, ReturnedBanner, openComments } from "./review-comments";
import { SectionStepper } from "./section-stepper";
import { SubmitPanel } from "./submit-panel";
import { TextSectionEditor } from "./text-section";

type DraftMap = {
  introduction: string;
  conclusion: string;
  leaders: LeaderRow[];
  financial: FinancialDraft;
} & Record<ListSectionKey, ItemRow[]>;

export type EditorDraftApi = Pick<ReportDraftState, "saveSection" | "flush" | "status" | "hasUnsaved">;

export interface ReportEditorViewProps {
  report: DepartmentReport;
  specs: readonly ReportSectionSpec[];
  draft: EditorDraftApi;
  /** Label of the period objectives are carried forward from, e.g. "2024-2025". */
  previousPeriodLabel?: string | null;
  /** Resolves with the error, or null when the objectives were added. */
  onCarryForward: (itemIds: string[]) => Promise<ReportError | null>;
  /** Resolves with the error, or null when the report was submitted. */
  onSubmit: () => Promise<ReportError | null>;
  /** Called with a message to show the user (sonner in the page). */
  onNotify?: (kind: "success" | "error", message: string) => void;
}

const sectionDomId = (key: string) => `dept-section-${key}`;
const headingDomId = (key: string) => `dept-section-${key}-title`;

function initialStep(report: DepartmentReport, specs: readonly ReportSectionSpec[]): SectionKey {
  if (report.status === "returned") {
    const commented = specs.find((s) => openComments(report.comments).some((c) => c.sectionKey === s.key));
    if (commented) return commented.key;
  }
  const missing = specs.find((s) => report.missing.some((m) => m.key === s.key));
  return (missing ?? specs[0]).key;
}

export function ReportEditorView({
  report,
  specs,
  draft,
  previousPeriodLabel,
  onCarryForward,
  onSubmit,
  onNotify,
}: ReportEditorViewProps) {
  const [step, setStep] = useState<SectionKey>(() => initialStep(report, specs));
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [listOpen, setListOpen] = useState(false);
  const [drafts, setDrafts] = useState<Partial<DraftMap>>({});
  const [carrying, setCarrying] = useState(false);
  const focusHeading = useRef<string | null>(null);

  useEffect(() => {
    if (!focusHeading.current) return;
    const el = document.getElementById(focusHeading.current);
    focusHeading.current = null;
    if (el) {
      el.focus();
      el.scrollIntoView?.({ block: "start", behavior: "smooth" });
    }
  });

  const comments = useMemo(() => (report.status === "returned" ? openComments(report.comments) : []), [report]);
  const flagged = useMemo(() => new Set(comments.map((c) => c.sectionKey)), [comments]);
  const complete = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const spec of specs) out[spec.key] = !report.missing.some((m) => m.key === spec.key);
    return out;
  }, [report.missing, specs]);

  // ── Current values: local edits, else the saved report ────────────────
  const listRows = (key: ListSectionKey): ItemRow[] => {
    const kind = ITEM_KIND_BY_SECTION[key];
    const local = drafts[key];
    if (!local) return itemRowsFrom(report.items, kind);
    return adoptItemIds(local, report.items.filter((i) => i.kind === kind));
  };
  const leaderRows = drafts.leaders ?? leaderRowsFrom(report.leaders);
  const financial = drafts.financial ?? financialDraftFrom(report.financialNote, report.financial);
  const textValue = (key: "introduction" | "conclusion") => drafts[key] ?? report[key];

  const objectiveRows = listRows("objectives");
  const objectiveOptions: ObjectiveOption[] = objectiveRows
    .filter((r): r is ItemRow & { id: string } => !!r.id && !!r.text.trim())
    .map((r) => ({ id: r.id, text: r.text }));
  const savedObjectiveIds = new Set(report.items.filter((i) => i.kind === "objective").map((i) => i.id));

  // ── Edits → local state + autosave ────────────────────────────────────
  const setText = (key: "introduction" | "conclusion", value: string) => {
    setDrafts((d) => ({ ...d, [key]: value }));
    draft.saveSection(key, value);
  };
  const setList = (key: ListSectionKey, rows: ItemRow[]) => {
    setDrafts((d) => ({ ...d, [key]: rows }));
    const inputs = toItemInputs(rows).map((item) => ({
      ...item,
      // Only an achievement links to an objective, and only to one that is saved.
      fulfilsId: key === "achievements" && item.fulfilsId && savedObjectiveIds.has(item.fulfilsId) ? item.fulfilsId : null,
    }));
    draft.saveSection(key, inputs);
  };
  const setLeaders = (rows: LeaderRow[]) => {
    setDrafts((d) => ({ ...d, leaders: rows }));
    draft.saveSection("leaders", toLeaderInputs(rows));
  };
  const setFinancial = (value: FinancialDraft) => {
    setDrafts((d) => ({ ...d, financial: value }));
    draft.saveSection("financial", {
      note: value.note,
      lineNotes: report.financial.lines.map((line) => ({
        direction: line.direction,
        label: line.label,
        note: value.lineNotes[lineKey(line)] ?? line.note,
      })),
    });
  };

  // ── Navigation ────────────────────────────────────────────────────────
  const goTo = (key: SectionKey) => {
    void draft.flush();
    setStep(key);
    setMode("edit");
    setListOpen(false);
    focusHeading.current = headingDomId(key);
  };
  const index = specs.findIndex((s) => s.key === step);
  const spec = specs[index] ?? specs[0];
  const prev = specs[index - 1];
  const next = specs[index + 1];

  const openPreview = async () => {
    setListOpen(false);
    setMode("preview");
    focusHeading.current = "dept-report-preview-top";
    await draft.flush();
  };

  // ── Carry forward (D8) ────────────────────────────────────────────────
  const carriedFrom = new Set(report.items.map((i) => i.carriedFromId).filter(Boolean));
  const candidates = report.carryForwardCandidates;
  const carry = async (ids: string[]) => {
    if (ids.length === 0) return;
    setCarrying(true);
    try {
      await draft.flush();
      const error = await onCarryForward(ids);
      if (error) {
        onNotify?.("error", reportErrorMessage(error));
        return;
      }
      // Show the saved objectives (now including the carried ones).
      setDrafts((d) => {
        const rest = { ...d };
        delete rest.objectives;
        return rest;
      });
      onNotify?.("success", ids.length === 1 ? "Objective carried forward" : `${ids.length} objectives carried forward`);
    } finally {
      setCarrying(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const waitingReason =
    draft.status === "saving" || draft.hasUnsaved ? "Saving your latest changes… wait until everything is saved." : null;
  const submit = async () => {
    await draft.flush();
    const error = await onSubmit();
    if (error) {
      onNotify?.("error", reportErrorMessage(error));
      return false;
    }
    onNotify?.("success", "Report submitted. The pastor will review it.");
    return true;
  };

  const preview: ReportPreviewData = {
    ...report,
    financial: {
      ...report.financial,
      lines: report.financial.lines.map((line) => ({ ...line, note: financial.lineNotes[lineKey(line)] ?? line.note })),
    },
  };

  // ── Section body ──────────────────────────────────────────────────────
  const hint = SECTION_HINTS[spec.key];
  const hintId = `${sectionDomId(spec.key)}-hint`;
  const sectionComments = comments.filter((c) => c.sectionKey === spec.key);

  let body: ReactNode = null;
  if (spec.kind === "text" && (spec.key === "introduction" || spec.key === "conclusion")) {
    const key = spec.key;
    body = (
      <TextSectionEditor
        spec={spec}
        value={textValue(key)}
        onChange={(v) => setText(key, v)}
        labelledBy={headingDomId(key)}
        describedBy={hintId}
      />
    );
  } else if (spec.kind === "leaders") {
    body = <LeadersSectionEditor spec={spec} rows={leaderRows} onChange={setLeaders} />;
  } else if (spec.kind === "list" && isListSection(spec.key)) {
    const key = spec.key;
    body = (
      <ListSectionEditor
        key={key}
        spec={{ ...spec, key }}
        rows={key === "objectives" ? objectiveRows : listRows(key)}
        onChange={(rows) => setList(key, rows)}
        objectives={key === "achievements" ? objectiveOptions : undefined}
        describedBy={hintId}
      />
    );
  } else if (spec.kind === "financial") {
    body = (
      <FinancialSectionEditor
        spec={spec}
        statement={report.financial}
        value={financial}
        onChange={setFinancial}
        describedBy={hintId}
      />
    );
  }

  return (
    <div className="space-y-4">
      {comments.length > 0 ? <ReturnedBanner comments={comments} specs={specs} onGoTo={goTo} /> : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {mode === "edit" ? (
          <Button type="button" size="mobile" onClick={() => void openPreview()}>
            <Eye aria-hidden="true" />
            Preview & submit
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="sm:sticky sm:top-4 sm:self-start">
          <SectionStepper
            specs={specs}
            current={mode === "edit" ? step : null}
            complete={complete}
            flagged={flagged}
            onSelect={goTo}
            open={listOpen}
            onToggle={() => setListOpen((o) => !o)}
          />
        </aside>

        <div className="min-w-0">
          {mode === "preview" ? (
            <div>
              <h2 id="dept-report-preview-top" tabIndex={-1} className="sr-only">
                Preview and submit
              </h2>
              <SubmitPanel
                preview={preview}
                specs={specs}
                missing={report.missing}
                waitingReason={waitingReason}
                canSubmit={report.canSubmit}
                onGoTo={goTo}
                onBack={() => goTo(step)}
                onSubmit={submit}
              />
            </div>
          ) : (
            <section
              id={sectionDomId(spec.key)}
              className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-6"
            >
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Section {spec.number} of {specs.length}
                  {spec.required ? "" : " · optional"}
                </p>
                <h2 id={headingDomId(spec.key)} tabIndex={-1} className="text-xl font-semibold outline-none">
                  {spec.title}
                </h2>
                <p id={hintId} className="text-sm text-muted-foreground">
                  {hint.hint}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">For example: </span>
                  {hint.example}
                </p>
              </div>

              <PinnedComments comments={sectionComments} />

              {spec.key === "objectives" && candidates.length > 0 ? (
                <div className="space-y-2 rounded-lg border border-dashed p-3" data-testid="carry-forward">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <History aria-hidden="true" className="size-4" />
                    {`Carry forward from ${previousPeriodLabel ?? "last year"}`}
                  </p>
                  <ul className="flex flex-wrap gap-2" aria-label={`Objectives from ${previousPeriodLabel ?? "last year"}`}>
                    {candidates.map((c) => {
                      const added = carriedFrom.has(c.id);
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            disabled={added || carrying}
                            aria-pressed={added}
                            aria-label={`${added ? "Already carried forward" : "Carry forward"}: ${c.text}`}
                            onClick={() => void carry([c.id])}
                            className="inline-flex min-h-9 max-w-full items-center gap-1 rounded-full border bg-background px-3 py-1 text-left text-sm break-words transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60 aria-pressed:border-success aria-pressed:bg-success/10"
                          >
                            <span aria-hidden="true">{added ? "✓" : "+"}</span>
                            {c.text}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {candidates.some((c) => !carriedFrom.has(c.id)) && candidates.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="mobile-sm"
                      disabled={carrying}
                      onClick={() => void carry(candidates.filter((c) => !carriedFrom.has(c.id)).map((c) => c.id))}
                    >
                      Carry all forward
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {body}

              <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-10 -mx-4 flex items-center justify-between gap-2 border-t bg-card/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
                {prev ? (
                  <Button type="button" variant="outline" size="mobile-sm" onClick={() => goTo(prev.key)}>
                    <ArrowLeft aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">Previous</span>
                  </Button>
                ) : (
                  <span />
                )}
                {next ? (
                  <Button type="button" size="mobile-sm" onClick={() => goTo(next.key)}>
                    Next section
                    <ArrowRight aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
