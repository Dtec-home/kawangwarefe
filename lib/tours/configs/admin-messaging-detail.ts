/**
 * Tour config for /admin/messaging/[id] (campaign detail / results).
 *
 * See lib/tours/tour-configs.ts's createTourConfig() and the directory-level
 * convention comment in lib/help-content/index.ts for naming rules.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_MESSAGING_DETAIL_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="campaign-detail-header"]',
    title: "Campaign Results",
    description:
      "This page is read-only — it shows what already happened after a send. There's no resend, cancel, or delete action here; it's purely for reviewing delivery.",
    side: "bottom",
  },
  {
    element: '[data-tour="campaign-detail-progress"]',
    title: "Sent, Failed & Total",
    description:
      "This card refreshes automatically every few seconds while the campaign is in flight, so you can watch sent/failed counts update in real time.",
    side: "bottom",
  },
  {
    element: '[data-tour="campaign-detail-recipients"]',
    title: "Per-Recipient Status & Failure Export",
    description:
      "Every recipient's phone number, delivery status, and any provider error is listed here. Use \"Export failures (CSV)\" to download just the failed numbers so you can follow up outside the system.",
    side: "top",
  },
]);
