import type { HelpArticle } from "../../types";

export const FUNDRAISING_POST_UPDATE_ARTICLE: HelpArticle = {
  slug: "fundraising-post-update",
  title: "Posting a campaign update and texting donors",
  category: "Fundraising",
  roles: ["admin"],
  relatedRoute: "/admin/campaigns",
  body: `Updates keep givers in the loop: progress, photos and thank-yous. They appear on the public campaign page straight away, newest first. Staff and the campaign's department admins can post them.

**1. Open the Updates tab**
Go to Admin → Fundraising → Campaigns, open the campaign and choose "Updates".

**2. Write the update**
- Title (up to 150 characters), for example "The roof is on".
- Message: what happened, and thank you to everyone who gave. Leave a blank line between paragraphs.
- Image URL (optional): a full web address starting with https://.

**3. Also SMS everyone who has given (optional)**
Tick this to text every donor who has a phone: "<campaign>: <update title>. <link to the campaign page>". The SMS is sent through the normal bulk messaging, so it uses SMS credit, counts towards the daily SMS limit and shows up on the Messaging pages.

**4. Post update**
The update is saved even if the SMS cannot be sent. The message after posting tells you whether the SMS was queued, and to how many donors.

**When you can post**
On active, paused and closed campaigns. A closing "we made it, thank you" is a common update. You cannot post on a draft or a campaign awaiting approval, because it has no public page yet.

**Removing an update**
Use Remove on the update. It disappears from the public page. Posting, removing and SMS sends are all written to the audit log.`,
};
