/**
 * Departments (and their purposes) a campaign may be raised for
 * (Fundraising S1, ticket 1.10).
 *
 * Staff see every active department. A category admin who is not staff sees
 * only their own departments (Decision 2); the backend re-checks this.
 */

"use client";

import { useQuery } from "@apollo/client/react";

import { GET_CONTRIBUTION_CATEGORIES, GET_DEPARTMENT_PURPOSES } from "@/lib/graphql/queries";
import { useUserRole } from "@/lib/hooks/use-user-role";

export interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

interface CategoriesData {
  contributionCategories: DepartmentOption[];
}

interface PurposesData {
  departmentPurposes: { id: string; name: string; isActive: boolean }[];
}

export function useCampaignDepartments() {
  const { isStaff, isCategoryAdmin, adminCategoryIds } = useUserRole();
  const { data, loading } = useQuery<CategoriesData>(GET_CONTRIBUTION_CATEGORIES);
  const all = data?.contributionCategories ?? [];
  const ownOnly = isCategoryAdmin && !isStaff;
  const departments = ownOnly ? all.filter((c) => adminCategoryIds.map(String).includes(String(c.id))) : all;
  return { departments, loading };
}

export function useDepartmentPurposes(categoryId: string) {
  const { data } = useQuery<PurposesData>(GET_DEPARTMENT_PURPOSES, {
    variables: { categoryId, isActive: true },
    skip: !categoryId,
  });
  return categoryId ? (data?.departmentPurposes ?? []) : [];
}
