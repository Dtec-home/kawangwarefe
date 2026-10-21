/**
 * The campaigns and departments a pledge register may be filtered by, or a
 * pledge card recorded for (Fundraising S3, lane S3-UI-F).
 *
 * Staff see everything. A category admin who is not staff sees only their own
 * departments and those departments' campaigns; the backend enforces the same.
 */

"use client";

import { useQuery } from "@apollo/client/react";

import { useCampaignDepartments, type DepartmentOption } from "@/components/campaigns/admin/form/use-campaign-departments";
import {
  GET_CAMPAIGNS,
  type CampaignListItem,
  type CampaignsData,
  type CampaignsVars,
} from "@/lib/graphql/fundraising/campaigns";
import { useUserRole } from "@/lib/hooks/use-user-role";

export type { DepartmentOption };

const ALL_CAMPAIGNS: CampaignsVars = { status: null, search: null };

export function usePledgeScopeOptions() {
  const { isStaff, isCategoryAdmin, adminCategoryIds } = useUserRole();
  const { departments, loading: departmentsLoading } = useCampaignDepartments();
  const { data, loading: campaignsLoading } = useQuery<CampaignsData, CampaignsVars>(GET_CAMPAIGNS, {
    variables: ALL_CAMPAIGNS,
  });
  const all = data?.campaigns ?? [];
  const own = new Set(adminCategoryIds.map(String));
  const campaigns: CampaignListItem[] =
    isCategoryAdmin && !isStaff ? all.filter((c) => own.has(String(c.categoryId))) : all;
  return { departments, campaigns, loading: departmentsLoading || campaignsLoading };
}
