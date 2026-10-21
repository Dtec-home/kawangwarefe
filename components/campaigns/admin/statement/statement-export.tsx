"use client";

/**
 * Export Excel / PDF for the campaign statement over the chosen period,
 * downloaded through the shared base64 helper.
 */

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadBase64File } from "@/lib/download-base64-file";
import {
  EXPORT_CAMPAIGN_STATEMENT,
  type ExportCampaignStatementData,
  type ExportCampaignStatementVars,
  type StatementExportFormat,
  type StatementPeriod,
} from "@/lib/graphql/fundraising/statement";

interface StatementExportProps {
  campaignId: string;
  period: StatementPeriod;
  disabled?: boolean;
}

const FAILED = "Could not export the statement";

export function StatementExport({ campaignId, period, disabled = false }: StatementExportProps) {
  const [busy, setBusy] = useState<StatementExportFormat | null>(null);
  const [exportStatement] = useMutation<ExportCampaignStatementData, ExportCampaignStatementVars>(
    EXPORT_CAMPAIGN_STATEMENT
  );

  const run = async (format: StatementExportFormat) => {
    setBusy(format);
    try {
      const { data } = await exportStatement({ variables: { campaignId, format, ...period } });
      const result = data?.exportCampaignStatement;
      if (result?.success && result.fileData && result.filename) {
        downloadBase64File(result.fileData, result.filename, result.contentType || "application/octet-stream");
        toast.success(result.message || "Statement exported");
      } else {
        toast.error(result?.message || FAILED);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : FAILED);
    } finally {
      setBusy(null);
    }
  };

  const locked = disabled || busy !== null;
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" disabled={locked} onClick={() => void run("excel")}>
        <FileSpreadsheet className="h-4 w-4" aria-hidden />
        {busy === "excel" ? "Exporting…" : "Export Excel"}
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={locked} onClick={() => void run("pdf")}>
        <FileText className="h-4 w-4" aria-hidden />
        {busy === "pdf" ? "Exporting…" : "Export PDF"}
      </Button>
    </div>
  );
}
