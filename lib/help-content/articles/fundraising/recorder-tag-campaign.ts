import type { HelpArticle } from "../../types";

export const FUNDRAISING_RECORDER_TAG_CAMPAIGN_ARTICLE: HelpArticle = {
  slug: "fundraising-recorder-tag-campaign",
  title: "Putting a desk gift towards a campaign",
  category: "Fundraising",
  roles: ["recorder"],
  relatedRoute: "/record",
  body: `When someone gives cash or an envelope for a fundraising campaign, such as the building fund, tag the line with the campaign so it counts towards the campaign's target.

**1. Record the gift as usual**
On Record giving (/record), look up the giver, then add a line for the department the campaign belongs to (for example Building) with the amount.

**2. Choose the campaign**
If that department has an active campaign, a "Fundraising campaign (optional)" box appears under the lines, with one row per eligible line ("Line 1 · Building"). Pick the campaign for that line. Leave it on "No campaign" for an ordinary gift.
- Only campaigns of the line's own department are offered, so each campaign appears only on lines for its department.
- If you change the line's department, its campaign is cleared.
- Paused, closed and unapproved campaigns are not listed.

**3. Review & save**
The gift is recorded in the department as normal, tagged with the campaign. The giver's SMS receipt adds "Towards: <campaign>" and a note that contributors are listed by name and amount in the church WhatsApp group.

**Giving through a champion?**
After choosing the campaign, type the champion's code in the box next to it (for example JOHN). If the code isn't an active champion of that campaign, the entry is refused with a message, so check the code with the giver.

**A phone number the church hasn't seen before?**
You'll be asked for the giver's full name. It is saved with the number, so their receipts and the campaign's contributor list show their name instead of "Guest Member".

**Tagged the wrong campaign?**
You can't edit an entry. Ask for it to be voided and record it again (see "Reprinting, resending and requesting a void").

Admins see the same "Fundraising campaign" box on Admin → Manual entry.`,
};
