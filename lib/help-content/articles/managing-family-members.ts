import type { HelpArticle } from "../types";

export const MANAGING_FAMILY_MEMBERS_ARTICLE: HelpArticle = {
  slug: "managing-family-members",
  title: "Managing Family Members",
  category: "Account & Profile",
  roles: ["member", "admin"],
  body: `The Family page (accessible from My Profile → "Manage family") lets you add children under your care.

Children you add do not sign in separately — you remain responsible for their church records and giving. Each child gets their own member number and can be flagged as a minor.

To add a child, enter a first and last name (letters, spaces, hyphens or apostrophes, 2-50 characters) and an optional date of birth, then submit. Your existing dependents are listed above the form, along with their member number and minor status.`,
  relatedRoute: "/profile/family",
  relatedTourKey: "profile_family_v1",
};
