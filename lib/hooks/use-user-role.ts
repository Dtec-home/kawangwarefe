/**
 * useUserRole Hook
 *
 * Hook for getting current user's role and permissions
 * Used to determine navigation access and UI rendering
 */

"use client";

import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

export const GET_CURRENT_USER_ROLE = gql`
  query GetCurrentUserRole {
    currentUserRole {
      isAuthenticated
      isStaff
      isCategoryAdmin
      isGroupAdmin
      isContentAdmin
      canSendBulkMessage
      isRecorder
      canVoidReceipts
      isAdmin
      isTreasurer
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
  /** Holds the `recorder` role (T2.1). May also be staff. */
  isRecorder: boolean;
  /** Admin or treasurer — may void receipts / approve void requests. */
  canVoidReceipts: boolean;
  /** Holds the `admin` role. */
  isAdmin: boolean;
  /** Holds the `treasurer` role. */
  isTreasurer: boolean;
  adminCategoryIds: string[];
  adminGroupNames: string[];
  adminCategories: Category[];
}

/** Every feature key understood by `canAccessFeature`. */
export type AdminFeature =
  | "members"
  | "reports"
  | "category-admins"
  | "categories"
  | "groups"
  | "contributions"
  | "overview"
  | "c2b-transactions"
  | "content"
  | "messaging"
  | "prayers"
  | "expenses"
  | "leaders"
  | "record"
  | "catch-up-windows"
  | "collection-sessions"
  | "receipts";

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
    isRecorder: roleInfo?.isRecorder ?? false,
    canVoidReceipts: roleInfo?.canVoidReceipts ?? false,
    isAdmin: roleInfo?.isAdmin ?? false,
    isTreasurer: roleInfo?.isTreasurer ?? false,

    // Treasurer or admin: may change the treasury books (opening balance,
    // remittances). Pastors are staff but read-only here.
    canManageBooks: !!(roleInfo?.isAdmin || roleInfo?.isTreasurer),

    // A recorder without staff rights: confined to the /record workspace
    // (plus their own member area). Server-side checks are authoritative.
    isPureRecorder: !!roleInfo?.isRecorder && !roleInfo?.isStaff,

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
    canAccessFeature: (feature: AdminFeature) => {
      if (!roleInfo) return false;

      // Full staff can access everything (incl. expenses — treasurer/admin are
      // staff, and the recorder workspace — RR-9)
      if (roleInfo.isStaff) return true;

      // Recorder workspace: recorders only. A pure recorder gets nothing else
      // from this role — every other feature below requires a separate role.
      if (feature === "record") return !!roleInfo.isRecorder;

      // Messaging: staff + dept_admin + group_admin (canSendBulkMessage covers all)
      if (feature === "messaging") return roleInfo.canSendBulkMessage;

      // Content admins can access content + the leaders/about directory
      if (roleInfo.isContentAdmin) {
        return feature === "content" || feature === "leaders";
      }

      // Category (department) admins can access overview, contributions, scoped
      // reports, and expenses — they raise expense requests for their own funds
      // (approval is enforced server-side under the four-eyes rule).
      if (roleInfo.isCategoryAdmin) {
        return feature === "overview" || feature === "contributions" || feature === "reports" || feature === "expenses";
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
