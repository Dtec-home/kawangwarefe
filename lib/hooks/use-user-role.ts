/**
 * useUserRole Hook
 *
 * Hook for getting current user's role and permissions
 * Used to determine navigation access and UI rendering
 */

"use client";

import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

const GET_CURRENT_USER_ROLE = gql`
  query GetCurrentUserRole {
    currentUserRole {
      isAuthenticated
      isStaff
      isCategoryAdmin
      isGroupAdmin
      isContentAdmin
      canSendBulkMessage
      adminCategoryIds
      adminGroupNames
      adminCategories {
        id
        name
        code
        description
      }
    }
  }
`;

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface UserRoleInfo {
  isAuthenticated: boolean;
  isStaff: boolean;
  isCategoryAdmin: boolean;
  isGroupAdmin: boolean;
  isContentAdmin: boolean;
  canSendBulkMessage: boolean;
  adminCategoryIds: string[];
  adminGroupNames: string[];
  adminCategories: Category[];
}

interface UserRoleData {
  currentUserRole: UserRoleInfo;
}

/**
 * Hook to get the current user's role and permissions
 */
export function useUserRole() {
  const { data, loading, error, refetch } = useQuery<UserRoleData>(
    GET_CURRENT_USER_ROLE,
    {
      fetchPolicy: "cache-first",
      errorPolicy: "ignore",
    }
  );

  const roleInfo = data?.currentUserRole;

  return {
    // Loading state
    loading,
    error,
    refetch,

    // Authentication
    isAuthenticated: roleInfo?.isAuthenticated ?? false,

    // Role flags
    isStaff: roleInfo?.isStaff ?? false,
    isCategoryAdmin: roleInfo?.isCategoryAdmin ?? false,
    isGroupAdmin: roleInfo?.isGroupAdmin ?? false,
    isContentAdmin: roleInfo?.isContentAdmin ?? false,
    canSendBulkMessage: roleInfo?.canSendBulkMessage ?? false,

    // Combined check: can access admin panel
    canAccessAdmin: (roleInfo?.isStaff || roleInfo?.isCategoryAdmin || roleInfo?.isGroupAdmin || roleInfo?.isContentAdmin) ?? false,

    // Can access content management
    canAccessContent: (roleInfo?.isStaff || roleInfo?.isContentAdmin) ?? false,

    // Full admin (can see everything)
    isFullAdmin: roleInfo?.isStaff ?? false,

    // Category admin specific data
    adminCategoryIds: roleInfo?.adminCategoryIds ?? [],
    adminGroupNames: roleInfo?.adminGroupNames ?? [],
    adminCategories: roleInfo?.adminCategories ?? [],

    // Helper: check if user can access a specific admin feature
    canAccessFeature: (feature: "members" | "reports" | "category-admins" | "categories" | "groups" | "contributions" | "overview" | "c2b-transactions" | "content" | "messaging" | "prayers") => {
      if (!roleInfo) return false;

      // Full staff can access everything
      if (roleInfo.isStaff) return true;

      // Messaging: staff + dept_admin + group_admin (canSendBulkMessage covers all)
      if (feature === "messaging") return roleInfo.canSendBulkMessage;

      // Content admins can access content
      if (roleInfo.isContentAdmin) {
        return feature === "content";
      }

      // Category admins can access overview, contributions, and scoped reports
      if (roleInfo.isCategoryAdmin) {
        return feature === "overview" || feature === "contributions" || feature === "reports";
      }

      // Group admins can access overview, their scoped contributions, and scoped reports
      if (roleInfo.isGroupAdmin) {
        return feature === "overview" || feature === "contributions" || feature === "reports";
      }

      return false;
    },

    // Raw data
    roleInfo,
  };
}

export type { UserRoleInfo, Category };
