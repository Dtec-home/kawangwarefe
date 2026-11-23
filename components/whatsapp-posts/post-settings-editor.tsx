/**
 * The totals-post editor shared by the church default screen and each
 * campaign's "WhatsApp posts" tab (WA-3, US-22/US-23, E3/E8).
 *
 * Controlled: the screen owns the settings and decides what saving means
 * (church: every field; campaign: the fields it changed). The editor checks
 * them the way the server does, shows a live server-rendered preview, and
 * runs Save / "Send a test to the group now".
 */

"use client";

import { useState, type ReactNode } from "react";
import { AlertCircle, Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { scheduleSummary } from "@/lib/whatsapp-posts/schedule";
import { hasErrors, validateSettings } from "@/lib/whatsapp-posts/validation";
import type { CampaignPostSettingsInput, PostSettings, SettingField } from "@/lib/whatsapp-posts/types";

import type { FieldHintValue } from "./field-hint";
import { LayoutSection } from "./layout-section";
import { PostPreview } from "./post-preview";
import { ScheduleSection } from "./schedule-section";

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface PostSettingsEditorProps {
  value: PostSettings;
  onChange: (next: PostSettings, field: SettingField) => void;
  hints?: Partial<Record<SettingField, FieldHintValue>>;
  /** Hide the schedule and layout (e.g. a campaign following the church); `children` shows instead. */
  hideSettings?: boolean;
  children?: ReactNode;
  /** Shown above the preview (e.g. which campaign to preview with). */
  previewToolbar?: ReactNode;
  previewCampaignId: string | null;
  /** What `previewTotalsPost` gets for these settings; the editor sends nothing while they are invalid. */
  previewInput: CampaignPostSettingsInput | null;
  previewEmptyText?: string;
  previewDelayMs?: number;
  onSave: () => Promise<ActionResult>;
  /** Unsaved changes on screen. */
  dirty?: boolean;
  /** Campaign screens only. */
  onSendTest?: () => Promise<ActionResult>;
  sendTestBlockedReason?: string | null;
}

const TEST_LIMIT = "One test can go to the group every 10 minutes for each campaign.";

export function PostSettingsEditor({
  value, onChange, hints, hideSettings, children, previewToolbar, previewCampaignId, previewInput,
  previewEmptyText, previewDelayMs, onSave, dirty, onSendTest, sendTestBlockedReason,
}: PostSettingsEditorProps) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testRefusal, setTestRefusal] = useState<string | null>(null);
  const errors = hideSettings ? {} : validateSettings(value);
  const invalid = hasErrors(errors);

  const set = <K extends SettingField>(field: K, next: PostSettings[K]) => {
    setSaveError(null);
    onChange({ ...value, [field]: next }, field);
  };

  const save = async () => {
    if (invalid) {
      toast.error("Fix the highlighted settings first.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const result = await onSave();
      if (result.success) toast.success(result.message || "Saved");
      else {
        setSaveError(result.message || "Could not save the settings");
        toast.error(result.message || "Could not save the settings");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save the settings";
      setSaveError(message);
      toast.error(message);
    }
    setSaving(false);
  };

  const sendTest = async () => {
    if (!onSendTest) return;
    setTesting(true);
    setTestRefusal(null);
    try {
      const result = await onSendTest();
      if (result.success) toast.success(result.message || "Test sent");
      else {
        setTestRefusal(result.message || "The test could not be sent");
        toast.error(result.message || "The test could not be sent");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "The test could not be sent";
      setTestRefusal(message);
      toast.error(message);
    }
    setTesting(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
      <div className="min-w-0 space-y-4">
        {hideSettings ? (
          children
        ) : (
          <>
            {children}
            <Card>
              <CardHeader>
                <CardTitle>When it posts</CardTitle>
                <CardDescription data-testid="schedule-summary">{scheduleSummary(value)}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleSection value={value} errors={errors} hints={hints} set={set} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>What it says</CardTitle>
                <CardDescription>Switch blocks on or off and put them in order. Your intro and closing words go where their blocks are.</CardDescription>
              </CardHeader>
              <CardContent>
                <LayoutSection value={value} errors={errors} hints={hints} set={set} />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="min-w-0 lg:sticky lg:top-4">
        <CardContent className="space-y-4">
          {previewToolbar}
          <PostPreview campaignId={previewCampaignId} input={invalid ? null : previewInput}
            emptyText={previewEmptyText} delayMs={previewDelayMs} />
          {saveError ? (
            <Alert variant="destructive" role="alert">
              <AlertCircle />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
            {onSendTest ? (
              <Button type="button" variant="outline" disabled={testing || !!sendTestBlockedReason} onClick={() => void sendTest()}>
                {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send a test to the group now
              </Button>
            ) : null}
          </div>
          {onSendTest ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              {sendTestBlockedReason ? <p>{sendTestBlockedReason}</p> : null}
              {dirty && !sendTestBlockedReason ? <p>You have unsaved changes: the test uses the saved settings.</p> : null}
              {testRefusal ? (
                <p data-testid="send-test-refused" className="text-destructive">
                  {testRefusal} {TEST_LIMIT}
                </p>
              ) : (
                <p>{TEST_LIMIT}</p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
