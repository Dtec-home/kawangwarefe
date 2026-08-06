/**
 * Admin Manual Contribution Entry Tour
 * Route: /admin/contributions/manual-entry
 *
 * Walks a staff/admin user through recording a contribution that wasn't
 * paid via the M-Pesa till prompt (envelope, cash, or another manual
 * method): identifying the giver, entering department/purpose/amount
 * lines, the auto-assigned book receipt number, and the save actions.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_MANUAL_ENTRY_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="manual-entry-header"]',
    title: "Manual Contribution Entry",
    description:
      "Record a contribution given by envelope, cash, or another manual method — not through the M-Pesa till prompt.",
    side: "bottom",
  },
  {
    element: '[data-tour="manual-entry-identity"]',
    title: "Identify the Giver",
    description:
      "Look up an existing member by phone number, or flip Walk-in / no phone for a giver with no phone on file. Walk-in entries don't get an SMS receipt.",
    side: "bottom",
  },
  {
    element: '[data-tour="manual-entry-details"]',
    title: "Departments & Amounts",
    description:
      "Pick an Entry Type, then add one or more departments — each with its own purpose and amount — as separate line items.",
    side: "top",
  },
  {
    element: '[data-tour="manual-entry-receipt"]',
    title: "Book Receipt Number",
    description:
      "Leave this blank to use the next auto-assigned book receipt number shown, or type your own to override it.",
    side: "top",
  },
  {
    element: '[data-tour="manual-entry-actions"]',
    title: "Save & Next Steps",
    description:
      "Save Contribution records the entry. Add Another appears after a successful save so you can log the next one quickly. View All Contributions and Receipt Book Settings are shortcuts from here too.",
    side: "top",
  },
]);
