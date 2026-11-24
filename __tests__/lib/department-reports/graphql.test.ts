/**
 * Department reports GraphQL documents (DR-6): one document per root field in
 * 02_CONTRACTS.md § GraphQL, unions resolved through __typename.
 */
import { describe, it, expect } from "vitest";
import { print, type DocumentNode, type OperationDefinitionNode } from "graphql";

import * as docs from "@/lib/graphql/department-reports";
import {
  isReportError,
  unwrapReportResult,
} from "@/lib/graphql/department-reports";
import type { DepartmentReportResult, DepartmentReportDraft } from "@/lib/department-reports/types";

function rootFields(doc: DocumentNode): { op: string; fields: string[] } {
  const op = doc.definitions.find((d): d is OperationDefinitionNode => d.kind === "OperationDefinition")!;
  return {
    op: op.operation,
    fields: op.selectionSet.selections.map((s) => (s.kind === "Field" ? s.name.value : "")),
  };
}

const ALL: DocumentNode[] = Object.values(docs).filter(
  (v): v is DocumentNode =>
    typeof v === "object" && v !== null && (v as DocumentNode).kind === "Document" &&
    (v as DocumentNode).definitions.some((d) => d.kind === "OperationDefinition"),
);

const covered = (operation: string) =>
  ALL.map(rootFields).filter((r) => r.op === operation).flatMap((r) => r.fields);

describe("department reports documents", () => {
  it("covers every query in the contract", () => {
    expect(new Set(covered("query"))).toEqual(new Set([
      "reportSectionSpecs", "reportingPeriods", "myDepartmentReports", "departmentReport",
      "departmentReportTracker", "exportDepartmentReport", "exportReportBook",
    ]));
  });

  it("covers every mutation in the contract", () => {
    expect(new Set(covered("mutation"))).toEqual(new Set([
      "openReportingPeriod", "updateReportingPeriod", "closeReportingPeriod",
      "startDepartmentReport", "saveReportText", "saveReportItems", "saveReportLeaders",
      "saveReportFinancialNotes", "carryForwardObjectives", "submitDepartmentReport",
      "returnDepartmentReport", "approveDepartmentReport", "reopenDepartmentReport",
    ]));
  });

  it("resolves the result unions with inline fragments and __typename", () => {
    for (const doc of [docs.SAVE_REPORT_TEXT, docs.SUBMIT_DEPARTMENT_REPORT, docs.START_DEPARTMENT_REPORT]) {
      const text = print(doc);
      expect(text).toContain("__typename");
      expect(text).toContain("... on DepartmentReport");
      expect(text).toContain("... on ReportError");
    }
    const period = print(docs.OPEN_REPORTING_PERIOD);
    expect(period).toContain("... on ReportingPeriod");
    expect(period).toContain("... on ReportError");
  });

  it("autosave mutations skip the money (no live statement per keystroke)", () => {
    for (const doc of [docs.SAVE_REPORT_TEXT, docs.SAVE_REPORT_ITEMS, docs.SAVE_REPORT_LEADERS, docs.SAVE_REPORT_FINANCIAL_NOTES]) {
      expect(print(doc)).not.toContain("broughtForward");
    }
    expect(print(docs.GET_DEPARTMENT_REPORT)).toContain("broughtForward");
    expect(print(docs.GET_DEPARTMENT_REPORT)).toContain("liveFinancial");
  });
});

describe("result helpers", () => {
  const report = { __typename: "DepartmentReport", id: "5" } as DepartmentReportResult<DepartmentReportDraft>;
  const error: DepartmentReportResult = { __typename: "ReportError", code: "locked", message: "Report is locked", missing: null };

  it("isReportError narrows on __typename", () => {
    expect(isReportError(error)).toBe(true);
    expect(isReportError(report)).toBe(false);
    expect(isReportError(null)).toBe(false);
  });

  it("unwrapReportResult splits a union result", () => {
    expect(unwrapReportResult(report)).toEqual({ report, error: null });
    expect(unwrapReportResult(error)).toEqual({ report: null, error });
    expect(unwrapReportResult(undefined)).toEqual({ report: null, error: null });
  });
});
