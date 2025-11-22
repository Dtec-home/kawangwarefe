/**
 * User Role Queries
 * Check user permissions and roles
 */

import { gql } from "@apollo/client";

/**
 * Check if current user has staff role
 */
export const CHECK_USER_ROLE = gql`
  query CheckUserRole {
    dashboardStats {
      todayTotal
    }
  }
`;
