"use client";

/**
 * Downloads a `ReportResponse` export (one report as PDF/Word, or the AGM
 * book) and saves it with the server's filename (DR-8, US-11/US-12).
 * Exports are never cached: each click asks the server for a fresh file.
 */

import { useCallback, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { toast } from "sonner";

import { downloadBase64File } from "@/lib/download-base64-file";
import { EXPORT_DEPARTMENT_REPORT, EXPORT_REPORT_BOOK } from "@/lib/graphql/department-reports";
import type { ReportExportFormat, ReportResponse } from "@/lib/department-reports/types";
import { thrownMessage } from "@/components/department-reports/staff/report-errors";

const CONTENT_TYPES: Record<ReportExportFormat, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export type DownloadKey = ReportExportFormat | "book";

/** Save the file; returns false (after a toast) when the server refused. */
export function saveReportResponse(response: ReportResponse | null | undefined, fallbackType: string): boolean {
  if (!response?.success || !response.fileData || !response.filename) {
    toast.error(response?.message || "The file could not be created. Please try again.");
    return false;
  }
  downloadBase64File(response.fileData, response.filename, response.contentType || fallbackType);
  toast.success(`Downloaded ${response.filename}`);
  return true;
}

export function useReportDownload() {
  const client = useApolloClient();
  const [busy, setBusy] = useState<DownloadKey | null>(null);

  const run = useCallback(async (key: DownloadKey, fetchFile: () => Promise<ReportResponse | undefined>, type: string) => {
    setBusy(key);
    try {
      saveReportResponse(await fetchFile(), type);
    } catch (error) {
      toast.error(thrownMessage(error, "The file could not be downloaded. Please try again."));
    } finally {
      setBusy(null);
    }
  }, []);

  const downloadReport = useCallback(
    (id: string, format: ReportExportFormat) =>
      run(
        format,
        async () => {
          const { data } = await client.query({
            query: EXPORT_DEPARTMENT_REPORT,
            variables: { id, format },
            fetchPolicy: "no-cache",
          });
          return data?.exportDepartmentReport;
        },
        CONTENT_TYPES[format],
      ),
    [client, run],
  );

  const downloadBook = useCallback(
    (periodId: string) =>
      run(
        "book",
        async () => {
          const { data } = await client.query({
            query: EXPORT_REPORT_BOOK,
            variables: { periodId },
            fetchPolicy: "no-cache",
          });
          return data?.exportReportBook;
        },
        CONTENT_TYPES.pdf,
      ),
    [client, run],
  );

  return { busy, downloadReport, downloadBook };
}
