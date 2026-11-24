/**
 * Reviewer comments for the leader (US-10): a banner listing every comment
 * when a report comes back, and the same comments pinned to the top of the
 * section they are about.
 */

import { MessageSquareWarning } from "lucide-react";

import type { ReportComment, ReportSectionSpec, SectionKey } from "@/lib/department-reports/types";

import { formatAsOf } from "./helpers";

/** The comments still waiting for the leader. */
export function openComments(comments: readonly ReportComment[]): ReportComment[] {
  return comments.filter((c) => !c.resolved);
}

function Byline({ comment }: { comment: ReportComment }) {
  return (
    <span className="text-xs text-muted-foreground">
      {comment.author ? `${comment.author} · ` : ""}
      {formatAsOf(comment.createdAt)}
    </span>
  );
}

interface ReturnedBannerProps {
  comments: readonly ReportComment[];
  specs: readonly ReportSectionSpec[];
  onGoTo: (key: SectionKey) => void;
}

export function ReturnedBanner({ comments, specs, onGoTo }: ReturnedBannerProps) {
  const titles = new Map(specs.map((s) => [s.key, s.title]));
  return (
    <section
      data-testid="dept-report-comments"
      aria-labelledby="dept-report-comments-title"
      className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
    >
      <div className="flex items-start gap-2">
        <MessageSquareWarning aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <h2 id="dept-report-comments-title" className="font-semibold">
            The reviewer sent this report back
          </h2>
          <p className="text-sm text-muted-foreground">Make the changes below, then preview and submit it again.</p>
        </div>
      </div>
      <ul className="space-y-2">
        {comments.map((comment, i) => {
          const title = titles.get(comment.sectionKey) ?? comment.sectionKey;
          return (
            <li key={i} className="rounded-lg border bg-card p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onGoTo(comment.sectionKey)}
                  className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:underline"
                >
                  {`Go to ${title}`}
                </button>
                <Byline comment={comment} />
              </div>
              <p className="mt-1 whitespace-pre-line break-words text-sm">{comment.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function PinnedComments({ comments }: { comments: readonly ReportComment[] }) {
  if (comments.length === 0) return null;
  return (
    <div className="space-y-2" data-testid="dept-report-section-comments">
      {comments.map((comment, i) => (
        <div key={i} role="note" className="rounded-lg border-l-4 border-l-destructive bg-destructive/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Reviewer asked</p>
          <p className="mt-1 whitespace-pre-line break-words text-sm">{comment.body}</p>
          <Byline comment={comment} />
        </div>
      ))}
    </div>
  );
}
