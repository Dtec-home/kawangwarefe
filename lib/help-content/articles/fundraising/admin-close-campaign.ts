import type { HelpArticle } from "../../types";

export const FUNDRAISING_CLOSE_CAMPAIGN_ARTICLE: HelpArticle = {
  slug: "fundraising-close-campaign",
  title: "Closing a campaign",
  category: "Fundraising",
  roles: ["admin"],
  relatedRoute: "/admin/campaigns",
  body: `Close a campaign when the drive is over. Staff and the campaign's department admins can close it. Only an active or paused campaign can be closed, and a closed campaign can't be reopened.

**1. Open the Close out tab**
Go to Admin → Fundraising → Campaigns, open the campaign and choose "Close out".

**2. Check the figures**
Look at the Statement tab first. Make sure late gifts have been receipted and expenses charged.

**3. Close campaign**
Tap "Close campaign" and confirm. In one step the system:
- stops the campaign taking gifts. Its Pay Bill code returns to normal department matching, so a late Pay Bill payment to the code goes to the unresolved Pay Bill queue for the treasurer to allocate;
- builds the final statement for the whole campaign;
- saves the final figures (money in, money out, balance) in the audit log.

**What happens to money left over**
Any money left over stays in the campaign's department; nothing is moved. It was always recorded there, so there is no transfer to make.

**After closing**
- The Close out tab shows who closed the campaign and when, with the final Money in, Money out and Left over.
- The public page stays open, so old links still work, but it shows "This campaign is not taking gifts right now".
- You can still post a thank-you update.
- Late bills, such as a contractor's retention, can still be charged to the closed campaign. They appear on its statement and are paid from the same department.`,
};
