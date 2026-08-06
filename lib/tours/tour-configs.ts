/**
 * Tour Configuration Examples
 * These are ready-to-use tour definitions for the three initial onboarding flows
 */

import type { Config } from 'driver.js';

/**
 * Welcome Tour - Introduces new users to the main dashboard
 * Targets: Header, Stats Cards, Quick Actions
 * Trigger: First login (check isNewMember from auth response)
 */
export const WELCOME_TOUR_CONFIG: Config = {
  showProgress: true,
  allowClose: true,
  overlayOpacity: 0.5,
  stagePadding: 10,
  steps: [
    {
      element: '[data-tour="dashboard-header"]',
      popover: {
        title: 'Welcome to Church Funds System',
        description: 'Your dashboard keeps track of giving activity, totals, and recent updates.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="dashboard-stats"]',
      popover: {
        title: 'Giving Summary',
        description: 'See your totals, monthly giving, and contribution status at a glance.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="dashboard-snapshot"]',
      popover: {
        title: 'Quick Actions',
        description: 'Jump straight to totals or start a new contribution from here.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="dashboard-history"]',
      popover: {
        title: 'Your Giving History',
        description: 'View all your past contributions with dates, amounts, and confirmation details.',
        side: 'bottom',
        align: 'center',
      },
    },
  ],
};

/**
 * Contribution Flow Tour - Guides users through making their first contribution
 * Targets: Category Selector, Amount Input, Payment Method
 * Trigger: User navigates to contribution page for first time
 */
export const CONTRIBUTION_FLOW_TOUR_CONFIG: Config = {
  showProgress: true,
  allowClose: true,
  overlayOpacity: 0.5,
  stagePadding: 10,
  steps: [
    {
      element: '[data-tour="contribution-form"]',
      popover: {
        title: 'Contribution Form',
        description: 'This form guides you through multi-department giving in a single M-Pesa prompt.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="contribution-header"]',
      popover: {
        title: 'Contribution Details',
        description: 'Review the guidance for contributing across departments and purposes.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="contribution-phone"]',
      popover: {
        title: 'Confirm Phone',
        description: 'Confirm the M-Pesa number that will receive the payment prompt.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="contribution-categories"]',
      popover: {
        title: 'Select Departments',
        description: 'Add one or more departments, purposes, and amounts for your contribution.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="contribution-multi-department-hint"]',
      popover: {
        title: 'One Payment, Multiple Departments',
        description: 'Tap "Add another fund" to split a single M-Pesa payment across several departments or purposes — everything combines into one total charge and one prompt on your phone.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="contribution-review-btn"]',
      popover: {
        title: 'Review & Continue',
        description: 'Review your selections before the M-Pesa prompt is sent.',
        side: 'bottom',
        align: 'center',
      },
    },
  ],
};

/**
 * Admin Dashboard Tour - Teaches admin users dashboard navigation
 * Targets: Stats Overview, Member Management, Reports
 * Trigger: When user with admin role accesses admin panel
 */
export const ADMIN_DASHBOARD_TOUR_CONFIG: Config = {
  showProgress: true,
  allowClose: true,
  overlayOpacity: 0.5,
  stagePadding: 10,
  steps: [
    {
      element: '[data-tour="admin-header"]',
      popover: {
        title: 'Admin Dashboard',
        description: 'Your control center for finance, members, and activity insights.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="admin-stats"]',
      popover: {
        title: 'Financial Overview',
        description: 'Track daily, weekly, and monthly contribution totals with trends.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="admin-contributions"]',
      popover: {
        title: 'Recent Contributions',
        description: 'Review the latest contributions and their statuses.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="admin-members"]',
      popover: {
        title: 'Member Snapshot',
        description: 'Monitor member totals and quick stats for health checks.',
        side: 'bottom',
        align: 'center',
      },
    },
  ],
};

/**
 * Role-aware variant of the Admin Dashboard tour.
 *
 * The static ADMIN_DASHBOARD_TOUR_CONFIG above stays as the generic/full-staff
 * copy (and keeps the existing tour-configs test — which imports it directly
 * as a plain `Config` — passing unchanged). The Admin Overview page instead
 * calls this builder with the viewer's `useUserRole()` scope so Dept Admins,
 * Group Admins, and Content Admins see wording about *their* scope rather
 * than generic "full staff" language. Targets the same four `data-tour`
 * anchors as the static config, so it's a drop-in replacement on that page.
 */
export interface AdminDashboardTourScope {
  isStaff: boolean;
  isCategoryAdmin: boolean;
  isGroupAdmin: boolean;
  isContentAdmin: boolean;
  adminCategories: Array<{ name: string }>;
  adminGroupNames: string[];
}

function joinNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export function buildAdminDashboardTourConfig(scope: AdminDashboardTourScope): Config {
  const deptNames = scope.adminCategories.map((c) => c.name).filter(Boolean);
  const groupNames = scope.adminGroupNames.filter(Boolean);

  let headerDescription = 'Your control center for finance, members, and activity insights.';
  let statsDescription = 'Track daily, weekly, and monthly contribution totals with trends.';
  let contributionsDescription = 'Review the latest contributions and their statuses.';
  let membersDescription = 'Monitor member totals and quick stats for health checks.';

  if (scope.isStaff) {
    // Full staff keeps the generic copy above — they see everything.
  } else if (scope.isCategoryAdmin && deptNames.length > 0) {
    const scopeLabel = joinNames(deptNames);
    const plural = deptNames.length > 1;
    headerDescription = `Your control center for ${scopeLabel} — giving and activity for the department${plural ? 's' : ''} you manage.`;
    statsDescription = 'These totals cover the whole church; open Contributions in the sidebar and filter by department for a scoped view.';
    contributionsDescription = `Review the latest contributions here, or filter to ${scopeLabel} from the Contributions page.`;
    membersDescription = 'Member totals here are church-wide; your department reporting lives under Reports in the sidebar.';
  } else if (scope.isGroupAdmin && groupNames.length > 0) {
    const scopeLabel = joinNames(groupNames);
    const plural = groupNames.length > 1;
    headerDescription = `Your control center for ${scopeLabel} — giving and activity for the group${plural ? 's' : ''} you lead.`;
    statsDescription = 'These totals cover the whole church; the Contributions page automatically scopes to the group(s) you lead.';
    contributionsDescription = `Review the latest contributions here — Contributions in the sidebar scopes automatically to ${scopeLabel}.`;
    membersDescription = 'Member totals here are church-wide; your group reporting lives under Reports in the sidebar.';
  } else if (scope.isContentAdmin) {
    headerDescription = 'This overview covers church-wide finance and membership stats. Your own scope — Devotionals, Events, and YouTube — lives under Content in the sidebar.';
  }

  return {
    showProgress: true,
    allowClose: true,
    overlayOpacity: 0.5,
    stagePadding: 10,
    steps: [
      {
        element: '[data-tour="admin-header"]',
        popover: {
          title: 'Admin Dashboard',
          description: headerDescription,
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="admin-stats"]',
        popover: {
          title: 'Financial Overview',
          description: statsDescription,
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="admin-contributions"]',
        popover: {
          title: 'Recent Contributions',
          description: contributionsDescription,
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="admin-members"]',
        popover: {
          title: 'Member Snapshot',
          description: membersDescription,
          side: 'bottom',
          align: 'center',
        },
      },
    ],
  };
}

/**
 * Tour Step Helpers - Reusable configurations
 */

// Standard step configuration preset
export const defaultStepConfig = {
  side: 'bottom' as const,
  align: 'center' as const,
};

// Mobile-friendly step configuration
export const mobileStepConfig = {
  side: 'bottom' as const,
  align: 'center' as const,
};

/**
 * Helper function to create a custom tour config
 */
export function createTourConfig(
  steps: Array<{
    element: string;
    title: string;
    description: string;
    side?: 'left' | 'right' | 'top' | 'bottom';
    align?: 'start' | 'center' | 'end';
  }>
): Config {
  return {
    showProgress: true,
    allowClose: true,
    overlayOpacity: 0.5,
    stagePadding: 10,
    steps: steps.map((step) => ({
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side || 'bottom',
        align: step.align || 'center',
      },
    })),
  };
}
