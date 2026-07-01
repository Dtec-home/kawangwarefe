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
