/**
 * Tour config for /admin/messaging (bulk SMS messaging).
 *
 * Only steps that target elements inside the default-active "Quick Send"
 * tab (plus the always-mounted header/tab-trigger elements) are safe here —
 * Radix Tabs unmounts inactive TabsContent, so anything inside the
 * Compose/Templates/History panels wouldn't exist in the DOM when this
 * tour auto-starts on page load.
 *
 * See lib/tours/tour-configs.ts's createTourConfig() and the directory-level
 * convention comment in lib/help-content/index.ts for naming rules.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_MESSAGING_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="messaging-header"]',
    title: "Messaging",
    description:
      "Send SMS to members. Every send here dispatches real text messages in the background — there's no way to cancel or undo a send once you click it, so always check your recipients and message first.",
    side: "bottom",
  },
  {
    element: '[data-tour="messaging-tabs"]',
    title: "Quick Send, Campaigns, Templates & History",
    description:
      "Quick Send is for a one-off message to a handful of people. New Campaign is for targeting a whole department, group, or role with a saved template. Templates stores reusable message text. History shows every past send.",
    side: "bottom",
  },
  {
    element: '[data-tour="messaging-quick-card"]',
    title: "Quick Send",
    description:
      "Write your message, then add recipients by searching for members by name/phone or by pasting phone numbers directly. The Send button shows exactly how many people will receive it — that count is your last chance to double-check before sending.",
    side: "top",
  },
  {
    element: '[data-tour="messaging-tab-compose"]',
    title: "Targeting a Department or Group",
    description:
      "For larger audiences, switch to New Campaign — you can target by department, group, role, or specific members, and preview the exact recipient count and sample messages before the final Send.",
    side: "bottom",
  },
  {
    element: '[data-tour="messaging-tab-history"]',
    title: "Reviewing Past Sends",
    description:
      "History lists every campaign with sent/failed counts. Click into one to see per-recipient delivery status and export a CSV of failed numbers to follow up manually.",
    side: "bottom",
  },
]);
