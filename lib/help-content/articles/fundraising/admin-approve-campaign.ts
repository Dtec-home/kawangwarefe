import type { HelpArticle } from "../../types";

export const FUNDRAISING_APPROVE_CAMPAIGN_ARTICLE: HelpArticle = {
  slug: "fundraising-approve-campaign",
  title: "Approving a campaign (four-eyes rule)",
  category: "Fundraising",
  roles: ["admin"],
  relatedRoute: "/admin/campaigns",
  body: `A campaign goes live only after a second person approves it. This is the four-eyes rule: the approver must be an admin or pastor, and must not be the person who created the campaign. A treasurer or department admin cannot approve, and nobody can approve their own campaign.

**1. Find campaigns waiting for approval**
Go to Admin → Fundraising → Campaigns and filter the list by status "Awaiting approval".

**2. Check the campaign**
Open it and read the Overview: title, story, department, target, dates, Pay Bill code and settings. You approve the campaign exactly as it stands, so check it carefully. After approval the department, purpose and Pay Bill code can no longer be changed.

**3. Approve, or return it to draft**
- Approve: the campaign becomes Active. It starts taking gifts on its Pay Bill code, and its public page opens if "Show on the public website" is on.
- Return to draft: sends it back to the creator for changes. Give a reason of at least 5 characters; it is saved in the audit log.

If you created the campaign yourself, you will not see Approve. Instead you will see "Waiting for approval. Another admin or pastor must approve this campaign".

**After approval**
- Pause stops gifts for a while (the Pay Bill code stops routing and the page shows "not taking gifts right now"). Resume starts them again.
- While a campaign is paused, a Pay Bill payment to its code is not lost: it goes to the unresolved Pay Bill queue for the treasurer to allocate.
- Every approval, pause and resume is written to the audit log.`,
};
