"use client";

/**
 * QuickSendComposer — single-screen send: write message, pick receivers, send.
 *
 * No template required, no multi-step wizard.  The message is dispatched
 * via the same Celery pipeline as a regular campaign; nothing is saved as a
 * reusable template.
 */

import { useRef, useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import { Send, Search, X, Phone } from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MEMBER_SEARCH, LAUNCH_QUICK_CAMPAIGN } from "@/lib/graphql/messaging-mutations";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemberOpt {
  id: string;
  fullName: string;
  phoneNumber: string;
  memberNumber: string;
}

interface LaunchResult {
  launchQuickCampaign: {
    success: boolean;
    message: string;
    campaign: { id: string; status: string; recipientCount: number } | null;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MAX_CHARS = 480;
const PHONE_RE = /^(\+?254|0)[17][0-9]{8}$/;

function parsePhones(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(s => PHONE_RE.test(s) && !seen.has(s) && seen.add(s));
}

// ─── MemberSearch ─────────────────────────────────────────────────────────────

function MemberSearch({
  selected,
  onChange,
}: {
  selected: MemberOpt[];
  onChange: (members: MemberOpt[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [search, { data, loading }] = useLazyQuery<{ memberSearch: MemberOpt[] }>(MEMBER_SEARCH);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounce.current) clearTimeout(debounce.current);
    if (val.length < 2) { setOpen(false); return; }
    debounce.current = setTimeout(() => {
      search({ variables: { query: val, limit: 10 } });
      setOpen(true);
    }, 300);
  };

  const pick = (m: MemberOpt) => {
    if (!selected.find(s => s.id === m.id)) onChange([...selected, m]);
    setQuery(""); setOpen(false);
  };

  const remove = (id: string) => onChange(selected.filter(m => m.id !== id));
  const results = data?.memberSearch ?? [];

  return (
    <div className="space-y-2">
      <Label className="text-sm">Search members</Label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map(m => (
            <Badge key={m.id} variant="secondary" className="gap-1 text-xs">
              {m.fullName}
              <span className="text-muted-foreground ml-0.5">({m.phoneNumber})</span>
              <button
                onClick={() => remove(m.id)}
                className="ml-0.5 hover:text-destructive"
                aria-label={`Remove ${m.fullName}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone…"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="pl-8"
        />
        {open && results.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md text-sm">
            {results.map(m => (
              <li key={m.id}>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-muted flex justify-between"
                  onMouseDown={() => pick(m)}
                >
                  <span>{m.fullName}</span>
                  <span className="text-muted-foreground text-xs">{m.phoneNumber}</span>
                </button>
              </li>
            ))}
            {loading && <li className="px-3 py-2 text-muted-foreground text-xs">Searching…</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── QuickSendComposer ────────────────────────────────────────────────────────

interface QuickSendComposerProps {
  onSent?: () => void;
}

export function QuickSendComposer({ onSent }: QuickSendComposerProps) {
  const [body, setBody] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<MemberOpt[]>([]);
  const [phonesRaw, setPhonesRaw] = useState("");

  const extraPhones = parsePhones(phonesRaw);
  const totalRecipients = selectedMembers.length + extraPhones.length;
  const charsLeft = MAX_CHARS - body.length;

  const [launch, { loading }] = useMutation<LaunchResult>(LAUNCH_QUICK_CAMPAIGN, {
    onCompleted: (data) => {
      const res = data.launchQuickCampaign;
      if (res.success) {
        toast.success(res.message || `Sent to ${res.campaign?.recipientCount ?? 0} recipient(s)`);
        setBody("");
        setSelectedMembers([]);
        setPhonesRaw("");
        onSent?.();
      } else {
        toast.error(res.message || "Send failed");
      }
    },
    onError: (err) => toast.error(err.message || "Send failed"),
  });

  const handleSend = () => {
    const filter: Record<string, unknown> = {};
    if (selectedMembers.length) filter.member_ids = selectedMembers.map(m => Number(m.id));
    if (extraPhones.length) filter.extra_phone_numbers = extraPhones;

    launch({
      variables: {
        body: body.trim(),
        recipientFilterJson: JSON.stringify(filter),
      },
    });
  };

  const canSend = body.trim().length > 0 && totalRecipients > 0 && charsLeft >= 0;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Message body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="qs-body">Message</Label>
          <span className={`text-xs ${charsLeft < 0 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
            {body.length} / {MAX_CHARS}
          </span>
        </div>
        <Textarea
          id="qs-body"
          placeholder="Type your message here…"
          rows={4}
          value={body}
          onChange={e => setBody(e.target.value)}
          className="resize-none"
        />
        {charsLeft < 0 && (
          <p className="text-xs text-red-600">Message is too long by {Math.abs(charsLeft)} character{Math.abs(charsLeft) !== 1 ? "s" : ""}.</p>
        )}
      </div>

      {/* Recipients */}
      <div className="space-y-4 rounded-md border p-4">
        <p className="text-sm font-medium">Send to</p>

        <MemberSearch selected={selectedMembers} onChange={setSelectedMembers} />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 border-t" />
          <span>OR type phone numbers directly</span>
          <div className="flex-1 border-t" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-sm">Phone numbers</Label>
          </div>
          <Textarea
            placeholder={"One per line or comma-separated\ne.g. 0712345678, 0723456789"}
            rows={3}
            value={phonesRaw}
            onChange={e => setPhonesRaw(e.target.value)}
            className="resize-none text-sm font-mono"
          />
          {phonesRaw.trim() && (
            <p className="text-xs">
              {extraPhones.length > 0 ? (
                <span className="text-green-700 dark:text-green-400 font-medium">
                  {extraPhones.length} valid number{extraPhones.length !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-amber-600">No valid numbers found</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Recipient summary + send */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="text-sm text-muted-foreground">
          {totalRecipients > 0 ? (
            <>
              Ready to send to{" "}
              <span className="font-medium text-foreground">{totalRecipients}</span> recipient{totalRecipients !== 1 ? "s" : ""}
            </>
          ) : (
            "Add at least one recipient to send"
          )}
        </p>
        <Button onClick={handleSend} disabled={!canSend || loading} className="shrink-0">
          <Send className="h-4 w-4 mr-2" />
          {loading ? "Sending…" : `Send${totalRecipients > 0 ? ` (${totalRecipients})` : ""}`}
        </Button>
      </div>
    </div>
  );
}
