/**
 * Tour config for /admin/receipt-settings (Receipt Book Settings).
 *
 * See lib/tours/tour-configs.ts's createTourConfig() and the directory-level
 * convention comment in lib/help-content/index.ts for naming rules.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_RECEIPT_SETTINGS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="receipt-settings-header"]',
    title: "Receipt Book Settings",
    description:
      "This configures the church-wide auto-incrementing manual receipt number sequence — the number assigned automatically whenever staff leave the receipt number blank on a manual contribution entry.",
    side: "bottom",
  },
  {
    element: '[data-tour="receipt-settings-card"]',
    title: "Prefix, Next Number & Padding",
    description:
      "Set a text prefix (e.g. \"MB-\"), the next number to assign, and how many digits to zero-pad it to (1–10). The box above the form always shows the next number that will be auto-assigned with your current settings.",
    side: "bottom",
  },
  {
    element: '[data-tour="receipt-settings-save"]',
    title: "Save Settings",
    description:
      "Saving applies immediately — the very next manual entry left blank will use this sequence.",
    side: "top",
  },
]);
