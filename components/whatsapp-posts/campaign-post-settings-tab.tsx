/**
 * A campaign's "WhatsApp posts" tab (WA-3 US-22/US-23, WA-2 E2).
 *
 * "Use the church settings" follows the church default wholesale. Off, the
 * editor shows the campaign's settings: a field the campaign changed says so
 * (with a way back), the others show the church value they follow ("Church:
 * …"); saving sends the changed fields and null for the rest. "Tag givers in
 * group posts" is the campaign's `whatsappMentionsEnabled`.
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { campaignToFormValues, toCampaignInput as toCampaignFormInput } from "@/components/campaigns/admin/form/campaign-form-schema";
import {
  GET_CAMPAIGN,
  UPDATE_CAMPAIGN,
  type CampaignData,
  type CampaignVars,
  type UpdateCampaignData,
  type UpdateCampaignVars,
} from "@/lib/graphql/fundraising/campaigns";
import {
  GET_CAMPAIGN_POST_SETTINGS,
  GET_WHATSAPP_POST_SETTINGS,
  SEND_TEST_TOTALS_POST,
  UPDATE_CAMPAIGN_POST_SETTINGS,
  type CampaignPostSettingsData,
  type CampaignPostSettingsVars,
  type SendTestTotalsPostData,
  type UpdateCampaignPostSettingsData,
  type UpdateCampaignPostSettingsVars,
  type WhatsappPostSettingsData,
} from "@/lib/graphql/whatsapp-posts";
import { useUserRole } from "@/lib/hooks/use-user-role";
import {
  campaignBaseline,
  campaignDraft,
  describeField,
  overriddenFields,
  toCampaignInput,
  toSettings,
} from "@/lib/whatsapp-posts/inputs";
import { scheduleSummary } from "@/lib/whatsapp-posts/schedule";
import {
  SETTING_FIELDS,
  type CampaignPostSettings,
  type PostSettings,
  type SettingField,
} from "@/lib/whatsapp-posts/types";
import type { Campaign } from "@/lib/types/fundraising";

import type { FieldHintValue } from "./field-hint";
import { PostSettingsEditor, type ActionResult } from "./post-settings-editor";

interface Draft {
  useChurch: boolean;
  settings: PostSettings;
  overridden: Set<SettingField>;
}

const fromServer = (o: CampaignPostSettings): Draft => ({
  useChurch: o.useChurchDefault,
  settings: campaignDraft(o),
  overridden: new Set(overriddenFields(o)),
});

const snapshot = (d: Draft) => JSON.stringify([d.useChurch, d.settings, [...d.overridden].sort()]);

function isComplete(s: Partial<PostSettings>): s is PostSettings {
  return SETTING_FIELDS.every((f) => s[f] !== undefined);
}

function SwitchRow({ id, label, hint, checked, disabled, onChange }: {
  id: string; label: string; hint: string; checked: boolean; disabled?: boolean; onChange: (on: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

function TaggingSwitch({ campaign }: { campaign: Campaign }) {
  const [update, { loading }] = useMutation<UpdateCampaignData, UpdateCampaignVars>(UPDATE_CAMPAIGN);
  const enabled = campaign.whatsappMentionsEnabled ?? true;

  const change = async (on: boolean) => {
    // updateCampaign takes the whole campaign; send it as the edit form would
    // (counting left out, so it is kept) with only the switch changed.
    const input = { ...toCampaignFormInput(campaignToFormValues(campaign), { countingEditable: false }), whatsappMentionsEnabled: on };
    try {
      const { data } = await update({ variables: { id: campaign.id, input } });
      const answer = data?.updateCampaign;
      if (answer?.success) {
        toast.success(on ? "Givers who allow it will be tagged in this campaign’s posts." : "Givers will not be tagged in this campaign’s posts.");
      } else toast.error(answer?.message || "Could not change tagging");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change tagging");
    }
  };

  return (
    <SwitchRow
      id="campaign-whatsapp-mentions"
      label="Tag givers in group posts"
      hint="Givers who are in the group and allow it in their profile are tagged (@name), so they get a thank-you notification. Guests and unknown Pay Bill payers are named, never tagged."
      checked={enabled}
      disabled={loading || campaign.status === "CLOSED"}
      onChange={(on) => void change(on)}
    />
  );
}

export interface CampaignWhatsAppPostsTabProps {
  campaignId: string;
  previewDelayMs?: number;
}

export function CampaignWhatsAppPostsTab({ campaignId, previewDelayMs }: CampaignWhatsAppPostsTabProps) {
  const { isAdmin } = useUserRole();
  const { data: campaignData } = useQuery<CampaignData, CampaignVars>(GET_CAMPAIGN, {
    variables: { id: campaignId },
    skip: !campaignId,
  });
  const { data, loading, error } = useQuery<CampaignPostSettingsData, CampaignPostSettingsVars>(GET_CAMPAIGN_POST_SETTINGS, {
    variables: { campaignId },
    skip: !campaignId,
  });
  // An admin may read the church settings: they fill in "Church: …" for fields the campaign changed.
  const { data: churchData } = useQuery<WhatsappPostSettingsData>(GET_WHATSAPP_POST_SETTINGS, {
    skip: !isAdmin,
    errorPolicy: "ignore",
  });
  const [updateSettings] = useMutation<UpdateCampaignPostSettingsData, UpdateCampaignPostSettingsVars>(UPDATE_CAMPAIGN_POST_SETTINGS);
  const [sendTest] = useMutation<SendTestTotalsPostData>(SEND_TEST_TOTALS_POST);
  const [savedOverride, setSavedOverride] = useState<CampaignPostSettings | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const override = savedOverride ?? data?.campaignPostSettings ?? null;
  const campaign = campaignData?.campaign ?? null;

  if (loading && !data) return <Skeleton className="h-96 w-full" />;
  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>Could not load the WhatsApp post settings: {error.message}</AlertDescription>
      </Alert>
    );
  }
  if (!override) return null;

  const base = fromServer(override);
  const current = draft ?? base;
  const church = churchData?.whatsappPostSettings ? toSettings(churchData.whatsappPostSettings) : undefined;
  const baseline = campaignBaseline(override, church);

  const resetField = (field: SettingField) => {
    const overridden = new Set(current.overridden);
    overridden.delete(field);
    const known = baseline[field];
    setDraft({ ...current, overridden, settings: known !== undefined ? { ...current.settings, [field]: known } : current.settings });
  };

  const hints: Partial<Record<SettingField, FieldHintValue>> = {};
  for (const field of SETTING_FIELDS) {
    if (current.overridden.has(field)) hints[field] = { text: "Changed for this campaign", onReset: () => resetField(field) };
    else if (baseline[field] !== undefined) hints[field] = { text: `Church: ${describeField(field, baseline)}` };
    else hints[field] = { text: "Uses the church value once saved" };
  }

  const input = toCampaignInput(current.settings, current.overridden, current.useChurch);

  const save = async (): Promise<ActionResult> => {
    const { data: result } = await updateSettings({ variables: { campaignId, input } });
    const answer = result?.updateCampaignPostSettings;
    if (!answer) return { success: false, message: "Could not save the settings" };
    if (answer.success && answer.settings) {
      setSavedOverride(answer.settings);
      setDraft(null);
    }
    return answer;
  };

  const test = async (): Promise<ActionResult> => {
    const { data: result } = await sendTest({ variables: { campaignId } });
    return result?.sendTestTotalsPost ?? { success: false, message: "The test could not be sent" };
  };

  const blocked = campaign && !campaign.whatsappGroupId
    ? "Add the campaign’s WhatsApp group on the campaign form first."
    : !campaign
      ? "Loading the campaign…"
      : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Group posts</CardTitle>
          <CardDescription>The totals post to this campaign&apos;s WhatsApp group: when it goes and what it says.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SwitchRow
            id="campaign-use-church-posts"
            label="Use the church settings"
            hint="On: this campaign posts like every other (set by an admin under Admin → WhatsApp posts). Off: change them here."
            checked={current.useChurch}
            onChange={(on) => setDraft({ ...current, useChurch: on })}
          />
          {campaign ? <TaggingSwitch campaign={campaign} /> : null}
          {campaign && campaign.dailyTotalEnabled === false ? (
            <Alert>
              <Info />
              <AlertDescription>
                Totals posts are off for this campaign. Switch on “Daily total to the WhatsApp group” on the campaign form.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <PostSettingsEditor
        value={current.settings}
        onChange={(settings, field) => {
          const overridden = new Set(current.overridden);
          overridden.add(field);
          setDraft({ ...current, settings, overridden });
        }}
        hints={hints}
        hideSettings={current.useChurch}
        previewCampaignId={campaignId}
        previewInput={input}
        previewDelayMs={previewDelayMs}
        onSave={save}
        dirty={snapshot(current) !== snapshot(base)}
        onSendTest={test}
        sendTestBlockedReason={blocked}
      >
        {current.useChurch ? (
          <Card>
            <CardHeader>
              <CardTitle>Following the church settings</CardTitle>
              <CardDescription data-testid="church-schedule-summary">
                {isComplete(baseline) ? scheduleSummary(baseline) : "The church settings apply once you save."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </PostSettingsEditor>
    </div>
  );
}
