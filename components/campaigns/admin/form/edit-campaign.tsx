/**
 * Edit a campaign from its Overview tab (Fundraising S1, ticket 1.11).
 * Reuses the create form, pre-filled; saves with updateCampaign.
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";

import {
  UPDATE_CAMPAIGN,
  type UpdateCampaignData,
  type UpdateCampaignVars,
} from "@/lib/graphql/fundraising/campaigns";
import type { Campaign, CampaignInput } from "@/lib/types/fundraising";

import { countingIsOnForm } from "../counting/counting-mode";
import { CampaignForm } from "./campaign-form";
import { campaignToFormValues } from "./campaign-form-schema";

const FAILED = "Could not save the changes";

interface EditCampaignProps {
  campaign: Campaign;
  onSaved: () => void;
  onCancel: () => void;
}

export function EditCampaign({ campaign, onSaved, onCancel }: EditCampaignProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [updateCampaign, { loading }] = useMutation<UpdateCampaignData, UpdateCampaignVars>(UPDATE_CAMPAIGN);

  const save = async (input: CampaignInput) => {
    setServerError(null);
    try {
      const { data } = await updateCampaign({ variables: { id: campaign.id, input } });
      const result = data?.updateCampaign;
      if (result?.success) {
        toast.success(result.message || "Campaign updated");
        onSaved();
        return;
      }
      const message = result?.message || FAILED;
      setServerError(message);
      toast.error(message);
    } catch (err) {
      const message = err instanceof Error ? err.message : FAILED;
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <CampaignForm
      defaultValues={campaignToFormValues(campaign)}
      submitLabel="Save changes"
      submitting={loading}
      serverError={serverError}
      onSubmit={save}
      onCancel={onCancel}
      countingEditable={countingIsOnForm(campaign.status)}
    />
  );
}
