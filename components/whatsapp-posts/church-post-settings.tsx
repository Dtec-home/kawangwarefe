/**
 * The church-wide totals-post settings (WA-3, US-22/US-23, E3/E8) and the
 * church WhatsApp group used for announcements (E4). Admins only; every
 * campaign follows these unless its own "WhatsApp posts" tab overrides them.
 */

"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { AlertCircle, RotateCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { GET_CAMPAIGNS, type CampaignsData, type CampaignsVars } from "@/lib/graphql/fundraising/campaigns";
import {
  GET_WHATSAPP_GROUPS,
  GET_WHATSAPP_POST_SETTINGS,
  UPDATE_WHATSAPP_POST_SETTINGS,
  type UpdateWhatsappPostSettingsData,
  type UpdateWhatsappPostSettingsVars,
  type WhatsappGroupsData,
  type WhatsappPostSettingsData,
} from "@/lib/graphql/whatsapp-posts";
import { toChurchInput, toFullOverrideInput, toSettings } from "@/lib/whatsapp-posts/inputs";
import type { ChurchPostSettings, PostSettings } from "@/lib/whatsapp-posts/types";

import { PostSettingsEditor, type ActionResult } from "./post-settings-editor";
import { SELECT_CLASS } from "./schedule-section";

interface Draft {
  settings: PostSettings;
  groupId: string;
}

const fromServer = (s: ChurchPostSettings): Draft => ({ settings: toSettings(s), groupId: s.churchWhatsappGroupId });

function GroupPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { data, error, loading, refetch } = useQuery<WhatsappGroupsData>(GET_WHATSAPP_GROUPS, {
    notifyOnNetworkStatusChange: true,
  });
  const groups = data?.whatsappGroups ?? [];
  const unlisted = value && !groups.some((g) => g.id === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="church-whatsapp-group">Church WhatsApp group</Label>
      <select id="church-whatsapp-group" className={SELECT_CLASS} value={value} disabled={loading && !data}
        onChange={(e) => onChange(e.target.value)}>
        <option value="">No group (announcements are not posted)</option>
        {unlisted ? <option value={value}>Current group ({value})</option> : null}
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>Could not load the WhatsApp groups: {error.message}</span>
            <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void refetch().catch(() => undefined)}>
              <RotateCw className="size-4" /> Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <p className="text-xs text-muted-foreground">The groups the church WhatsApp number is in. Announcements are posted here.</p>
      )}
    </div>
  );
}

export function ChurchPostSettingsScreen() {
  const { data, loading, error } = useQuery<WhatsappPostSettingsData>(GET_WHATSAPP_POST_SETTINGS);
  const { data: campaignsData } = useQuery<CampaignsData, CampaignsVars>(GET_CAMPAIGNS, {
    variables: { status: null, search: null },
  });
  const [update] = useMutation<UpdateWhatsappPostSettingsData, UpdateWhatsappPostSettingsVars>(UPDATE_WHATSAPP_POST_SETTINGS);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [previewWith, setPreviewWith] = useState<string | null>(null);

  // The server's answer seeds the screen once; later answers come from Save.
  const server = data?.whatsappPostSettings;
  const base = saved ?? (server ? fromServer(server) : null);
  const current = draft ?? base;

  const campaigns = useMemo(() => campaignsData?.campaigns ?? [], [campaignsData]);
  const defaultCampaign = campaigns.find((c) => c.status === "ACTIVE") ?? campaigns[0];
  const campaignId = previewWith ?? defaultCampaign?.id ?? null;

  if (loading && !data) return <Skeleton className="h-96 w-full" />;
  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>Could not load the WhatsApp post settings: {error.message}</AlertDescription>
      </Alert>
    );
  }
  if (!current || !base) return null;

  const dirty = JSON.stringify(current) !== JSON.stringify(base);

  const save = async (): Promise<ActionResult> => {
    const { data: result } = await update({ variables: { input: toChurchInput(current.settings, current.groupId) } });
    const answer = result?.updateWhatsappPostSettings;
    if (!answer) return { success: false, message: "Could not save the settings" };
    if (answer.success && answer.settings) {
      setSaved(fromServer(answer.settings));
      setDraft(null);
    }
    return answer;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp posts"
        description="When the totals post goes to each campaign's WhatsApp group and what it says. Every campaign follows these unless it changes them on its own WhatsApp posts tab."
      />
      <PostSettingsEditor
        value={current.settings}
        onChange={(settings) => setDraft({ ...current, settings })}
        previewCampaignId={campaignId}
        previewInput={toFullOverrideInput(current.settings)}
        previewEmptyText="Create a campaign to see a preview."
        previewToolbar={
          campaigns.length ? (
            <div className="space-y-1">
              <Label htmlFor="preview-campaign">Preview with</Label>
              <select id="preview-campaign" className={SELECT_CLASS} value={campaignId ?? ""}
                onChange={(e) => setPreviewWith(e.target.value)}>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null
        }
        onSave={save}
        dirty={dirty}
      >
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Published announcements are posted once to the church group.</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupPicker value={current.groupId} onChange={(groupId) => setDraft({ ...current, groupId })} />
          </CardContent>
        </Card>
      </PostSettingsEditor>
    </div>
  );
}
