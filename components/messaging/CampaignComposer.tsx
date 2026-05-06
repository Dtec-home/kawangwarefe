"use client";

/**
 * CampaignComposer — 3-step stepper: Audience → Message → Preview & Send.
 * Single responsibility: campaign creation flow only.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import toast from "react-hot-toast";
import { Eye, Send, ChevronLeft, ChevronRight } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AudienceBuilder } from "@/components/messaging/AudienceBuilder";
import { useAudienceFilter } from "@/lib/hooks/use-audience-filter";
import {
  GET_MESSAGE_TEMPLATES,
  PREVIEW_CAMPAIGN,
  LAUNCH_CAMPAIGN,
} from "@/lib/graphql/messaging-mutations";

interface Template { id: string; name: string; body: string; isActive: boolean }
interface PreviewResult { recipientCount: number; skippedCount: number; sampleRendered: string[] }

const STEPS = ["Audience", "Message", "Preview & Send"] as const;
type Step = 0 | 1 | 2;

export function CampaignComposer({ onLaunched }: { onLaunched?: () => void }) {
  const { data: tplData } = useQuery<{ messageTemplates: Template[] }>(
    GET_MESSAGE_TEMPLATES
  );
  const templates = (tplData?.messageTemplates ?? []).filter(t => t.isActive);

  const audience = useAudienceFilter();
  const [step, setStep] = useState<Step>(0);
  const [templateId, setTemplateId] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);

  const [previewCampaign, { loading: previewing }] =
    useMutation<{ previewCampaign: PreviewResult }>(PREVIEW_CAMPAIGN);
  const [launchCampaign, { loading: launching }] = useMutation<{
    launchCampaign: { success: boolean; message: string; campaign: { id: string } | null };
  }>(LAUNCH_CAMPAIGN);

  const canAdvanceStep0 = true; // audience step is always passable (empty = all active members)
  const canAdvanceStep1 = !!templateId;

  const goNext = async () => {
    if (step === 1) {
      // Preview before showing the final confirmation step
      try {
        const { data } = await previewCampaign({
          variables: {
            templateId,
            recipientFilterJson: audience.toJson(),
            sampleSize: 3,
          },
        });
        if (data?.previewCampaign) setPreview(data.previewCampaign);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Preview failed");
        return;
      }
    }
    setStep((step + 1) as Step);
  };

  const handleLaunch = async () => {
    try {
      const { data } = await launchCampaign({
        variables: {
          templateId,
          recipientFilterJson: audience.toJson(),
        },
      });
      const res = data?.launchCampaign;
      if (res?.success) {
        toast.success(res.message);
        // Reset composer
        setStep(0);
        setTemplateId("");
        audience.reset();
        setPreview(null);
        onLaunched?.();
      } else {
        toast.error(res?.message || "Launch failed");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Launch failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <ol className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-sm ${i === step ? "font-medium" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
            )}
          </li>
        ))}
      </ol>

      {/* Step 0 — Audience */}
      {step === 0 && (
        <AudienceBuilder
          filter={audience.filter}
          onDepartmentIdsChange={audience.setDepartmentIds}
          onGroupIdsChange={audience.setGroupIds}
          onRolesChange={audience.setRoles}
          onMemberIdsChange={audience.setMemberIds}
          onIncludeGuestsChange={audience.setIncludeGuests}
          onIncludeMinorsChange={audience.setIncludeMinors}
        />
      )}

      {/* Step 1 — Message */}
      {step === 1 && (
        <div className="space-y-3">
          <Label>Select Template</Label>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active templates. Create one in the Templates tab first.
            </p>
          ) : (
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {templateId && (
            <div className="rounded-md bg-muted p-3 text-sm font-mono whitespace-pre-wrap text-muted-foreground">
              {templates.find(t => t.id === templateId)?.body}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Preview & Send */}
      {step === 2 && preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-base px-3 py-1">
              {preview.recipientCount} recipient(s)
            </Badge>
            {preview.skippedCount > 0 && (
              <Badge variant="secondary">
                {preview.skippedCount} skipped (no phone)
              </Badge>
            )}
          </div>

          {preview.sampleRendered.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Sample messages
              </p>
              <ul className="space-y-1">
                {preview.sampleRendered.map((s, i) => (
                  <li
                    key={i}
                    className="font-mono text-xs bg-muted rounded p-2 whitespace-pre-wrap"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.recipientCount === 0 && (
            <Alert>
              <AlertDescription>
                No recipients match the selected audience. Go back and adjust the filters.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep((step - 1) as Step)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        )}
        {step < 2 && (
          <Button
            onClick={goNext}
            disabled={
              (step === 0 && !canAdvanceStep0) ||
              (step === 1 && (!canAdvanceStep1 || previewing))
            }
          >
            {previewing ? "Loading preview…" : "Next"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
        {step === 2 && (
          <Button
            onClick={handleLaunch}
            disabled={launching || !preview || preview.recipientCount === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            {launching ? "Sending…" : `Send to ${preview?.recipientCount ?? 0}`}
          </Button>
        )}
      </div>
    </div>
  );
}
