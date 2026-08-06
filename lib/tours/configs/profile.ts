/**
 * Profile page tour ("/profile").
 *
 * Walks a member through updating their photo, department & groups, where to
 * find their contribution totals, and the quick links to Family and
 * Notification settings. Paired with `profile_v1` as the `useTour({ tourKey })`
 * / tutorial key on app/(dashboard)/profile/page.tsx.
 */

import { createTourConfig } from "../tour-configs";

export const PROFILE_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="profile-header"]',
    title: "Your Profile",
    description:
      "Update your department and the groups you belong to from this page.",
  },
  {
    element: '[data-tour="profile-avatar"]',
    title: "Profile Photo",
    description:
      "Upload a photo from your device, or take one with your camera.",
  },
  {
    element: '[data-tour="profile-totals"]',
    title: "Contribution Totals",
    description:
      "See your completed giving broken down by department, purpose, and group.",
  },
  {
    element: '[data-tour="profile-department"]',
    title: "Department & Groups",
    description:
      "Changing your department refreshes which groups you can pick from below — choose, then save.",
  },
  {
    element: '[data-tour="profile-links"]',
    title: "More Settings",
    description:
      "Jump to managing your family members or your notification preferences from here.",
  },
]);
