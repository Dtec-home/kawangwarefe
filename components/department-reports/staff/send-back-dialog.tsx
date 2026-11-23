"use client";

/**
 * "Send back to the leader" (DR-8, US-9): one or more comments, each pinned to
 * a template section. The submit stays disabled until a comment has text
 * (the server also refuses with `comment_required`).
 */

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Loader2, Plus, Trash2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_SECTION_SPECS } from "@/lib/department-reports/sections";
import { GET_REPORT_SECTION_SPECS } from "@/lib/graphql/department-reports";
import type { ReportCommentInput, SectionKey } from "@/lib/department-reports/types";

/** Keeps each comment readable on a phone and in the SMS/PDF. */
export const COMMENT_MAX_CHARS = 1000;

interface DraftComment {
  id: number;
  sectionKey: SectionKey;
  body: string;
}

interface SendBackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (comments: ReportCommentInput[]) => Promise<boolean>;
  submitting?: boolean;
}

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** The non-empty comments, trimmed, ready for `returnDepartmentReport`. */
export function commentsToSend(drafts: ReadonlyArray<Pick<DraftComment, "sectionKey" | "body">>): ReportCommentInput[] {
  return drafts
    .map(({ sectionKey, body }) => ({ sectionKey, body: body.trim() }))
    .filter(({ body }) => body.length > 0);
}

export function SendBackDialog({ open, onOpenChange, onSubmit, submitting = false }: SendBackDialogProps) {
  const { data } = useQuery(GET_REPORT_SECTION_SPECS, { fetchPolicy: "cache-first" });
  const specs = data?.reportSectionSpecs?.length ? data.reportSectionSpecs : DEFAULT_SECTION_SPECS;
  const firstKey = specs[0]?.key ?? "introduction";

  const [nextId, setNextId] = useState(2);
  const [drafts, setDrafts] = useState<DraftComment[]>([{ id: 1, sectionKey: firstKey, body: "" }]);

  const reset = () => {
    setDrafts([{ id: 1, sectionKey: firstKey, body: "" }]);
    setNextId(2);
  };

  const update = (id: number, patch: Partial<DraftComment>) =>
    setDrafts((current) => current.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const addComment = () => {
    setDrafts((current) => [...current, { id: nextId, sectionKey: firstKey, body: "" }]);
    setNextId((n) => n + 1);
  };

  const removeComment = (id: number) => setDrafts((current) => current.filter((d) => d.id !== id));

  const toSend = commentsToSend(drafts);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (toSend.length === 0 || submitting) return;
    if (await onSubmit(toSend)) reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Send back to the leader</DialogTitle>
          <DialogDescription>
            Say what needs to change. Each comment is pinned to the section it is about, and the leader can fix
            the report and submit it again.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {drafts.map((draft, index) => {
            const n = index + 1;
            return (
              <fieldset
                key={draft.id}
                aria-label={`Comment ${n}`}
                className="space-y-3 rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Comment {n}</p>
                  {drafts.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComment(draft.id)}
                      aria-label={`Remove comment ${n}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`send-back-section-${draft.id}`}>Section</Label>
                  <select
                    id={`send-back-section-${draft.id}`}
                    className={SELECT_CLASS}
                    value={draft.sectionKey}
                    onChange={(e) => update(draft.id, { sectionKey: e.target.value as SectionKey })}
                  >
                    {specs.map((spec) => (
                      <option key={spec.key} value={spec.key}>
                        {spec.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`send-back-body-${draft.id}`}>What needs to change?</Label>
                  <Textarea
                    id={`send-back-body-${draft.id}`}
                    rows={3}
                    maxLength={COMMENT_MAX_CHARS}
                    placeholder="Please add the cost of the roof repairs."
                    value={draft.body}
                    onChange={(e) => update(draft.id, { body: e.target.value })}
                  />
                </div>
              </fieldset>
            );
          })}

          <Button type="button" variant="outline" size="sm" onClick={addComment}>
            <Plus className="mr-2 h-4 w-4" />
            Add another comment
          </Button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={toSend.length === 0 || submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Send back
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
