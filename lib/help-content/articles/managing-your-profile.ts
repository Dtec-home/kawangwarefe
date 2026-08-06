import type { HelpArticle } from "../types";

export const MANAGING_YOUR_PROFILE_ARTICLE: HelpArticle = {
  slug: "managing-your-profile",
  title: "Managing Your Profile",
  category: "Account & Profile",
  roles: ["member", "admin"],
  body: `Your Profile page (My Profile) is where you keep your account details up to date.

Photo: upload a PNG or JPEG from your device, or use "Take photo" to capture one with your camera — it's resized automatically.

Department & groups: pick your department from the dropdown, then choose from the groups available to that department. Changing your department clears your current group selections so you re-pick from the newly available list — remember to press "Save changes" afterwards.

Contribution totals: the "My Contribution Breakdown" card shows your completed giving totals, broken down by department, by purpose, and by group.

Quick links: use the "Manage family" and "Notifications" buttons to jump straight to those settings.

Tutorials & walkthroughs: if you want to see the guided tours again — on this page or any other — open the "Tutorials & walkthroughs" card and choose "Replay all tutorials". This resets the welcome carousel and every guided tour you've already dismissed so they show again as you revisit each page.`,
  relatedRoute: "/profile",
  relatedTourKey: "profile_v1",
};
