/**
 * Export the register in its current scope to Excel or PDF
 * (Fundraising S3, lane S3-UI-F, ticket 3.11).
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadBase64File } from "@/lib/download-base64-file";
import {
  EXPORT_PLEDGES,
  type ExportPledgesData,
  type ExportPledgesVars,
  type PledgeExportFormat,
  type PledgeScope,
} from "@/lib/graphql/fundraising/admin-pledges";

const FORMATS: { value: PledgeExportFormat; label: string }[] = [
  { value: "excel", label: "Export Excel" },
  { value: "pdf", label: "Export PDF" },
];
const FAILED = "Could not export the pledges";

export function ExportPledgesButtons({ scope }: { scope: PledgeScope }) {
  const [busy, setBusy] = useState<PledgeExportFormat | null>(null);
  const [exportPledges] = useMutation<ExportPledgesData, ExportPledgesVars>(EXPORT_PLEDGES);

  const run = async (format: PledgeExportFormat) => {
    setBusy(format);
    try {
      const { data } = await exportPledges({ variables: { format, ...scope } });
      const result = data?.exportPledges;
      if (result?.success && result.fileData && result.filename) {
        downloadBase64File(result.fileData, result.filename, result.contentType || "application/octet-stream");
        toast.success(result.message || "Pledges exported");
      } else {
        toast.error(result?.message || FAILED);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : FAILED);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {FORMATS.map(({ value, label }) => (
        <Button key={value} variant="outline" disabled={busy !== null} onClick={() => void run(value)}>
          {busy === value ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {label}
        </Button>
      ))}
    </>
  );
}
