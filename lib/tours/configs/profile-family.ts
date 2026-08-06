/**
 * Family page tour ("/profile/family").
 *
 * Introduces the dependents list and the "Add a child" form. Paired with
 * `profile_family_v1` as the `useTour({ tourKey })` / tutorial key on
 * app/(dashboard)/profile/family/page.tsx.
 */

import { createTourConfig } from "../tour-configs";

export const PROFILE_FAMILY_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="family-header"]',
    title: "Manage Your Family",
    description:
      "Add children under your care — they do not sign in separately, and you remain responsible for their church records and giving.",
  },
  {
    element: '[data-tour="family-list"]',
    title: "Your Dependents",
    description:
      "Children you've added appear here, along with their member number and whether they're flagged as a minor.",
  },
  {
    element: '[data-tour="family-add-form"]',
    title: "Add a Child",
    description:
      "Enter a first and last name (letters, spaces, hyphens or apostrophes) and an optional date of birth, then submit.",
  },
]);
