/**
 * useCategoryAdmin Hook
 *
 * Hook for checking and managing category admin permissions
 */

"use client";

import { useQuery } from "@apollo/client/react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  GET_MY_CATEGORY_ADMIN_ROLES,
  CHECK_CATEGORY_ADMIN_ACCESS,
} from "@/lib/graphql/category-admin-queries";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface CategoryAdminRole {
  id: string;
  category: Category;
  assignedAt: string;
  isActive: boolean;
}

interface MyCategoryAdminRolesData {
  myCategoryAdminRoles: CategoryAdminRole[];
}

interface CategoryAdminAccessData {
  isCategoryAdmin: boolean;
}

/**
 * Hook to get all category admin roles for the current user
 */
export function useMyCategoryAdminRoles() {
  const { user } = useAuth();

  const { data, loading, error, refetch } = useQuery<MyCategoryAdminRolesData>(
    GET_MY_CATEGORY_ADMIN_ROLES,
    {
      variables: {
        memberId: user?.memberId?.toString(),
      },
      skip: !user?.memberId,
    }
  );

  return {
    roles: data?.myCategoryAdminRoles || [],
    loading,
    error,
    refetch,
    isAnyCategoryAdmin: (data?.myCategoryAdminRoles?.length || 0) > 0,
  };
}

/**
 * Hook to check if current user is admin for a specific category
 */
export function useCategoryAdminAccess(categoryId: string | undefined) {
  const { user } = useAuth();

  const { data, loading, error } = useQuery<CategoryAdminAccessData>(
    CHECK_CATEGORY_ADMIN_ACCESS,
    {
      variables: {
        categoryId,
        memberId: user?.memberId?.toString(),
      },
      skip: !user?.memberId || !categoryId,
    }
  );

  return {
    isAdmin: data?.isCategoryAdmin || false,
    loading,
    error,
  };
}

/**
 * Hook to get category IDs where user is admin
 */
export function useCategoryAdminIds() {
  const { roles, loading, error } = useMyCategoryAdminRoles();

  return {
    categoryIds: roles.map((role) => role.category.id),
    categories: roles.map((role) => role.category),
    loading,
    error,
  };
}
