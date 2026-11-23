/**
 * Live preview of the totals post (WA-3, US-23): the server renders the
 * unsaved settings with real data (`previewTotalsPost`); asked again once the
 * admin stops typing. Shown like a WhatsApp message, *bold* in bold.
 */

"use client";

import { useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  PREVIEW_TOTALS_POST,
  type PreviewTotalsPostData,
  type PreviewTotalsPostVars,
} from "@/lib/graphql/whatsapp-posts";
import { whatsappSegments } from "@/lib/whatsapp-posts/format";
import type { CampaignPostSettingsInput } from "@/lib/whatsapp-posts/types";

export const PREVIEW_DELAY_MS = 600;

export function WhatsAppBubble({ text }: { text: string }) {
  return (
    <div
      data-testid="totals-preview"
      aria-label="Preview of the WhatsApp post"
      className="max-h-[32rem] overflow-auto rounded-2xl rounded-tl-sm border border-success/25 bg-success/10 p-3 font-mono text-[13px] leading-relaxed break-words text-foreground shadow-xs"
    >
      {text.split("\n").map((line, i) =>
        line ? (
          <div key={i} className="whitespace-pre-wrap">
            {whatsappSegments(line).map((seg, j) =>
              seg.bold ? <strong key={j}>{seg.text}</strong> : seg.italic ? <em key={j}>{seg.text}</em> : <span key={j}>{seg.text}</span>,
            )}
          </div>
        ) : (
          <div key={i} aria-hidden className="h-[1.6em]" />
        ),
      )}
    </div>
  );
}

interface PostPreviewProps {
  campaignId: string | null;
  /** null: the settings are not valid yet. */
  input: CampaignPostSettingsInput | null;
  emptyText?: string;
  delayMs?: number;
}

type PreviewState = { text: string | null; error: string | null; loading: boolean };

export function PostPreview({ campaignId, input, emptyText, delayMs = PREVIEW_DELAY_MS }: PostPreviewProps) {
  const client = useApolloClient();
  const [state, setState] = useState<PreviewState>({ text: null, error: null, loading: false });
  const key = campaignId && input ? JSON.stringify([campaignId, input]) : null;

  useEffect(() => {
    if (!key) return;
    const [id, variablesInput] = JSON.parse(key) as [string, CampaignPostSettingsInput];
    let current = true;
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, loading: true }));
      client
        .query<PreviewTotalsPostData, PreviewTotalsPostVars>({
          query: PREVIEW_TOTALS_POST,
          variables: { campaignId: id, input: variablesInput },
          fetchPolicy: "no-cache",
        })
        .then(({ data }) => {
          if (current) setState({ text: data?.previewTotalsPost.text ?? "", error: null, loading: false });
        })
        .catch((e: unknown) => {
          if (current) setState((s) => ({ ...s, error: e instanceof Error ? e.message : "unknown error", loading: false }));
        });
    }, delayMs);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [client, key, delayMs]);

  let body: React.ReactNode;
  if (!campaignId) {
    body = <p className="text-sm text-muted-foreground">{emptyText ?? "No campaign to preview with."}</p>;
  } else if (!input) {
    body = <p className="text-sm text-muted-foreground">Fix the settings to see the preview.</p>;
  } else if (state.error) {
    body = <p className="text-sm text-destructive">Could not load the preview: {state.error}</p>;
  } else if (state.text === null) {
    body = <Skeleton className="h-48 w-full" />;
  } else {
    body = <WhatsAppBubble text={state.text} />;
  }

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Preview</p>
        {state.loading && key ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Updating…
          </span>
        ) : null}
      </div>
      {body}
      <p className="text-xs text-muted-foreground">Rendered by the server with today&apos;s real gifts. Nothing is sent.</p>
    </div>
  );
}
