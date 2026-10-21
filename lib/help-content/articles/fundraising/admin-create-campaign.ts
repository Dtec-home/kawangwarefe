import type { HelpArticle } from "../../types";

export const FUNDRAISING_CREATE_CAMPAIGN_ARTICLE: HelpArticle = {
  slug: "fundraising-create-campaign",
  title: "Creating and submitting a fundraising campaign",
  category: "Fundraising",
  roles: ["admin"],
  relatedRoute: "/admin/campaigns/new",
  body: `A campaign is a drive with a target and a deadline, such as a building fund or a harambee. It is not a separate fund: every gift to it is recorded as a normal gift to its department, tagged with the campaign, so the department's books and the Cash Statement are unchanged.

Staff (admin, treasurer, pastor) can create campaigns for any department. Department admins can create them for their own departments.

**1. Start a new campaign**
Go to Admin → Fundraising → Campaigns and tap "New campaign".

**2. Fill in the details**
- Title, Summary (one line for share previews) and Story: what you are raising money for, how much, and by when.
- Cover image link and Gallery: links to photos or YouTube videos. There is no upload, so paste a full web address starting with https://.
- Department (required) and Purpose (optional): where the money is recorded.
- Target (KES), Start date and End date. Leave the end date empty for an open-ended campaign.
- Pay Bill account code: 2 to 10 capital letters or digits, no spaces, for example BUILD. Givers type it as the account number on the church Pay Bill. It must not be used by another campaign or a department.

**3. Choose the settings**
- Show on the public website: anyone with the link sees the progress (totals only, never names).
- Allow pledges: members and visitors may promise an amount to give later.
- Allow champions: members may raise money with their own code and link.
- Pledge reminders: how often (monthly, weekly or none), how many days before the due date, and how many overdue notices. SMS reminders go out only between 8am and 8pm.

**4. Save as draft**
The campaign is saved as a Draft. Nobody can give to it yet, and it has no public page.

**5. Submit for approval**
Open the campaign and tap "Submit for approval" on the Overview tab. Another admin or pastor must now approve it (see "Approving a campaign").

**Editing later**
Use Edit on the Overview tab. While the campaign is a draft or awaiting approval you can change everything. Once it is approved, the department, purpose and Pay Bill code are locked, because money has been routed under them and the code has been shared. A closed campaign cannot be edited. The web link is made from the first title and never changes.`,
};
