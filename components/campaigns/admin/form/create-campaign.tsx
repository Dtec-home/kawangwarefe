/**
 * Create a campaign as a draft, then open its page (Fundraising S1, ticket 1.10).
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";

import { campaignHref } from "@/components/campaigns/admin/list/campaign-list";
import {
  CREATE_CAMPAIGN,
  type CreateCampaignData,
  type CreateCampaignVars,
} from "@/lib/graphql/fundraising/campaigns";
import type { CampaignInput } from "@/lib/types/fundraising";

import { CampaignForm } from "./campaign-form";

const FAILED = "Could not save the campaign";

export function CreateCampaign() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [createCampaign, { loading }] = useMutation<CreateCampaignData, CreateCampaignVars>(CREATE_CAMPAIGN, {
    refetchQueries: ["GetCampaigns"],
  });

  const save = async (input: CampaignInput) => {
    setServerError(null);
    try {
      const { data } = await createCampaign({ variables: { input } });
      const result = data?.createCampaign;
      if (result?.success && result.campaign) {
        toast.success(result.message || "Campaign saved as a draft");
        router.push(campaignHref(result.campaign.id));
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
      submitLabel="Save as draft"
      submitting={loading}
      serverError={serverError}
      onSubmit={save}
      onCancel={() => router.push("/admin/campaigns")}
    />
  );
}
