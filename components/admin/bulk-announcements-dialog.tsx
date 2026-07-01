"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { BULK_CREATE_ANNOUNCEMENTS } from "@/lib/graphql/announcement-mutations";
import {
  parseBulkAnnouncements,
  type BulkParseMode,
  type ParsedAnnouncement,
} from "@/lib/announcements/parse-bulk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, FileText, Table } from "lucide-react";

interface BulkAnnouncementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (count: number) => void;
}

const PARAGRAPH_SAMPLE = `Sunday Service
Join us this Sunday at 9 AM in the main hall.

Youth Meet
Friday 6 PM. Bring a friend!

Choir Practice
Saturday 4 PM, choir room.`;

const TABULAR_SAMPLE = `title\tcontent\tpriority\texpiry
Sunday Service\tJoin us this Sunday at 9 AM\t1\t2026-05-31
Youth Meet\tFriday 6 PM\t0\t
Choir Practice\tSaturday 4 PM\t0\t`;

const toBackendDateTime = (value: string): string | undefined => {
  if (!value) return undefined;
  const [d, t] = value.split("T");
  if (!t) return d;
  const seconds = t.length === 5 ? `${t}:00` : t;
  return `${d} ${seconds}`;
};

interface BulkResult {
  success: boolean;
  message: string;
  createdCount: number;
  failedCount: number;
  errors: string[];
}

export function BulkAnnouncementsDialog({
  open,
  onOpenChange,
  onCreated,
}: BulkAnnouncementsDialogProps) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<BulkParseMode>("auto");
  const [defaultPriority, setDefaultPriority] = useState(0);
  const [defaultPublishDate, setDefaultPublishDate] = useState("");
  const [defaultExpiryDate, setDefaultExpiryDate] = useState("");
  const [defaultActive, setDefaultActive] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BulkResult | null>(null);

  const [bulkCreate, { loading }] = useMutation<{
    bulkCreateAnnouncements: BulkResult;
  }>(BULK_CREATE_ANNOUNCEMENTS);

  useEffect(() => {
    if (!open) {
      setText("");
      setMode("auto");
      setError("");
      setResult(null);
    }
  }, [open]);

  const parsed = useMemo(() => parseBulkAnnouncements(text, mode), [text, mode]);
  const validItems: ParsedAnnouncement[] = parsed.items.filter((i) => i.errors.length === 0);
  const invalidItems: ParsedAnnouncement[] = parsed.items.filter((i) => i.errors.length > 0);

  const handleSubmit = async () => {
    setError("");
    setResult(null);

    if (validItems.length === 0) {
      setError("Add at least one valid announcement before submitting.");
      return;
    }

    const items = validItems.map((it) => ({
      title: it.title,
      content: it.content,
      priority: it.priority ?? defaultPriority,
      publishDate:
        it.publishDate ?? toBackendDateTime(defaultPublishDate) ?? undefined,
      expiryDate:
        it.expiryDate ?? toBackendDateTime(defaultExpiryDate) ?? undefined,
      isActive: it.isActive ?? defaultActive,
    }));

    try {
      const { data } = await bulkCreate({ variables: { items } });
      const r = data?.bulkCreateAnnouncements;
      if (!r) {
        setError("Empty response from server");
        return;
      }
      setResult(r);
      if (r.success) {
        onCreated(r.createdCount);
        if (r.failedCount === 0) {
          // Auto-close on a clean run
          setTimeout(() => onOpenChange(false), 600);
        }
      } else {
        setError(r.message || "Failed to create announcements");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk create failed");
    }
  };

  const insertSample = () => {
    setText(mode === "tabular" ? TABULAR_SAMPLE : PARAGRAPH_SAMPLE);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Announcements</DialogTitle>
          <DialogDescription>
            Paste a list of announcements. Each one becomes a separate entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="mr-1">Format:</Label>
            <Button
              type="button"
              size="sm"
              variant={mode === "auto" ? "default" : "outline"}
              onClick={() => setMode("auto")}
            >
              Auto-detect
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "paragraph" ? "default" : "outline"}
              onClick={() => setMode("paragraph")}
            >
              <FileText className="h-4 w-4 mr-1" />
              Title + paragraph
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "tabular" ? "default" : "outline"}
              onClick={() => setMode("tabular")}
            >
              <Table className="h-4 w-4 mr-1" />
              Spreadsheet (TSV/CSV)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={insertSample}
              className="ml-auto"
            >
              Insert sample
            </Button>
          </div>

          <div>
            <Label htmlFor="bulkText">Paste announcements</Label>
            <Textarea
              id="bulkText"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                "Paste announcements here.\n\n" +
                "• Title + paragraph: each block separated by a blank line; first line is the title.\n" +
                "• Spreadsheet: paste from Excel/Sheets — columns title, content, priority, expiry."
              }
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {parsed.mode === "tabular"
                ? `Detected ${parsed.delimiter === "\t" ? "tab" : "comma"}-separated values${parsed.hadHeader ? " with header row" : " (positional: title, content, priority, expiry, active)"}.`
                : "Each block separated by a blank line or '---'. First line of each block is the title."}
            </p>
          </div>

          <details className="rounded-md border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Defaults applied to rows that don&apos;t specify a value
            </summary>
            <div className="grid gap-3 md:grid-cols-2 mt-3">
              <div>
                <Label htmlFor="bulkDefaultPublish">Publish date</Label>
                <Input
                  id="bulkDefaultPublish"
                  type="datetime-local"
                  value={defaultPublishDate}
                  onChange={(e) => setDefaultPublishDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bulkDefaultExpiry">Expiry date</Label>
                <Input
                  id="bulkDefaultExpiry"
                  type="datetime-local"
                  value={defaultExpiryDate}
                  onChange={(e) => setDefaultExpiryDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bulkDefaultPriority">Priority</Label>
                <Input
                  id="bulkDefaultPriority"
                  type="number"
                  min={0}
                  value={defaultPriority}
                  onChange={(e) => setDefaultPriority(parseInt(e.target.value || "0", 10))}
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="bulkDefaultActive"
                  checked={defaultActive}
                  onCheckedChange={(v) => setDefaultActive(Boolean(v))}
                />
                <Label htmlFor="bulkDefaultActive">Active by default</Label>
              </div>
            </div>
          </details>

          <div className="rounded-md border">
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                Preview
                <Badge variant="secondary">{validItems.length} ready</Badge>
                {invalidItems.length > 0 && (
                  <Badge variant="destructive">{invalidItems.length} with errors</Badge>
                )}
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {parsed.items.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Nothing to preview yet. Paste content above.
                </p>
              ) : (
                <ul className="divide-y">
                  {parsed.items.map((item, idx) => (
                    <li key={idx} className="p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                            <span className="font-medium break-words">
                              {item.title || <em className="text-muted-foreground">(no title)</em>}
                            </span>
                            {item.priority !== undefined && (
                              <Badge variant="outline">P{item.priority}</Badge>
                            )}
                            {item.expiryDate && (
                              <Badge variant="outline">expires {item.expiryDate}</Badge>
                            )}
                            {item.publishDate && (
                              <Badge variant="outline">publish {item.publishDate}</Badge>
                            )}
                            {item.isActive === false && (
                              <Badge variant="secondary">inactive</Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground line-clamp-2 mt-1 whitespace-pre-wrap">
                            {item.content || <em>(no content)</em>}
                          </div>
                          {item.errors.length > 0 && (
                            <div className="text-destructive text-xs mt-1">
                              {item.errors.join("; ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>{result.message}</AlertTitle>
              {result.errors.length > 0 && (
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 text-xs">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              )}
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Close
          </Button>
          <Button onClick={handleSubmit} disabled={loading || validItems.length === 0}>
            {loading
              ? "Creating..."
              : `Create ${validItems.length} announcement${validItems.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
